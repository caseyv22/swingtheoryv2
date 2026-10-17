-- Signed-agreement membership signups (website checkout -> SwingRes).
--
-- One row per attempt that got as far as signing the membership agreement. It is written
-- BEFORE the card is touched, so there is always a record of who signed what, when (server
-- clock), and from where, even if the payment then fails. SwingRes keeps the signed PDF under
-- the member's profile; this table is our side of the audit trail and the recovery record if the
-- SwingRes handoff fails after a successful charge.
--
-- status values:
--   'signed'            - agreement signed, nothing charged yet
--   'payment_failed'    - Square declined/errored; nothing to provision (error_message says why)
--   'paid'              - subscription created in Square, SwingRes handoff not finished yet
--   'provisioned'       - SwingRes created the membership and stored the signed PDF
--   'provision_failed'  - charged, but SwingRes did not confirm; staff were emailed to add
--                         the member by hand (error_message says why)

CREATE TABLE IF NOT EXISTS membership_signups (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'signed',
  plan_slug TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  agreement_content_id TEXT NOT NULL,
  typed_signature TEXT NOT NULL,
  opened_at TEXT,
  scroll_completed_at TEXT,
  signed_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  monthly_fee TEXT NOT NULL,
  first_month_terms TEXT,
  square_subscription_id TEXT,
  square_subscription_status TEXT,
  swingres_customer_id TEXT,
  swingres_subscription_id TEXT,
  swingres_agreement_id TEXT,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_membership_signups_email ON membership_signups (email);
CREATE INDEX IF NOT EXISTS idx_membership_signups_status ON membership_signups (status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_membership_signups_square_sub
  ON membership_signups (square_subscription_id) WHERE square_subscription_id IS NOT NULL;
