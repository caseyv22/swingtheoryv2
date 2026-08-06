-- Card-on-file + activation state for Mini Mulligans reservations.
--
-- Reservations now capture a Square card at signup ($0 charged). An admin
-- later activates the $400/mo subscription from the admin panel, which is
-- the first actual charge and the moment the Sync enrollment is created.
--
-- status values:
--   'reserved'  - card on file, no subscription, nothing charged (default)
--   'activated' - subscription created, first $400 charged, Sync provisioned
--   'canceled'  - reservation withdrawn (kept for history; not currently set
--                 by code, reserved for future use)

ALTER TABLE mini_mulligans_waitlist ADD COLUMN square_customer_id TEXT;
ALTER TABLE mini_mulligans_waitlist ADD COLUMN square_card_id TEXT;
ALTER TABLE mini_mulligans_waitlist ADD COLUMN status TEXT NOT NULL DEFAULT 'reserved';
ALTER TABLE mini_mulligans_waitlist ADD COLUMN subscription_id TEXT;
ALTER TABLE mini_mulligans_waitlist ADD COLUMN activated_at TEXT;
