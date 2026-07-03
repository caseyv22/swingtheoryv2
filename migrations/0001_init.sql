-- Swing Theory D1 initial schema.
-- Run: `wrangler d1 execute swingtheory --file=migrations/0001_init.sql`
-- For local dev: `wrangler d1 execute swingtheory --local --file=migrations/0001_init.sql`

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------
-- Programs (League, Mini Mulligans, Summer Womens, Summer Seniors,
-- plus anything new the admin adds).
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS programs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  kicker        TEXT NOT NULL DEFAULT '',
  h1            TEXT NOT NULL,
  short_desc    TEXT NOT NULL,
  long_desc     TEXT NOT NULL,
  audience      TEXT NOT NULL DEFAULT '',
  season        TEXT NOT NULL DEFAULT '',
  key_details   TEXT NOT NULL DEFAULT '[]',   -- JSON array of strings
  image_url     TEXT NOT NULL DEFAULT '',
  cta_label     TEXT NOT NULL DEFAULT 'Request info',
  cta_target    TEXT NOT NULL DEFAULT 'interest', -- 'interest' | 'league'
  published     INTEGER NOT NULL DEFAULT 1,      -- boolean
  sort_order    INTEGER NOT NULL DEFAULT 100,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_programs_published_sort ON programs(published, sort_order);

-- ---------------------------------------------------------------
-- Coaches (Lessons page).
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coaches (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  title         TEXT NOT NULL,
  bio           TEXT NOT NULL,
  photo_url     TEXT NOT NULL DEFAULT '',
  specialties   TEXT NOT NULL DEFAULT '[]',  -- JSON array
  phone         TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL DEFAULT '',
  published     INTEGER NOT NULL DEFAULT 1,
  sort_order    INTEGER NOT NULL DEFAULT 100,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_coaches_published_sort ON coaches(published, sort_order);

-- ---------------------------------------------------------------
-- League events — the "next upcoming" details shown on /league.
-- Admin can create/edit/delete. /league picks the next one where
-- starts_at >= now and published = 1.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS league_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL,
  subtitle      TEXT NOT NULL DEFAULT '',
  description   TEXT NOT NULL DEFAULT '',
  starts_at     TEXT NOT NULL,                    -- ISO date/time
  ends_at       TEXT NOT NULL DEFAULT '',
  location_line TEXT NOT NULL DEFAULT '',
  image_url     TEXT NOT NULL DEFAULT '',
  cta_label     TEXT NOT NULL DEFAULT 'Sign up',
  cta_url       TEXT NOT NULL DEFAULT '/league#signup',
  published     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_league_events_starts_at ON league_events(published, starts_at);

-- ---------------------------------------------------------------
-- Form submissions — every public form writes here after email send.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submissions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  form_type     TEXT NOT NULL,   -- 'contact' | 'event' | 'league' | 'membership' | 'program'
  program       TEXT NOT NULL DEFAULT '',
  name          TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL DEFAULT '',
  phone         TEXT NOT NULL DEFAULT '',
  message       TEXT NOT NULL DEFAULT '',
  payload_json  TEXT NOT NULL,   -- full submission body for reference
  user_ip       TEXT NOT NULL DEFAULT '',
  user_agent    TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'new', -- 'new' | 'read' | 'archived'
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_submissions_type_created ON submissions(form_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
