-- Adds schedule/pricing fields to programs, admin-editable per program.
-- date_range: free text, e.g. "Monday-Thursday" or "Tuesday and Thursday".
-- time_range: free text, e.g. "6:00 PM - 8:00 PM".
-- price: free text, e.g. "$239/month" or "$25 per session" (formats vary
--   by program, so kept as text rather than a fixed numeric column).
-- starts_on: ISO date (YYYY-MM-DD), the next/upcoming start date.
ALTER TABLE programs ADD COLUMN date_range TEXT NOT NULL DEFAULT '';
ALTER TABLE programs ADD COLUMN time_range TEXT NOT NULL DEFAULT '';
ALTER TABLE programs ADD COLUMN price      TEXT NOT NULL DEFAULT '';
ALTER TABLE programs ADD COLUMN starts_on  TEXT NOT NULL DEFAULT '';
