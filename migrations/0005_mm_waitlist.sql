-- Mini Mulligans early-access waitlist.
--
-- Capped at 18 signups total (enforced in functions/api/mm-waitlist.ts).
-- Uniqueness by email so a parent can't blow through the cap by refreshing.
-- No FK to programs table since the waitlist is intentionally decoupled
-- from the admin-editable program row, if mini-mulligans gets deleted or
-- reslugged in admin, the waitlist entries remain untouched for records.
--
-- Fields:
--   parent_name   Full parent/guardian name.
--   email         Parent's email (unique, lowercased on insert).
--   kid_name      Child's first name (or nickname). Not linked to Sync.
--   kid_age       Child's age at signup. Integer, no range enforced at DB
--                 level so we don't bounce a 4-year-old sibling if we
--                 later expand the age range.
--   phone         Optional parent phone.
--   created_at    Auto-populated. Used to enforce first-come-first-served
--                 ordering when we notify the first 18 that the program
--                 is opening.
CREATE TABLE IF NOT EXISTS mini_mulligans_waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_name TEXT NOT NULL,
  email TEXT NOT NULL,
  kid_name TEXT NOT NULL,
  kid_age INTEGER NOT NULL,
  phone TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_mm_waitlist_created_at
  ON mini_mulligans_waitlist(created_at);
