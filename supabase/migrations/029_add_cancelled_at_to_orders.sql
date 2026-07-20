-- Track when an order was cancelled for pricing / audit views
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_cancelled_at
  ON public.orders (cancelled_at DESC)
  WHERE cancelled_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_status_cancelled
  ON public.orders (status, week_label)
  WHERE status = 'cancelled';

-- Backfill existing cancelled orders
UPDATE public.orders
SET cancelled_at = COALESCE(cancelled_at, created_at)
WHERE status = 'cancelled';
