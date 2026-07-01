-- Add categories column to user_profiles table
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS categories TEXT[];

-- Update trigger function to handle categories array
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role, school_name, categories)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    new.raw_user_meta_data->>'schoolName',
    ARRAY(
      SELECT jsonb_array_elements_text(
        CASE 
          WHEN jsonb_typeof(new.raw_user_meta_data->'categories') = 'array' THEN new.raw_user_meta_data->'categories'
          ELSE '[]'::jsonb
        END
      )
    )
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

-- Re-apply to existing rows from auth.users meta
UPDATE public.user_profiles up
SET categories = ARRAY(
  SELECT jsonb_array_elements_text(
    CASE 
      WHEN jsonb_typeof(u.raw_user_meta_data->'categories') = 'array' THEN u.raw_user_meta_data->'categories'
      ELSE '[]'::jsonb
    END
  )
)
FROM auth.users u
WHERE up.id = u.id;
