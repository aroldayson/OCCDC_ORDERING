-- Add price column to weekly_products and total_price to orders, and drop note column from weekly_products
ALTER TABLE public.weekly_products ADD COLUMN IF NOT EXISTS price NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.weekly_products DROP COLUMN IF EXISTS note;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_price NUMERIC DEFAULT 0;
