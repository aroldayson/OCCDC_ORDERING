-- Create orders table in public schema
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_role TEXT NOT NULL,
  week_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  item_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for viewing orders)
CREATE POLICY "Allow public read access" ON public.orders
  FOR SELECT USING (true);

-- Allow public insert access (for placing orders)
CREATE POLICY "Allow public insert access" ON public.orders
  FOR INSERT WITH CHECK (true);

-- Allow public update access (for updating order status and item changes)
CREATE POLICY "Allow public update access" ON public.orders
  FOR UPDATE USING (true);

-- Allow public delete access (for deleting orders)
CREATE POLICY "Allow public delete access" ON public.orders
  FOR DELETE USING (true);
