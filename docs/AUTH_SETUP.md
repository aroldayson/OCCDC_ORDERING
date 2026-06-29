# Authentication Setup Guide

## Overview

This project uses **Supabase** for authentication and user management. The authentication system includes:

- Email/password signup and login
- Role-based access control (Admin, Client, User)
- Protected routes with middleware
- User profile management
- Session persistence

## Setup Instructions

### 1. Supabase Project Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Get your credentials from Settings > API:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Update `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

### 2. Database Setup

1. Go to Supabase SQL Editor
2. Run the migration file: `supabase/migrations/001_create_user_profiles.sql`
3. This creates:
   - `user_profiles` table
   - Row Level Security (RLS) policies
   - Indexes for performance

### 3. Environment Variables

Required variables in `.env`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## File Structure

```
app/
├── auth/
│   ├── login/page.tsx          # Login page
│   └── signup/page.tsx         # Signup page
├── components/
│   └── auth/
│       ├── ProtectedRoute.tsx  # Route protection wrapper
│       └── UserProfile.tsx     # User profile dropdown
├── providers/
│   └── AuthProvider.tsx        # Auth context and hooks
├── layout.tsx                  # Root layout with AuthProvider
└── page.tsx                    # Landing page
lib/
└── supabase.ts                 # Supabase client setup
middleware.ts                   # Next.js middleware for route protection
```

## Usage

### Using the Auth Hook

```tsx
"use client";

import { useAuth } from "@/app/providers/AuthProvider";

export function MyComponent() {
  const { user, signIn, signOut, isAuthenticated } = useAuth();

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user?.email}</p>
          <button onClick={signOut}>Logout</button>
        </>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

### Protecting Routes

```tsx
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";

export default function AdminDashboard() {
  return (
    <ProtectedRoute requiredRole="admin">
      {/* Admin content here */}
    </ProtectedRoute>
  );
}
```

### Adding User Profile Dropdown

```tsx
import { UserProfile } from "@/app/components/auth/UserProfile";

export function Header() {
  return (
    <header>
      {/* other header content */}
      <UserProfile />
    </header>
  );
}
```

## Routes

- **Public Routes:**
  - `/` - Landing page
  - `/auth/login` - Login page
  - `/auth/signup` - Signup page

- **Protected Routes:**
  - `/dashboard` - Main dashboard (requires authentication)
  - All routes in `/dashboard/*` require authentication

## User Roles

1. **Admin** (`admin`)
   - Full access to system
   - Can manage orders, items, and clients
   - Access to admin dashboard

2. **Client** (`client`)
   - Can create and view their orders
   - Associated with a school/organization
   - Limited to their own data

3. **User** (`user`)
   - Basic user access
   - Limited functionality

## API Integration

The auth context exposes these methods:

```tsx
interface AuthContextType {
  user: UserProfile | null; // Current user
  session: any; // Auth session
  loading: boolean; // Loading state
  signUp: (email, password, role, schoolName?) => Promise<void>;
  signIn: (email, password) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean; // Is user logged in
}
```

## Security Features

1. **Row Level Security (RLS)**
   - Database-level security policies
   - Users can only access their own data

2. **Protected Routes**
   - Middleware checks authentication
   - Automatic redirect to login for unauthenticated access

3. **Session Management**
   - Automatic session restoration
   - Real-time auth state updates

## Troubleshooting

### Users can't sign up

- Check Supabase project is configured
- Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set
- Check Supabase Email Provider is enabled

### Routes redirect to login

- Ensure AuthProvider wraps the entire app
- Check middleware.ts is in the root directory
- Verify session token is being stored

### Database errors

- Run the migration SQL file in Supabase
- Check RLS policies are correctly applied
- Verify table structure matches the schema

## Next Steps

1. Customize user profile fields as needed
2. Add email verification
3. Implement password reset functionality
4. Add social authentication (Google, GitHub)
5. Add two-factor authentication
