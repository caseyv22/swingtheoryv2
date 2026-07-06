-- Adds direct-checkout wiring to programs, admin-editable per program.
-- square_catalog_id: Square Catalog object ID (an ITEM_VARIATION for
--   one-time fees, a SUBSCRIPTION_PLAN_VARIATION for recurring programs).
--   Created manually in the Square dashboard/API, pasted in here — this
--   column is only ever read by our backend, never written from Square.
-- checkout_mode: which Square flow functions/api/program-checkout.ts uses.
--   'none' (default) keeps the existing interest-form / league-signup CTA
--   behavior even if cta_target is accidentally set to 'checkout'.
ALTER TABLE programs ADD COLUMN square_catalog_id TEXT NOT NULL DEFAULT '';
ALTER TABLE programs ADD COLUMN checkout_mode     TEXT NOT NULL DEFAULT 'none';
