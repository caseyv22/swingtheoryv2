import { json, readJson } from "../lib/http";
import type { Env } from "../lib/db";

// Bots we filter at ingest time so the analytics table stays clean. The
// list is intentionally broad — any UA matching this regex gets its
// pageview dropped silently (returned 200 so we don't tip off scrapers).
// Casey's site.socials includes Instagram and share previewers, which
// are also bots for our purposes — we don't want their previews inflating
// pageview counts.
const BOT_RE =
  /bot|spider|crawl|scraper|preview|slurp|mediapartners|pinterest|discordbot|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|applebot|semrush|ahrefs|petalbot|dataforseoowler|gptbot|claudebot|perplexity|chatgpt|anthropic|bytespider|yandex|duckduckbot|megaindex|dotbot/i;

// Paths we don't want in analytics — internal admin pages and API routes.
// The beacon in Layout doesn't fire for these (admin lives under a
// separate layout) but the /api/pv endpoint hard-filters as a backstop
// in case anything hand-crafts a call.
const IGNORED_PATH_PREFIXES = ["/admin", "/api", "/cdn-cgi"];

// Normalize whatever the client sends into a clean pathname:
//   - Force leading slash
//   - Strip query string + hash
//   - Strip trailing slash except for root
//   - Truncate very long paths so a malformed input can't blow up the table
function normalizePath(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;
  let p = raw.trim();
  const qIx = p.indexOf("?");
  if (qIx >= 0) p = p.slice(0, qIx);
  const hIx = p.indexOf("#");
  if (hIx >= 0) p = p.slice(0, hIx);
  if (!p.startsWith("/")) p = "/" + p;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  if (p.length > 200) return null;
  return p;
}

// Extract the host from a Referer URL, minus any leading www. Returns null
// for same-origin referrers so /admin/analytics doesn't count internal
// navigation as an external referral.
function extractReferrerHost(ref: string, ownHost: string): string | null {
  if (!ref || typeof ref !== "string") return null;
  try {
    const u = new URL(ref);
    let host = u.hostname.toLowerCase();
    if (host.startsWith("www.")) host = host.slice(4);
    if (host === ownHost || host === ownHost.replace(/^www\./, "")) return null;
    if (host.length > 120) return null;
    return host;
  } catch {
    return null;
  }
}

// Reasonable length + format check on IDs the client generated. We accept
// any short string, but bail on anything obviously malformed so we don't
// pollute the sessions/visitors columns.
function validId(s: unknown): s is string {
  return typeof s === "string" && s.length >= 8 && s.length <= 80 && /^[A-Za-z0-9_-]+$/.test(s);
}

// POST /api/pv
// Fired by the client on every route change. Body: { path, referrer,
// session_id, visitor_id }. All parsed defensively — malformed input
// results in a silent 200 (we never surface an error to the visitor's
// browser; a bad beacon shouldn't produce console noise on their end).
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const ua = request.headers.get("user-agent") || "";
  if (BOT_RE.test(ua)) return json({ ok: true, ignored: "bot" });

  const body = (await readJson(request).catch(() => null)) as
    | { path?: string; referrer?: string; session_id?: string; visitor_id?: string }
    | null;
  if (!body) return json({ ok: true, ignored: "no_body" });

  const path = normalizePath(body.path ?? "");
  if (!path) return json({ ok: true, ignored: "bad_path" });
  if (IGNORED_PATH_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) {
    return json({ ok: true, ignored: "path_prefix" });
  }

  if (!validId(body.session_id) || !validId(body.visitor_id)) {
    return json({ ok: true, ignored: "bad_ids" });
  }

  // Prefer request.headers over URL construction, no need for a Host
  // header for our purposes since referrer parsing does its own validation.
  const ownHost = (request.headers.get("host") || "swingtheory.golf").toLowerCase();
  const referrerHost = extractReferrerHost(body.referrer ?? "", ownHost);

  const country = request.headers.get("cf-ipcountry") || null;

  try {
    await env.DB.prepare(
      `INSERT INTO pageviews (path, session_id, visitor_id, referrer_host, country, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(path, body.session_id, body.visitor_id, referrerHost, country, ua.slice(0, 400))
      .run();
  } catch (e) {
    console.error(`[pv] insert failed: ${(e as Error).message}`);
    // Still 200 so the client doesn't retry.
  }
  return json({ ok: true });
};
