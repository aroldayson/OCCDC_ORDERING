-- Add school_address column to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS school_address TEXT;

-- Update trigger function to include school_address from raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  parsed_categories text[];
BEGIN
  -- Convert jsonb array of categories to text[] array safely
  IF new.raw_user_meta_data ? 'categories'
     AND jsonb_typeof(new.raw_user_meta_data->'categories') = 'array' THEN
    SELECT ARRAY(SELECT jsonb_array_elements_text(new.raw_user_meta_data->'categories'))
    INTO parsed_categories;
  ELSE
    parsed_categories := NULL;
  END IF;

  INSERT INTO public.user_profiles (id, email, role, school_name, school_address, categories)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    COALESCE(new.raw_user_meta_data->>'schoolName', new.raw_user_meta_data->>'school_name'),
    new.raw_user_meta_data->>'schoolAddress',
    parsed_categories
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email          = EXCLUDED.email,
    role           = EXCLUDED.role,
    school_name    = EXCLUDED.school_name,
    school_address = EXCLUDED.school_address,
    categories     = EXCLUDED.categories,
    updated_at     = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
