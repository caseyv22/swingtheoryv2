import { json } from "../../lib/http";
import type { Env } from "../../lib/db";

// POST /api/internal/weekly-analytics-email
//
// Weekly analytics digest, modeled after the Burst Statistics weekly email
// that Casey was getting on the WordPress site. Called by an external cron
// (GitHub Actions workflow at .github/workflows/weekly-analytics.yml) every
// Monday at 15:00 UTC.
//
// Auth: shared secret in the X-Internal-Secret header, matched against
// env.WEEKLY_ANALYTICS_SECRET (same value stored in GitHub repo secrets).
//
// Period model:
//   - "This week" = most recent complete Monday–Sunday.
//   - "Last week" = the Monday–Sunday before that. Used for W/W deltas.
//   - Both bounds are computed in UTC so they match SQLite's datetime('now')
//     format the pageviews table uses.
//
// Query pattern is deliberately the same as /api/admin/analytics so the
// email numbers match what shows up in the admin dashboard.
//
// Response: { ok: true, sent_to, period, metrics } so the caller (and any
// future observability tooling) can log what was actually sent. Never
// returns 500 unless something is genuinely broken; a bad Resend response
// is a 502.

// ─── Time helpers ──────────────────────────────────────────────────────────
// Format a JS Date as SQLite's default `YYYY-MM-DD HH:MM:SS` (UTC).
function sqliteFmt(d: Date): string {
  return d.toISOString().slice(0, 19).replace("T", " ");
}

// Return { thisWeekStart, thisWeekEnd, prevWeekStart, prevWeekEnd } as
// SQLite datetime strings for the last two complete Monday–Sunday windows,
// where "now" defaults to current time. Windows are half-open
// [start, end) so we never double-count the boundary second.
function weekWindows(now = new Date()) {
  // JS getUTCDay: 0=Sun..6=Sat. We want the most recent Monday-at-00:00 UTC
  // that is <= now. If today is Monday, "most recent Monday" is today.
  // Then subtract one full week to get "last week's Monday" — that's the
  // start of the completed week the email is about.
  const day = now.getUTCDay(); // 0..6
  const daysSinceMonday = (day + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
  const thisMonday = new Date(now);
  thisMonday.setUTCHours(0, 0, 0, 0);
  thisMonday.setUTCDate(thisMonday.getUTCDate() - daysSinceMonday);

  const thisWeekEnd = thisMonday; // Monday 00:00 UTC — exclusive upper bound
  const thisWeekStart = new Date(thisMonday);
  thisWeekStart.setUTCDate(thisWeekStart.getUTCDate() - 7); // one week earlier

  const prevWeekEnd = thisWeekStart;
  const prevWeekStart = new Date(thisWeekStart);
  prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 7);

  return {
    thisWeekStart: sqliteFmt(thisWeekStart),
    thisWeekEnd: sqliteFmt(thisWeekEnd),
    prevWeekStart: sqliteFmt(prevWeekStart),
    prevWeekEnd: sqliteFmt(prevWeekEnd),
    // Human-friendly display bounds (inclusive end for humans, not SQL)
    displayStart: new Date(thisWeekStart).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "America/Los_Angeles",
    }),
    displayEnd: new Date(thisWeekEnd.getTime() - 1).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "America/Los_Angeles",
    }),
  };
}

// ─── Metric queries ────────────────────────────────────────────────────────
async function metricsFor(
  db: D1Database,
  start: string,
  end: string,
): Promise<{ pageviews: number; sessions: number; visitors: number; bounces: number }> {
  const where = "WHERE created_at >= ? AND created_at < ?";
  const pv = await db
    .prepare(`SELECT COUNT(*) AS c FROM pageviews ${where}`)
    .bind(start, end)
    .first<{ c: number }>();
  const sess = await db
    .prepare(`SELECT COUNT(DISTINCT session_id) AS c FROM pageviews ${where}`)
    .bind(start, end)
    .first<{ c: number }>();
  const vis = await db
    .prepare(`SELECT COUNT(DISTINCT visitor_id) AS c FROM pageviews ${where}`)
    .bind(start, end)
    .first<{ c: number }>();
  const bounce = await db
    .prepare(
      `SELECT COUNT(*) AS c FROM (
         SELECT session_id FROM pageviews ${where}
         GROUP BY session_id HAVING COUNT(*) = 1
       )`,
    )
    .bind(start, end)
    .first<{ c: number }>();
  return {
    pageviews: pv?.c ?? 0,
    sessions: sess?.c ?? 0,
    visitors: vis?.c ?? 0,
    bounces: bounce?.c ?? 0,
  };
}

async function topPages(
  db: D1Database,
  start: string,
  end: string,
  limit: number,
): Promise<Array<{ path: string; pageviews: number }>> {
  const { results = [] } = await db
    .prepare(
      `SELECT path, COUNT(*) AS pageviews FROM pageviews
        WHERE created_at >= ? AND created_at < ?
        GROUP BY path ORDER BY pageviews DESC LIMIT ?`,
    )
    .bind(start, end, limit)
    .all<{ path: string; pageviews: number }>();
  return results;
}

