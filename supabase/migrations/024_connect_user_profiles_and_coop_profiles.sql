-- Migration 024: Link user_profiles table to coop_profile table
-- Adds coop_id column to user_profiles table.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS coop_id TEXT REFERENCES public.coop_profile(id) ON DELETE SET NULL;

-- For existing admin users, default coop_id to 'coop-1' (OCGEMPC)
UPDATE public.user_profiles
SET coop_id = 'coop-1'
WHERE role = 'admin' AND coop_id IS NULL;
