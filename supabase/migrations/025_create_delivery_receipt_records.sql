-- Migration 025: Create delivery_receipt_records table to log/store delivery receipts
-- Stores details such as order_id, copy_type, contact_person, and contact_number.

CREATE TABLE IF NOT EXISTS public.delivery_receipt_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  copy_type TEXT NOT NULL,
  contact_person TEXT,
  contact_number TEXT,
  printed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.delivery_receipt_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to read delivery_receipt_records" ON public.delivery_receipt_records;
DROP POLICY IF EXISTS "Allow authenticated users to insert delivery_receipt_records" ON public.delivery_receipt_records;
DROP POLICY IF EXISTS "Allow authenticated users to update delivery_receipt_records" ON public.delivery_receipt_records;

-- Create RLS Policies
CREATE POLICY "Allow authenticated users to read delivery_receipt_records"
  ON public.delivery_receipt_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert delivery_receipt_records"
  ON public.delivery_receipt_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update delivery_receipt_records"
  ON public.delivery_receipt_records FOR UPDATE
  TO authenticated
  USING (true);
