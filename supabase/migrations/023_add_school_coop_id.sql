-- Migration 023: Add coop_id column to schools table
-- Links school clients to their respective cooperative profile.

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS coop_id TEXT REFERENCES public.coop_profile(id) ON DELETE SET NULL DEFAULT 'coop-1';

-- Update any existing schools to default to 'coop-1' if they don't have it
UPDATE public.schools
SET coop_id = 'coop-1'
WHERE coop_id IS NULL;
