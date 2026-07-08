"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { type UserProfile, type UserRole } from "@/lib/supabase";

interface AuthContextType {
  user: UserProfile | null;
  session: any | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    role: UserRole,
    schoolName?: string,
    categories?: string[],
    schoolAddress?: string,
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  useEffect(() => {
    if (!isLoaded) return;

    if (clerkUser) {
      const fetchOrCreateProfile = async () => {
        try {
          const userEmail = clerkUser.primaryEmailAddress?.emailAddress;

          // Fetch profile via server API (uses service role key to bypass RLS)
          const params = new URLSearchParams({ clerkId: clerkUser.id });
          if (userEmail) params.set("email", userEmail);

          const res = await fetch(`/api/user/profile?${params.toString()}`);
          const json = await res.json();

          if (!res.ok) {
            console.error("Error fetching user profile:", json.error);
          }

          let profile = json.profile ?? null;

          if (profile) {
            setUser({
              id: profile.id,
              email: profile.email || userEmail || "",
              role: profile.role as UserRole,
              school_name: profile.school_name || undefined,
              school_address: profile.school_address || undefined,
              categories: profile.categories || undefined,
              created_at: profile.created_at,
              updated_at: profile.updated_at,
            });
          } else {
            // Profile doesn't exist — create it via server API (default role "user")
            // ProtectedRoute.tsx will redirect them to complete-profile
            const createRes = await fetch("/api/user/profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ clerkId: clerkUser.id, email: userEmail || "" }),
            });
            const createJson = await createRes.json();

            if (!createRes.ok) {
              console.error("Error creating default user profile:", createJson.error);
            }

            profile = createJson.profile ?? null;

            if (profile) {
              setUser({
                id: profile.id,
                email: profile.email,
                role: "user" as UserRole,
                created_at: profile.created_at,
                updated_at: profile.updated_at,
              });
            }
          }
        } catch (e) {
          console.error("Failed to fetch/create user profile:", e);
        }
      };
      fetchOrCreateProfile();
    } else {
      setUser(null);
    }
  }, [clerkUser, isLoaded]);

  // Clerk components handle the signup/login UI directly, so these forms are stubs
  const signUp = async () => {
    throw new Error("Please use the Google or email sign-up screen to create an account.");
  };

  const signIn = async () => {
    throw new Error("Please use the Google or email sign-in screen to log in.");
  };

  const signOut = async () => {
    try {
      await clerkSignOut();
      setUser(null);
    } catch (e) {
      console.error("Failed to sign out from Clerk:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session: clerkUser ? { user: { id: clerkUser.id, email: clerkUser.primaryEmailAddress?.emailAddress } } : null,
        loading: !isLoaded || (!!isSignedIn && !user),
        signUp,
        signIn,
        signOut,
        isAuthenticated: !!isSignedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
