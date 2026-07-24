import { json, readJson } from "../lib/http";
import type { Env } from "../lib/db";

// Same bot regex the pageview beacon uses. Copy-paste (not shared) so
// changes to one don't accidentally affect the other — event tracking
// might legitimately want to include some previewer clicks later.
const BOT_RE =
  /bot|spider|crawl|scraper|preview|slurp|mediapartners|pinterest|discordbot|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|applebot|semrush|ahrefs|petalbot|dataforseoowler|gptbot|claudebot|perplexity|chatgpt|anthropic|bytespider|yandex|duckduckbot|megaindex|dotbot/i;

const IGNORED_PATH_PREFIXES = ["/admin", "/api", "/cdn-cgi"];

// Whitelist for event labels — anything else gets rejected. Keeps the
// events table clean if a bug or bad actor tries to spam arbitrary labels.
// Coach phone labels use a wildcard match on `coach_phone_<slug>` since
// slugs come from D1 and can grow over time.
const LABEL_EXACT = new Set<string>(["book_a_bay"]);
const LABEL_PREFIXES = ["coach_phone_"];

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

function validId(s: unknown): s is string {
  return (
    typeof s === "string" && s.length >= 8 && s.length <= 80 && /^[A-Za-z0-9_-]+$/.test(s)
  );
}

function validLabel(s: unknown): s is string {
  if (typeof s !== "string" || s.length === 0 || s.length > 80) return false;
  if (!/^[a-z0-9_.-]+$/i.test(s)) return false;
  if (LABEL_EXACT.has(s)) return true;
  return LABEL_PREFIXES.some((p) => s.startsWith(p) && s.length > p.length);
}

// POST /api/e
// Fired by trackClick() from src/lib/analytics.ts. Body:
//
// Endpoint name is intentionally short/opaque (`/api/e` not `/api/event`)
// to slip past client-side ad-blocker lists that filter obvious tracking
// paths — uBlock/Brave/Safari ITP heuristics match "event" but not "e".
//   { event_name, label, target?, path, session_id, visitor_id }
// Silent 200 on malformed input so a bad beacon can't produce console
// noise on the visitor's browser.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const ua = request.headers.get("user-agent") || "";
  if (BOT_RE.test(ua)) return json({ ok: true, ignored: "bot" });

  const body = (await readJson(request).catch(() => null)) as
    | {
        event_name?: string;
        label?: string;
        target?: string;
        path?: string;
        session_id?: string;
        visitor_id?: string;
      }
    | null;
  if (!body) return json({ ok: true, ignored: "no_body" });

  const eventName = String(body.event_name ?? "").trim();
  if (eventName !== "click") return json({ ok: true, ignored: "bad_event_name" });

  if (!validLabel(body.label)) return json({ ok: true, ignored: "bad_label" });

  const path = normalizePath(body.path ?? "");
  if (!path) return json({ ok: true, ignored: "bad_path" });
  if (IGNORED_PATH_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) {
    return json({ ok: true, ignored: "path_prefix" });
  }

  if (!validId(body.session_id) || !validId(body.visitor_id)) {
    return json({ ok: true, ignored: "bad_ids" });
  }

  const target =
    typeof body.target === "string" && body.target.length <= 500 ? body.target : null;

  try {
    await env.DB.prepare(
      `INSERT INTO events (event_name, label, target, path, session_id, visitor_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(eventName, body.label as string, target, path, body.session_id, body.visitor_id)
      .run();
  } catch (e) {
    console.error(`[event] insert failed: ${(e as Error).message}`);
  }
  return json({ ok: true });
};
