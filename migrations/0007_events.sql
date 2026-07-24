-- Click / interaction events.
--
-- Complements the pageviews table. Where pageviews answers "how many
-- people visited a page", events answers "how many people did X on the
-- site" — currently the two Xs being tracked are Book-a-Bay button
-- clicks and per-coach phone number pill clicks.
--
-- Kept as a separate table (not a `type` column on pageviews) because
-- queries are different — event counts by label are read from admin
-- analytics, pageviews power the compare card. Also lets us prune each
-- independently if storage becomes a concern.
--
-- Fields:
--   event_name  Broad category. Currently only 'click'. Reserved for
--               future kinds (e.g. 'form_start', 'scroll_depth').
--   label       Specific action identifier. Stable machine-readable
--               name — e.g. 'book_a_bay', 'coach_phone_jae-lee'. Used
--               as the primary group-by dimension in admin analytics.
--   target      Where the click was going (href, tel: number, etc.).
--               Optional but useful for debugging.
--   path        Which page the click happened on. Same normalization
--               rules as pageviews.path (leading slash, no trailing).
--   session_id  Same session_id as pageviews — from sessionStorage.
--               Ties the click back to the pageview session for funnel
--               analysis later.
--   visitor_id  Same visitor_id as pageviews — from localStorage.
--   created_at  UTC, auto.
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,
  label TEXT NOT NULL,
  target TEXT,
  path TEXT NOT NULL,
  session_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_label_created ON events(label, created_at);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
