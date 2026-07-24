import { json } from "../../../lib/http";
import { requireAdmin } from "../../../lib/access";
import type { Env } from "../../../lib/db";

// GET /api/admin/analytics?range=7d|30d|90d|all&view=summary|pages|referrers
//
// One endpoint, three views — the /admin/analytics page fires three
// requests on load, one per view, so we can render the three cards
// independently and cache results per view.
//
// Metric definitions (match the Burst Statistics reference from Casey's
// old WP site so week-over-week comparisons stay sane):
//   pageviews   count of pv rows in the range
//   sessions    count of DISTINCT session_id
//   visitors    count of DISTINCT visitor_id
//   bounce_rate (sessions with only 1 pv in the range) / total sessions
//
// Summary view returns each metric alongside the same metric from the
// immediately-preceding equal-length range, so the UI can show
// "+28%" deltas without a second round-trip.

const RANGE_DAYS: Record<string, number | null> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: null,
};

// SQLite-side bounds. We ask for anything created_at >= start (UTC) so a
// range of null means "everything" (still bounded by created_at IS NOT
// NULL, which is always true).
function rangeBounds(range: string): { curStart: string; prevStart: string; prevEnd: string } {
  const days = RANGE_DAYS[range] ?? null;
  if (days == null) {
    // "all" — previous period is empty (nothing to compare against). We
    // return the epoch for curStart and use "1970-01-01" as prevStart/end
    // sentinels so the delta queries harmlessly return 0.
    return { curStart: "1970-01-01 00:00:00", prevStart: "1970-01-01 00:00:00", prevEnd: "1970-01-01 00:00:00" };
  }
  const now = new Date();
  const curStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const prevStart = new Date(curStart.getTime() - days * 24 * 60 * 60 * 1000);
  const prevEnd = curStart;
  // SQLite datetime format: 'YYYY-MM-DD HH:MM:SS' (UTC assumed).
  const fmt = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");
  return { curStart: fmt(curStart), prevStart: fmt(prevStart), prevEnd: fmt(prevEnd) };
}

// Compute the four core metrics for a window bounded by [startInclusive,
// endExclusive]. Runs 4 queries per window because D1 doesn't love
// complex GROUP BY over the same subquery; separate queries stay simple
// and each hits an index.
async function metricsFor(
  db: D1Database,
  startInclusive: string,
  endExclusive: string | null,
): Promise<{ pageviews: number; sessions: number; visitors: number; bounces: number }> {
  const whereClause = endExclusive
    ? "WHERE created_at >= ? AND created_at < ?"
    : "WHERE created_at >= ?";
  const binds = endExclusive ? [startInclusive, endExclusive] : [startInclusive];

  const pv = await db
    .prepare(`SELECT COUNT(*) AS c FROM pageviews ${whereClause}`)
    .bind(...binds)
    .first<{ c: number }>();

  const sess = await db
    .prepare(`SELECT COUNT(DISTINCT session_id) AS c FROM pageviews ${whereClause}`)
    .bind(...binds)
    .first<{ c: number }>();

  const vis = await db
    .prepare(`SELECT COUNT(DISTINCT visitor_id) AS c FROM pageviews ${whereClause}`)
    .bind(...binds)
    .first<{ c: number }>();

  // Bounces = sessions whose total pageview count in this window is exactly 1.
  const bounce = await db
    .prepare(
      `SELECT COUNT(*) AS c FROM (
         SELECT session_id FROM pageviews ${whereClause}
         GROUP BY session_id HAVING COUNT(*) = 1
       )`,
    )
    .bind(...binds)
    .first<{ c: number }>();

  return {
    pageviews: pv?.c ?? 0,
    sessions: sess?.c ?? 0,
    visitors: vis?.c ?? 0,
    bounces: bounce?.c ?? 0,
  };
}

