-- Create delivery_proofs table in public schema
CREATE TABLE IF NOT EXISTS public.delivery_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  image_data TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.delivery_proofs ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON public.delivery_proofs
  FOR SELECT USING (true);

-- Allow public insert access
CREATE POLICY "Allow public insert access" ON public.delivery_proofs
  FOR INSERT WITH CHECK (true);

-- Allow public update access
CREATE POLICY "Allow public update access" ON public.delivery_proofs
  FOR UPDATE USING (true);

-- Allow public delete access
CREATE POLICY "Allow public delete access" ON public.delivery_proofs
  FOR DELETE USING (true);
