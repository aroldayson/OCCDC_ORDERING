-- Create order_items table
-- Note: orders.id is TEXT and weekly_products has a composite PK (id, week_label)
-- so product_id references the TEXT product id without a strict FK to weekly_products
-- (weekly_products uses composite PK and items can persist after product deletion)

CREATE TABLE IF NOT EXISTS public.order_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    TEXT        NOT NULL,
  product_id  TEXT        NOT NULL,
  quantity    NUMERIC     NOT NULL,
  price       NUMERIC     NOT NULL,
  subtotal    NUMERIC     NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'Active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_order
    FOREIGN KEY (order_id)
    REFERENCES public.orders(id)
    ON DELETE CASCADE
);

-- Index for fast lookup by order
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- Index for fast lookup by product
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- Enable Row Level Security
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access"
  ON public.order_items FOR SELECT
  USING (true);

-- Allow public insert access
CREATE POLICY "Allow public insert access"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

-- Allow public update access
CREATE POLICY "Allow public update access"
  ON public.order_items FOR UPDATE
  USING (true);

-- Allow public delete access
CREATE POLICY "Allow public delete access"
  ON public.order_items FOR DELETE
  USING (true);
