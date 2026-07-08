-- Drop dependent policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.user_profiles;

-- Drop foreign key constraint referencing auth.users(id) since Clerk is used for authentication
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey CASCADE;

-- Alter column type of id to TEXT to accommodate Clerk's string user IDs (e.g. user_...)
ALTER TABLE public.user_profiles ALTER COLUMN id TYPE TEXT;

-- Recreate policies with auth.uid()::text comparison
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Service role can manage all profiles"
  ON public.user_profiles
  FOR ALL
  USING (auth.role() = 'service_role');
