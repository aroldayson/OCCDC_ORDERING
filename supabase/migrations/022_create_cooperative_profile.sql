-- Migration 022: Create coop_profile table to store cooperative identity details
-- These are retrieved dynamically by print templates (e.g. Delivery Receipt).

CREATE TABLE IF NOT EXISTS public.coop_profile (
  id TEXT PRIMARY KEY DEFAULT 'coop-1',
  name TEXT NOT NULL,
  short_name TEXT NOT NULL DEFAULT 'OCGEMPC',
  address TEXT,
  contact_no TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.coop_profile ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they already exist
DROP POLICY IF EXISTS "Allow public read access" ON public.coop_profile;
DROP POLICY IF EXISTS "Allow insert" ON public.coop_profile;
DROP POLICY IF EXISTS "Allow update" ON public.coop_profile;

-- Create policies (open read/write policies matching other master tables)
CREATE POLICY "Allow public read access" ON public.coop_profile FOR SELECT USING (true);
CREATE POLICY "Allow insert" ON public.coop_profile FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update" ON public.coop_profile FOR UPDATE USING (true);

-- Seed OCGEMPC details by default
INSERT INTO public.coop_profile (id, name, short_name, address, contact_no)
VALUES (
  'coop-1',
  'OLONGAPO CITY GOVERNMENT EMPLOYEES'' MULTIPURPOSE COOPERATIVE (OCGEMPC)',
  'OCGEMPC',
  '3rd Floor City Hall Annex, Rizal Ave., West Bajac-Bajac, Olongapo City',
  '09323735919 / 09423124513'
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  address = EXCLUDED.address,
  contact_no = EXCLUDED.contact_no;
