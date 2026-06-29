-- Add INSERT policy for user signup
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Update service role policy to include all operations
DROP POLICY IF EXISTS "Service role can manage all profiles" ON user_profiles;

CREATE POLICY "Service role can manage all profiles"
  ON user_profiles
  FOR ALL
  USING (auth.role() = 'service_role');
