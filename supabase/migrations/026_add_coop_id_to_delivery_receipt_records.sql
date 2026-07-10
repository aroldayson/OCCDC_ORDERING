-- Migration 026: Add coop_id column to delivery_receipt_records
-- Connects the delivery receipt record directly to the supplier's cooperative profile.

ALTER TABLE public.delivery_receipt_records
ADD COLUMN IF NOT EXISTS coop_id TEXT REFERENCES public.coop_profile(id) ON DELETE SET NULL;
