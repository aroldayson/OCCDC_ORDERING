-- Backup table for deleted orders
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS deleted_orders (
  id             TEXT PRIMARY KEY,
  client_name    TEXT NOT NULL,
  client_role    TEXT NOT NULL,
  week_label     TEXT NOT NULL,
  status         TEXT NOT NULL,
  item_count     INTEGER NOT NULL DEFAULT 0,
  items          JSONB NOT NULL DEFAULT '[]',
  total_price    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ,
  deleted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookup by client or week
CREATE INDEX IF NOT EXISTS idx_deleted_orders_client_name ON deleted_orders (client_name);
CREATE INDEX IF NOT EXISTS idx_deleted_orders_week_label  ON deleted_orders (week_label);
CREATE INDEX IF NOT EXISTS idx_deleted_orders_deleted_at  ON deleted_orders (deleted_at DESC);

-- Allow the anon/service role to insert (matches your orders table policy)
ALTER TABLE deleted_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert for authenticated users"
  ON deleted_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow select for authenticated users"
  ON deleted_orders FOR SELECT
  TO authenticated
  USING (true);
