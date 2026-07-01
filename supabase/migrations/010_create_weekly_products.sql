-- Create weekly_products table
CREATE TABLE IF NOT EXISTS public.weekly_products (
  id TEXT NOT NULL,
  week_label TEXT NOT NULL,
  name TEXT NOT NULL,
  default_qty NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  note TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id, week_label)
);

-- Enable RLS
ALTER TABLE public.weekly_products ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users"
  ON public.weekly_products FOR SELECT
  USING (true);

CREATE POLICY "Enable all access for authenticated users"
  ON public.weekly_products FOR ALL
  USING (true)
  WITH CHECK (true);
