# Requirements: Add school_address to user_profiles

## Overview

Add a `school_address` column to the `user_profiles` table and wire it end-to-end through the signup flow so that client (school) accounts can store and retrieve their school's delivery/invoice address.

## Requirements

### REQ-1: Database column

The `user_profiles` table MUST have a `school_address TEXT` column.

- The column is nullable in the database (so existing rows are unaffected).
- A new Supabase migration file must be created for this change.

### REQ-2: Auth trigger

The `handle_new_user()` database trigger MUST read `schoolAddress` from `raw_user_meta_data` and persist it to `school_address` on both INSERT and ON CONFLICT DO UPDATE.

### REQ-3: TypeScript type

The `UserProfile` interface in `lib/supabase.ts` MUST include `school_address?: string`.

### REQ-4: AuthProvider

The `signUp` function in `AuthProvider` MUST:

- Accept a `schoolAddress?: string` parameter.
- Include `schoolAddress` in the `user_metadata` passed to `supabase.auth.signUp`.
- Surface `school_address` from the fetched profile into the `UserProfile` state.
- The `buildFallbackProfile` and `mergeProfileWithAuth` helpers MUST handle `school_address`.

### REQ-5: Signup API route

The signup API route (`/api/auth/signup`) MUST:

- Accept `schoolAddress` in the request body.
- Include `schoolAddress` in the `user_metadata` passed to `supabase.auth.admin.createUser`.
- Write `school_address: schoolAddress || null` in the `user_profiles` upsert.

### REQ-6: Signup page

`app/auth/signup/page.tsx` MUST pass `schoolAddress` as the 6th argument to `signUp()` from `AuthProvider` (in addition to the existing `clientStorage` call).

### REQ-7: Signup form validation

`SignupForm` MUST validate that `schoolAddress` is non-empty for client role accounts and show an error if it is blank, preventing form submission.
