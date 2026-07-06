-- Backup table for deleted orders

CREATE TABLE IF NOT EXISTS public.deleted_orders (
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

-- Indexes for quick lookup
CREATE INDEX IF NOT EXISTS idx_deleted_orders_client_name ON public.deleted_orders (client_name);
CREATE INDEX IF NOT EXISTS idx_deleted_orders_week_label  ON public.deleted_orders (week_label);
CREATE INDEX IF NOT EXISTS idx_deleted_orders_deleted_at  ON public.deleted_orders (deleted_at DESC);

-- Enable RLS (matching orders table setup)
ALTER TABLE public.deleted_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON public.deleted_orders FOR SELECT
  USING (true);

CREATE POLICY "Enable all access for authenticated users"
  ON public.deleted_orders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable insert for anon"
  ON public.deleted_orders FOR INSERT
  TO anon
  WITH CHECK (true);
