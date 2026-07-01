-- Update trigger function to handle categories array from raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  parsed_categories text[];
BEGIN
  -- Convert jsonb array of categories to text[] array safely
  IF new.raw_user_meta_data ? 'categories' AND jsonb_typeof(new.raw_user_meta_data->'categories') = 'array' THEN
    SELECT ARRAY(SELECT jsonb_array_elements_text(new.raw_user_meta_data->'categories')) INTO parsed_categories;
  ELSE
    parsed_categories := NULL;
  END IF;

  INSERT INTO public.user_profiles (id, email, role, school_name, categories)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    COALESCE(new.raw_user_meta_data->>'schoolName', new.raw_user_meta_data->>'school_name'),
    parsed_categories
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    school_name = EXCLUDED.school_name,
    categories = EXCLUDED.categories,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-run the backfill query to sync existing user profiles
DO $$
DECLARE
  r RECORD;
  parsed text[];
BEGIN
  FOR r IN SELECT id, raw_user_meta_data FROM auth.users LOOP
    IF r.raw_user_meta_data ? 'categories' AND jsonb_typeof(r.raw_user_meta_data->'categories') = 'array' THEN
      SELECT ARRAY(SELECT jsonb_array_elements_text(r.raw_user_meta_data->'categories')) INTO parsed;
    ELSE
      parsed := NULL;
    END IF;

    UPDATE public.user_profiles
    SET categories = parsed
    WHERE id = r.id;
  END LOOP;
END;
$$;
