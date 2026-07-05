-- Migration 016: Add address and delivery_price to schools table
-- These columns are used by clientStorage.ts for school address and delivery fee management.

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS delivery_price NUMERIC(10, 2) DEFAULT 0;
