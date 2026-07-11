-- Migration 028: Add date_received to delivery_receipt_records
ALTER TABLE public.delivery_receipt_records ADD COLUMN IF NOT EXISTS date_received TIMESTAMPTZ;
