-- Create schools table in public schema
CREATE TABLE IF NOT EXISTS public.schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they already exist
DROP POLICY IF EXISTS "Allow public read access" ON public.schools;
DROP POLICY IF EXISTS "Allow insert" ON public.schools;
DROP POLICY IF EXISTS "Allow update" ON public.schools;
DROP POLICY IF EXISTS "Allow delete" ON public.schools;

-- Allow public read access
CREATE POLICY "Allow public read access"
ON public.schools
FOR SELECT
USING (true);

-- Allow public insert access
CREATE POLICY "Allow insert"
ON public.schools
FOR INSERT
WITH CHECK (true);

-- Allow public update access
CREATE POLICY "Allow update"
ON public.schools
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow public delete access
CREATE POLICY "Allow delete"
ON public.schools
FOR DELETE
USING (true);