-- Migration 027: Add e-signature column to delivery_receipt_records
-- Stores the base64 PNG data URI of the receiver's drawn e-signature.
-- TEXT type is used because Supabase does not have a native BLOB column;
-- the data URI (data:image/png;base64,...) is stored as plain text.

ALTER TABLE public.delivery_receipt_records
ADD COLUMN IF NOT EXISTS signature_data TEXT;

-- Optional comment for documentation
COMMENT ON COLUMN public.delivery_receipt_records.signature_data IS
  'Base64 PNG data URI of the receiver e-signature drawn at time of delivery.';
