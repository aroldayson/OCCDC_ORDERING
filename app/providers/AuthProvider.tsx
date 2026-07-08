"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { supabase, type UserProfile, type UserRole } from "@/lib/supabase";

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
          let { data: profile, error } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", clerkUser.id)
            .maybeSingle();

          if (error) {
            console.error("Error fetching user profile by ID:", error);
          }

          const userEmail = clerkUser.primaryEmailAddress?.emailAddress;

          // If not found by Clerk ID, look up by Email address!
          if (!profile && userEmail) {
            const { data: emailProfile, error: emailError } = await supabase
              .from("user_profiles")
              .select("*")
              .eq("email", userEmail)
              .maybeSingle();

            if (emailError) {
              console.error("Error fetching user profile by email:", emailError);
            }

            if (emailProfile) {
              // Found existing profile by email! Link it to the Clerk ID!
              const { error: updateError } = await supabase
                .from("user_profiles")
                .update({
                  id: clerkUser.id,
                  updated_at: new Date().toISOString(),
                })
                .eq("email", userEmail);

              if (updateError) {
                console.error("Error linking existing profile to Clerk ID:", updateError);
              } else {
                console.log(`Successfully migrated existing profile for ${userEmail} to Clerk ID`);
                profile = { ...emailProfile, id: clerkUser.id };
              }
            }
          }

          if (profile) {
            setUser({
              id: profile.id,
              email: profile.email || clerkUser.primaryEmailAddress?.emailAddress || "",
              role: profile.role as UserRole,
              school_name: profile.school_name || undefined,
              school_address: profile.school_address || undefined,
              categories: profile.categories || undefined,
              created_at: profile.created_at,
              updated_at: profile.updated_at,
            });
          } else {
            // Profile doesn't exist, create it (default role is 'user')
            // Since it's a new sign-in/signup, they will be redirected to complete-profile by ProtectedRoute.tsx
            const newProfile = {
              id: clerkUser.id,
              email: userEmail || "",
              role: "user",
              school_name: null,
              school_address: null,
              categories: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const { error: insertError } = await supabase
              .from("user_profiles")
              .insert(newProfile);

            if (insertError) {
              console.error("Error creating default user profile for Clerk user:", insertError);
            }
            
            setUser({
              id: newProfile.id,
              email: newProfile.email,
              role: "user" as UserRole,
              created_at: newProfile.created_at,
              updated_at: newProfile.updated_at,
            });
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