async function topReferrers(
  db: D1Database,
  start: string,
  end: string,
  limit: number,
): Promise<Array<{ host: string; pageviews: number }>> {
  const { results = [] } = await db
    .prepare(
      `SELECT referrer_host AS host, COUNT(*) AS pageviews FROM pageviews
        WHERE created_at >= ? AND created_at < ?
          AND referrer_host IS NOT NULL AND referrer_host != ''
        GROUP BY referrer_host ORDER BY pageviews DESC LIMIT ?`,
    )
    .bind(start, end, limit)
    .all<{ host: string; pageviews: number }>();
  return results;
}

// ─── Delta helpers ────────────────────────────────────────────────────────
function pctDelta(cur: number, prev: number): number | null {
  if (prev === 0) return cur === 0 ? 0 : null;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
}

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Render a "+28%" / "-12%" chip with color coding. `inverse=true` means a
// positive delta is a BAD signal (bounce rate going up). Inline styles
// because email clients don't do <style> reliably.
function renderDelta(delta: number | null, inverse = false): string {
  if (delta === null) {
    return '<span style="color:#888888;font-size:12px;">—</span>';
  }
  const isPositive = delta > 0;
  const isGood = inverse ? !isPositive : isPositive;
  const color = delta === 0 ? "#888888" : isGood ? "#2a7a3c" : "#c0392b";
  const sign = delta > 0 ? "+" : "";
  return `<span style="color:${color};font-size:12px;font-weight:600;">${sign}${delta.toFixed(1)}%</span>`;
}

