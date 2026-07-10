-- Migration 021: Add contact_person and contact_number to schools table
-- These are used to store contact details of school representatives for Delivery Receipts.

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS contact_person TEXT,
  ADD COLUMN IF NOT EXISTS contact_number TEXT;
