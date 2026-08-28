-- Configurable Mini Mulligans signup cap. Was a hardcoded `CAPACITY = 18`
-- constant duplicated in two Functions files; that meant raising or
-- lowering the cap needed a code change + deploy. This single-row
-- settings table lets an admin change it from the UI instead.
-- id is pinned to 1 by the CHECK constraint — this table only ever holds
-- one row. functions/lib/mm-settings.ts reads/writes it.
CREATE TABLE IF NOT EXISTS mini_mulligans_settings (
  id         INTEGER PRIMARY KEY CHECK (id = 1),
  capacity   INTEGER NOT NULL DEFAULT 18,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed the single row with the same 18 the code previously hardcoded, so
-- existing behavior doesn't change until an admin explicitly edits it.
INSERT INTO mini_mulligans_settings (id, capacity)
VALUES (1, 18)
ON CONFLICT(id) DO NOTHING;