// Percentage delta between current and previous values. Handles the
// zero-previous case by returning null (UI shows a "—" instead of
// dividing by zero and rendering "+∞%").
function pctDelta(cur: number, prev: number): number | null {
  if (prev === 0) return cur === 0 ? 0 : null;
  return Math.round(((cur - prev) / prev) * 1000) / 10; // one decimal
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;

  const url = new URL(request.url);
  const range = String(url.searchParams.get("range") ?? "7d");
  if (!(range in RANGE_DAYS)) return json({ error: "Invalid range" }, 400);
  const view = String(url.searchParams.get("view") ?? "summary");
  const { curStart, prevStart, prevEnd } = rangeBounds(range);

  if (view === "summary") {
    const cur = await metricsFor(env.DB, curStart, null);
    const prev =
      range === "all"
        ? { pageviews: 0, sessions: 0, visitors: 0, bounces: 0 }
        : await metricsFor(env.DB, prevStart, prevEnd);

    const curBounceRate = cur.sessions > 0 ? cur.bounces / cur.sessions : 0;
    const prevBounceRate = prev.sessions > 0 ? prev.bounces / prev.sessions : 0;

    return json({
      range,
      current: {
        pageviews: cur.pageviews,
        sessions: cur.sessions,
        visitors: cur.visitors,
        bounce_rate: curBounceRate,
      },
      previous: {
        pageviews: prev.pageviews,
        sessions: prev.sessions,
        visitors: prev.visitors,
        bounce_rate: prevBounceRate,
      },
      deltas: {
        // Positive is good for the first 3 metrics; positive is BAD for
        // bounce_rate (more people leaving without engaging). Sign left
        // as-is; UI colors it accordingly.
        pageviews: pctDelta(cur.pageviews, prev.pageviews),
        sessions: pctDelta(cur.sessions, prev.sessions),
        visitors: pctDelta(cur.visitors, prev.visitors),
        bounce_rate:
          prevBounceRate === 0
            ? curBounceRate === 0
              ? 0
              : null
            : Math.round(((curBounceRate - prevBounceRate) / prevBounceRate) * 1000) / 10,
      },
    });
  }

  if (view === "pages") {
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 100);
    const { results = [] } = await env.DB.prepare(
      `SELECT path, COUNT(*) AS pageviews
         FROM pageviews
        WHERE created_at >= ?
        GROUP BY path
        ORDER BY pageviews DESC
        LIMIT ?`,
    )
      .bind(curStart, limit)
      .all<{ path: string; pageviews: number }>();
    return json({ range, items: results });
  }

  if (view === "events") {
    // Click events (Book-a-Bay, coach phone taps, etc.). Grouped by label.
    // Returns total clicks, unique sessions that fired it (for a rough
    // conversion-rate lens), and previous-period counts for delta.
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 100);
    const { results = [] } = await env.DB.prepare(
      `SELECT label,
              COUNT(*) AS clicks,
              COUNT(DISTINCT session_id) AS sessions
         FROM events
        WHERE created_at >= ?
        GROUP BY label
        ORDER BY clicks DESC
        LIMIT ?`,
    )
      .bind(curStart, limit)
      .all<{ label: string; clicks: number; sessions: number }>();

    let prev: Array<{ label: string; clicks: number }> = [];
    if (range !== "all") {
      const { results: prevResults = [] } = await env.DB.prepare(
        `SELECT label, COUNT(*) AS clicks
           FROM events
          WHERE created_at >= ? AND created_at < ?
          GROUP BY label`,
      )
        .bind(prevStart, prevEnd)
        .all<{ label: string; clicks: number }>();
      prev = prevResults;
    }
    const prevByLabel = new Map(prev.map((r) => [r.label, r.clicks]));

    const items = results.map((r) => {
      const prevClicks = prevByLabel.get(r.label) ?? 0;
      return {
        label: r.label,
        clicks: r.clicks,
        sessions: r.sessions,
        delta: pctDelta(r.clicks, prevClicks),
      };
    });
    return json({ range, items });
  }

  if (view === "referrers") {
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 100);
    const { results = [] } = await env.DB.prepare(
      `SELECT referrer_host AS host, COUNT(*) AS pageviews
         FROM pageviews
        WHERE created_at >= ?
          AND referrer_host IS NOT NULL
          AND referrer_host != ''
        GROUP BY referrer_host
        ORDER BY pageviews DESC
        LIMIT ?`,
    )
      .bind(curStart, limit)
      .all<{ host: string; pageviews: number }>();
    return json({ range, items: results });
  }

  return json({ error: "Invalid view" }, 400);
};