// ─── HTML email body (inserted inside wrapBrandedEmail's bodyHtml slot) ───
function renderMetricsCard(args: {
  displayStart: string;
  displayEnd: string;
  cur: { pageviews: number; sessions: number; visitors: number; bounces: number };
  prev: { pageviews: number; sessions: number; visitors: number; bounces: number };
  pages: Array<{ path: string; pageviews: number }>;
  referrers: Array<{ host: string; pageviews: number }>;
}): string {
  const curBounce = args.cur.sessions > 0 ? args.cur.bounces / args.cur.sessions : 0;
  const prevBounce = args.prev.sessions > 0 ? args.prev.bounces / args.prev.sessions : 0;

  const dPageviews = pctDelta(args.cur.pageviews, args.prev.pageviews);
  const dSessions = pctDelta(args.cur.sessions, args.prev.sessions);
  const dVisitors = pctDelta(args.cur.visitors, args.prev.visitors);
  const dBounce =
    prevBounce === 0
      ? curBounce === 0
        ? 0
        : null
      : Math.round(((curBounce - prevBounce) / prevBounce) * 1000) / 10;

  const fmtInt = (n: number) => n.toLocaleString("en-US");
  const fmtPct = (n: number) => (n * 100).toFixed(1) + "%";

  const metricRow = (label: string, value: string, delta: string) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #eaf3ec;font-size:14px;color:#333333;">${esc(label)}</td>
      <td style="padding:12px 0;border-bottom:1px solid #eaf3ec;text-align:right;font-size:14px;">
        ${delta}
        <span style="font-size:18px;font-weight:700;color:#064029;margin-left:10px;">${value}</span>
      </td>
    </tr>`;

  const pagesRows =
    args.pages.length === 0
      ? `<tr><td colspan="2" style="padding:16px 0;color:#888888;font-size:13px;">No pageviews this week.</td></tr>`
      : args.pages
          .map(
            (p) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eaf3ec;font-size:13px;color:#333333;font-family:monospace;">${esc(p.path)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eaf3ec;text-align:right;font-size:13px;font-weight:600;color:#064029;">${fmtInt(p.pageviews)}</td>
      </tr>`,
          )
          .join("");

  const refRows =
    args.referrers.length === 0
      ? `<tr><td colspan="2" style="padding:16px 0;color:#888888;font-size:13px;">No external referrers this week.</td></tr>`
      : args.referrers
          .map(
            (r) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eaf3ec;font-size:13px;">
          <a href="https://${esc(r.host)}" style="color:#064029;text-decoration:none;">${esc(r.host)}</a>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #eaf3ec;text-align:right;font-size:13px;font-weight:600;color:#064029;">${fmtInt(r.pageviews)}</td>
      </tr>`,
          )
          .join("");

  return `
<p style="font-size:14px;color:#555555;line-height:1.6;margin:0 0 24px;">
  This report covers ${esc(args.displayStart)} through ${esc(args.displayEnd)}.
</p>

<!-- Compare -->
<div style="background:#f7faf8;border:1px solid #d8e8dc;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
  <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#064029;margin-bottom:12px;">Compare · vs. previous week</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    ${metricRow("Pageviews", fmtInt(args.cur.pageviews), renderDelta(dPageviews))}
    ${metricRow("Sessions", fmtInt(args.cur.sessions), renderDelta(dSessions))}
    ${metricRow("Visitors", fmtInt(args.cur.visitors), renderDelta(dVisitors))}
    ${metricRow("Bounce rate", fmtPct(curBounce), renderDelta(dBounce, true))}
  </table>
</div>

<!-- Most visited pages -->
<div style="background:#ffffff;border:1px solid #d8e8dc;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
  <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#064029;margin-bottom:12px;">Most visited pages</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tr>
      <td style="padding:6px 0 10px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#888888;border-bottom:1px solid #eaf3ec;">Page</td>
      <td style="padding:6px 0 10px;text-align:right;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#888888;border-bottom:1px solid #eaf3ec;">Pageviews</td>
    </tr>
    ${pagesRows}
  </table>
</div>

<!-- Top referrers -->
<div style="background:#ffffff;border:1px solid #d8e8dc;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
  <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#064029;margin-bottom:12px;">Top referrers</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tr>
      <td style="padding:6px 0 10px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#888888;border-bottom:1px solid #eaf3ec;">Referrer</td>
      <td style="padding:6px 0 10px;text-align:right;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#888888;border-bottom:1px solid #eaf3ec;">Pageviews</td>
    </tr>
    ${refRows}
  </table>
</div>

<div style="text-align:center;margin-top:12px;">
  <a href="https://swingtheory.golf/admin/analytics" style="display:inline-block;background:#064029;color:#ffffff;font-size:13px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">See full report &rarr;</a>
</div>`;
}

// Minimal branded email shell — copies the shape from functions/lib/email.ts
// wrapBrandedEmail but inlined here so this endpoint can build the exact
// HTML without dragging in the whole helper (which adds a wrapper we don't
// want since our body is already fully styled). Keeps the shared visual
// language: dark green header + logo, white body card, NAP footer.
function renderEmailShell(title: string, preheader: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
</head>
<body style="margin:0;padding:0;background:#f0f4f1;font-family:Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;color:#f0f4f1">${esc(preheader)}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f1;padding:32px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden">
  <tr>
    <td style="background:#064029;padding:24px 32px">
      <img src="https://media.swingtheory.golf/uploads/email-logo.png" alt="Swing Theory" height="36" style="display:block;height:36px;">
    </td>
  </tr>
  <tr>
    <td style="padding:32px 32px 8px">
      <div style="font-size:22px;font-weight:700;color:#064029;margin-bottom:8px">${esc(title)}</div>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 32px 32px">
      ${bodyHtml}
    </td>
  </tr>
  <tr>
    <td style="background:#f7faf8;border-top:1px solid #eaf3ec;padding:20px 32px;text-align:center">
      <p style="font-size:11px;color:#999999;margin:0">Swing Theory, 50 S De Lacey Ave, Pasadena, CA 91105</p>
      <p style="font-size:11px;color:#999999;margin:6px 0 0">626-879-5513 &nbsp;•&nbsp; info@swingtheory.golf &nbsp;•&nbsp; swingtheory.golf</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─── Handler ─────────────────────────────────────────────────────────────
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const provided = request.headers.get("x-internal-secret") || "";
  if (!env.WEEKLY_ANALYTICS_SECRET || provided !== env.WEEKLY_ANALYTICS_SECRET) {
    return json({ error: "Unauthorized" }, 401);
  }

  const w = weekWindows();

  const [cur, prev, pages, referrers] = await Promise.all([
    metricsFor(env.DB, w.thisWeekStart, w.thisWeekEnd),
    metricsFor(env.DB, w.prevWeekStart, w.prevWeekEnd),
    topPages(env.DB, w.thisWeekStart, w.thisWeekEnd, 5),
    topReferrers(env.DB, w.thisWeekStart, w.thisWeekEnd, 5),
  ]);

  const bodyHtml = renderMetricsCard({
    displayStart: w.displayStart,
    displayEnd: w.displayEnd,
    cur,
    prev,
    pages,
    referrers,
  });

  const html = renderEmailShell(
    `Your weekly insights for swingtheory.golf are here!`,
    `Weekly analytics · ${w.displayStart} – ${w.displayEnd}`,
    bodyHtml,
  );

  const subject = `Your weekly insights for swingtheory.golf — ${w.displayEnd}`;
  const toEmail = env.CONTACT_TO_EMAIL || "info@swingtheory.golf";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Swing Theory Analytics <${env.CONTACT_FROM_EMAIL}>`,
        to: [toEmail],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      console.error(`[weekly-analytics-email] resend ${res.status}: ${bodyText}`);
      return json({ error: `Resend ${res.status}`, detail: bodyText.slice(0, 200) }, 502);
    }
  } catch (e) {
    console.error(`[weekly-analytics-email] resend fetch failed: ${(e as Error).message}`);
    return json({ error: "Send failed" }, 502);
  }

  return json({
    ok: true,
    sent_to: toEmail,
    subject,
    period: {
      start: w.displayStart,
      end: w.displayEnd,
      sql_start: w.thisWeekStart,
      sql_end: w.thisWeekEnd,
    },
    metrics: {
      current: {
        pageviews: cur.pageviews,
        sessions: cur.sessions,
        visitors: cur.visitors,
        bounces: cur.bounces,
      },
      previous: {
        pageviews: prev.pageviews,
        sessions: prev.sessions,
        visitors: prev.visitors,
        bounces: prev.bounces,
      },
    },
  });
};
