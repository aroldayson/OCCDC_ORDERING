-- Backup table for deleted weekly_products
-- Run this in your Supabase SQL Editor

DROP TABLE IF EXISTS deleted_weekly_products;

CREATE TABLE IF NOT EXISTS public.deleted_weekly_products (
  id           TEXT PRIMARY KEY,       -- unique archive row: original_id + timestamp
  original_id  TEXT NOT NULL,          -- the original weekly_products.id
  week_label   TEXT NOT NULL,
  name         TEXT NOT NULL,
  default_qty  NUMERIC NOT NULL DEFAULT 1,
  unit         TEXT NOT NULL DEFAULT 'kg',
  price        NUMERIC NOT NULL DEFAULT 0,
  category     TEXT NOT NULL,
  created_at   TIMESTAMPTZ,
  deleted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for quick lookup
CREATE INDEX IF NOT EXISTS idx_del_wkprod_original_id ON public.deleted_weekly_products (original_id);
CREATE INDEX IF NOT EXISTS idx_del_wkprod_week_label  ON public.deleted_weekly_products (week_label);
CREATE INDEX IF NOT EXISTS idx_del_wkprod_deleted_at  ON public.deleted_weekly_products (deleted_at DESC);

-- Enable RLS (matching weekly_products setup)
ALTER TABLE public.deleted_weekly_products ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read and write (same as weekly_products)
CREATE POLICY "Enable read access for all users"
  ON public.deleted_weekly_products FOR SELECT
  USING (true);

CREATE POLICY "Enable all access for authenticated users"
  ON public.deleted_weekly_products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Also allow anon inserts so the client-side supabase key can archive on delete
CREATE POLICY "Enable insert for anon"
  ON public.deleted_weekly_products FOR INSERT
  TO anon
  WITH CHECK (true);
