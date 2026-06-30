-- Update trigger function to handle both camelCase and snake_case school name metadata keys
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role, school_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    COALESCE(new.raw_user_meta_data->>'schoolName', new.raw_user_meta_data->>'school_name')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    school_name = EXCLUDED.school_name,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-run the backfill query to fix any existing accounts
INSERT INTO public.user_profiles (id, email, role, school_name)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'role', 'user'),
  COALESCE(raw_user_meta_data->>'schoolName', raw_user_meta_data->>'school_name')
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  school_name = EXCLUDED.school_name,
  updated_at = NOW();
