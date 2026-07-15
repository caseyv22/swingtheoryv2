-- First-party analytics: one row per pageview.
--
-- Feeds /admin/analytics (pageviews, sessions, visitors, bounce rate,
-- top pages, top referrers) without depending on GA4 or an external SaaS.
-- Populated by a JS beacon in Layout.tsx (React SPA route changes) and a
-- second beacon in public/analyze/index.html (static HTML page outside
-- the SPA). Never touched from any admin write path.
--
-- Fields:
--   path            Normalized URL path ("/lessons", "/programs/mini-mulligans").
--                   Query strings and hashes stripped by the endpoint.
--   session_id      Random ID persisted in sessionStorage. Cleared when the
--                   browser tab closes. Ties multiple pageviews together so
--                   bounce rate = (sessions with 1 pageview) / (sessions).
--   visitor_id      Random ID persisted in localStorage. Cross-session ID,
--                   same browser + device across days. Counts unique visitors.
--                   Note: not a login-based user id — cleared with cookies.
--   referrer_host   Domain portion of the incoming Referer header, minus
--                   any leading "www.". Same-origin referrers are stored
--                   as NULL so /admin/analytics's referrers list ignores
--                   internal navigation. Extracted server-side, never trust
--                   client-supplied referrer.
--   country         Two-letter code from Cloudflare's CF-IPCountry header.
--                   Handy for geo insights later; unused in v1 but cheap.
--   user_agent      Full UA string, stored so we can retro-filter if a new
--                   bot slips past the ingest-time reject filter.
--   created_at      Auto-populated by SQLite in UTC.
CREATE TABLE IF NOT EXISTS pageviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  session_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  referrer_host TEXT,
  country TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pv_created_at ON pageviews(created_at);
CREATE INDEX IF NOT EXISTS idx_pv_path_created ON pageviews(path, created_at);
CREATE INDEX IF NOT EXISTS idx_pv_session ON pageviews(session_id);
CREATE INDEX IF NOT EXISTS idx_pv_visitor ON pageviews(visitor_id);
