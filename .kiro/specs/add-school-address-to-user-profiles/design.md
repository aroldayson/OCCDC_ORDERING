# Design: Add school_address to user_profiles

## Affected Files

| File                                                              | Change                                                     |
| ----------------------------------------------------------------- | ---------------------------------------------------------- |
| `supabase/migrations/013_add_school_address_to_user_profiles.sql` | New migration                                              |
| `lib/supabase.ts`                                                 | Add `school_address?: string` to `UserProfile`             |
| `app/providers/AuthProvider.tsx`                                  | Add `schoolAddress` param; update helpers and context type |
| `app/api/auth/signup/route.ts`                                    | Accept and persist `schoolAddress`                         |
| `app/auth/signup/page.tsx`                                        | Pass `schoolAddress` to `signUp()`                         |
| `app/components/auth/SignupForm.tsx`                              | Make `schoolAddress` required for client role              |

## Migration (013)

```sql
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS school_address TEXT;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  parsed_categories text[];
BEGIN
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
    email        = EXCLUDED.email,
    role         = EXCLUDED.role,
    school_name  = EXCLUDED.school_name,
    school_address = EXCLUDED.school_address,
    categories   = EXCLUDED.categories,
    updated_at   = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## TypeScript Type (`lib/supabase.ts`)

Add `school_address?: string` to `UserProfile`.

## AuthProvider changes

- `AuthContextType.signUp` signature gains `schoolAddress?: string` as 6th param.
- `signUp()` implementation: include `schoolAddress` in `options.data`.
- `buildFallbackProfile`: add `school_address` from `authUser.user_metadata?.schoolAddress`.
- `mergeProfileWithAuth`: merge `school_address` from profile then metadata fallback.

## API Route (`/api/auth/signup`)

- Destructure `schoolAddress` from request body.
- Pass `schoolAddress` inside `user_metadata` to `admin.createUser`.
- Add `school_address: schoolAddress || null` to the `user_profiles` upsert object.

## Signup Page (`signup/page.tsx`)

`handleSignup` already receives `schoolAddress` as the 6th param and calls `updateClientAddress`. It just needs to also forward `schoolAddress` to `signUp(email, password, role, schoolName, categories, schoolAddress)`.

## SignupForm validation

Add a check before form submission:

```ts
if (role === "client" && !schoolAddress.trim()) {
  setError("Please enter your school address");
  return;
}
```
