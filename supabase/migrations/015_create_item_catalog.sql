-- Create item_catalog table
-- Stores the master list of known items (name + category + default unit).
-- This is the source of truth for the item-name dropdown in the ordering form.
-- It is NOT week-specific; items here are reusable across all weeks.

CREATE TABLE IF NOT EXISTS public.item_catalog (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  category     TEXT        NOT NULL,
  default_unit TEXT        NOT NULL DEFAULT 'kg',
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate name + category combinations
  CONSTRAINT uq_item_catalog_name_category UNIQUE (name, category)
);

-- Index for fast filtering by category (used by the dropdown)
CREATE INDEX IF NOT EXISTS idx_item_catalog_category
  ON public.item_catalog (category)
  WHERE is_active = true;

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION public.set_item_catalog_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_item_catalog_updated_at
  BEFORE UPDATE ON public.item_catalog
  FOR EACH ROW EXECUTE FUNCTION public.set_item_catalog_updated_at();

-- Enable Row Level Security
ALTER TABLE public.item_catalog ENABLE ROW LEVEL SECURITY;

-- Anyone can read (needed by the public ordering form dropdown)
CREATE POLICY "Allow public read access"
  ON public.item_catalog FOR SELECT
  USING (true);

-- Authenticated users (admins) can insert, update, delete
CREATE POLICY "Allow authenticated insert"
  ON public.item_catalog FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update"
  ON public.item_catalog FOR UPDATE
  USING (true);

CREATE POLICY "Allow authenticated delete"
  ON public.item_catalog FOR DELETE
  USING (true);

-- ─── Seed: common items per category ──────────────────────────────────────────

INSERT INTO public.item_catalog (name, category, default_unit) VALUES
  -- Vegetables
  ('Bell Pepper', 'vegetables', 'kg'),
  ('Carrots', 'vegetables', 'kg'),
  ('Garlic', 'vegetables', 'kg'),
  ('Ginger', 'vegetables', 'kg'),
  ('Onion', 'vegetables', 'kg'),
  ('Onion Red', 'vegetables', 'kg'),
  ('Onion White', 'vegetables', 'kg'),
  ('Papaya', 'vegetables', 'kg'),
  ('Potato', 'vegetables', 'kg'),
  ('Sayote', 'vegetables', 'kg'),
  ('Sili Haba (Pangsigang)', 'vegetables', 'kg'),

  -- Fruits
  ('Banana (Lakatan)', 'fruits', 'kg'),
  ('Kalamansi', 'fruits', 'kg'),
  ('Papaya (ripe)', 'fruits', 'kg'),

  -- Meat
  ('Chicken (Breast)', 'meat', 'kg'),
  ('Chicken (Drumstick)', 'meat', 'kg'),
  ('Chicken (Whole)', 'meat', 'kg'),
  ('Chicken Giniling', 'meat', 'kg'),
  ('Ground Chicken', 'meat', 'kg'),
  ('Ground Pork', 'meat', 'kg'),
  ('Pork (Kasim)', 'meat', 'kg'),
  ('Pork Giniling', 'meat', 'kg'),
  ('Pork Kasim/Lomo', 'meat', 'kg'),
  ('Pork Liver', 'meat', 'kg'),
  ('Pork Lomo', 'meat', 'kg'),

  -- Fish
  ('Fish Fillet (Dory)', 'fish', 'kg'),
  ('Bangus', 'fish', 'kg'),
  ('Tilapia', 'fish', 'kg'),

  -- Egg (name locked in UI; size variants handled separately)
  ('Egg', 'egg', 'tray'),

  -- Rice
  ('Rice', 'rice', 'sack'),

  -- Groceries
  ('All Purpose Flour', 'groceries', 'kg'),
  ('Banana Ketchup', 'groceries', 'gallon'),
  ('Black Pepper Ground', 'groceries', 'kg'),
  ('Bread Crumbs', 'groceries', 'kg'),
  ('Breading Mix', 'groceries', 'kg'),
  ('Butter', 'groceries', 'pc'),
  ('Cooking Oil', 'groceries', 'liter'),
  ('Corn Kernel (425g)', 'groceries', 'can'),
  ('Cornstarch', 'groceries', 'kg'),
  ('Fish Sauce', 'groceries', 'liter'),
  ('Iodized Salt', 'groceries', 'kg'),
  ('Laurel Leaves', 'groceries', 'pack'),
  ('Liquid Seasoning', 'groceries', 'bottle'),
  ('Mixed Vegetables (500g)', 'groceries', 'pack'),
  ('Oyster Sauce', 'groceries', 'bottle'),
  ('Pineapple Chunks', 'groceries', 'can'),
  ('Soy Sauce', 'groceries', 'liter'),
  ('Sugar', 'groceries', 'kg'),
  ('Tomato Sauce', 'groceries', 'kg'),
  ('Vinegar', 'groceries', 'liter'),

  -- Other Order
  ('Apron', 'other_order', 'pc'),
  ('Kitchen Hand Gloves (100s)', 'other_order', 'pc'),
  ('LPG Tank Refill (11kg)', 'other_order', 'pc'),
  ('LPG Hose', 'other_order', 'pc'),
  ('Single Burner Gas Stove', 'other_order', 'pc')

ON CONFLICT (name, category) DO NOTHING;
