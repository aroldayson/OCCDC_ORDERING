# Tasks: Add school_address to user_profiles

## Task List

- [x] 1. Create migration 013_add_school_address_to_user_profiles.sql
  - Create `supabase/migrations/013_add_school_address_to_user_profiles.sql`
  - Add `school_address TEXT` column via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
  - Replace `handle_new_user()` trigger to include `school_address` in INSERT and ON CONFLICT DO UPDATE (carry forward all logic from migration 011)
  - **Acceptance**: File exists; SQL is valid; trigger handles `schoolAddress` from `raw_user_meta_data`

- [x] 2. Update UserProfile type
  - In `lib/supabase.ts`, add `school_address?: string` to the `UserProfile` interface
  - **Acceptance**: `UserProfile` includes `school_address?: string`

- [x] 3. Update AuthProvider
  - Add `schoolAddress?: string` as 6th param to `signUp` in both `AuthContextType` and the implementation
  - Include `schoolAddress` in `options.data` passed to `supabase.auth.signUp`
  - Update `buildFallbackProfile` to include `school_address` from `user_metadata.schoolAddress`
  - Update `mergeProfileWithAuth` to merge `school_address` (profile value preferred, metadata fallback)
  - **Acceptance**: `signUp` accepts and propagates `schoolAddress`; `UserProfile` state reflects `school_address`

- [x] 4. Update signup API route
  - In `app/api/auth/signup/route.ts`, destructure `schoolAddress` from request body
  - Pass `schoolAddress` in `user_metadata` to `admin.createUser`
  - Add `school_address: schoolAddress || null` to the `user_profiles` upsert
  - **Acceptance**: API persists `school_address` to the database

- [x] 5. Update signup page
  - In `app/auth/signup/page.tsx`, update `handleSignup` to call `signUp(email, password, role, schoolName, categories, schoolAddress)` (pass `schoolAddress` as 6th arg)
  - **Acceptance**: `schoolAddress` reaches `AuthProvider.signUp`

- [x] 6. Update SignupForm validation
  - In `app/components/auth/SignupForm.tsx`, add validation that `schoolAddress.trim()` is non-empty when `role === 'client'`
  - Show error message "Please enter your school address" and prevent submission
  - **Acceptance**: Client signup with empty school address shows error and does not submit
