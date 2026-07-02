"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase, type UserProfile, type UserRole } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
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

function schoolFromMetadata(
  metadata?: Record<string, unknown>,
): string | undefined {
  const value = metadata?.schoolName ?? metadata?.school_name;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function buildFallbackProfile(
  authUser: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  },
  role: UserRole = "user",
  schoolName?: string,
  categories?: string[],
  schoolAddress?: string,
): UserProfile {
  return {
    id: authUser.id,
    email: authUser.email ?? "",
    role,
    school_name:
      schoolName ?? schoolFromMetadata(authUser.user_metadata) ?? undefined,
    categories:
      categories ??
      (authUser.user_metadata?.categories as string[]) ??
      undefined,
    school_address:
      schoolAddress ??
      (authUser.user_metadata?.schoolAddress as string | undefined),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function mergeProfileWithAuth(
  profile: UserProfile | null,
  authUser: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  },
): UserProfile {
  const metadata = authUser.user_metadata ?? {};
  const schoolFromMeta = schoolFromMetadata(metadata);
  const roleFromMeta = metadata.role as UserRole | undefined;
  const categoriesFromMeta = metadata.categories as string[] | undefined;
  const schoolAddressFromMeta = metadata.schoolAddress as string | undefined;

  if (profile) {
    return {
      ...profile,
      email: profile.email || (authUser.email ?? ""),
      role: (profile.role as UserRole) || roleFromMeta || "user",
      school_name: profile.school_name?.trim() || schoolFromMeta || undefined,
      categories: profile.categories || categoriesFromMeta || undefined,
      school_address:
        profile.school_address || schoolAddressFromMeta || undefined,
    };
  }

  return buildFallbackProfile(
    authUser,
    roleFromMeta ?? "user",
    schoolFromMeta,
    categoriesFromMeta,
    schoolAddressFromMeta,
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setSession(session);

          const { data: profile, error } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();

          if (profile) {
            setUser(mergeProfileWithAuth(profile as UserProfile, session.user));
          } else if (error?.code !== "PGRST116") {
            console.warn(
              "Could not load profile, using fallback auth state:",
              error,
            );
            setUser(mergeProfileWithAuth(null, session.user));
          } else {
            setUser(mergeProfileWithAuth(null, session.user));
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();

          if (profile) {
            setUser(mergeProfileWithAuth(profile as UserProfile, session.user));
          } else {
            setUser(mergeProfileWithAuth(null, session.user));
          }
        } catch (profileError) {
          console.warn("Auth state profile fetch error:", profileError);
          setUser(mergeProfileWithAuth(null, session.user));
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    role: UserRole,
    schoolName?: string,
    categories?: string[],
    schoolAddress?: string,
  ) => {
    const trimmedSchool = schoolName?.trim() || undefined;
    const trimmedAddress = schoolAddress?.trim() || undefined;

    try {
      // Use the Admin API route to bypass Supabase client-side rate limits
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role,
          schoolName: trimmedSchool,
          categories,
          schoolAddress: trimmedAddress,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg: string = json?.error ?? "Sign up failed";
        if (
          msg.toLowerCase().includes("already registered") ||
          msg.toLowerCase().includes("already exists")
        ) {
          throw new Error(
            "This email is already registered. Please sign in instead.",
          );
        }
        throw new Error(msg);
      }

      // Sign in immediately after account creation to get a session
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        throw new Error(signInError.message);
      }

      if (!data.session) {
        throw new Error("verification_required");
      }

      setSession(data.session);

      if (data.user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profile) {
          setUser(mergeProfileWithAuth(profile as UserProfile, data.user));
        } else {
          setUser(
            buildFallbackProfile(
              data.user,
              role,
              trimmedSchool,
              categories,
              trimmedAddress,
            ),
          );
        }
      }
    } catch (error) {
      throw new Error((error as Error).message || "Sign up failed");
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      setSession(session);

      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();

          if (profile) {
            setUser(mergeProfileWithAuth(profile as UserProfile, session.user));
          } else {
            setUser(mergeProfileWithAuth(null, session.user));
          }
        } catch (profileError) {
          console.warn("Sign in profile fetch error:", profileError);
          setUser(mergeProfileWithAuth(null, session.user));
        }
      }
    } catch (error) {
      throw new Error((error as Error).message || "Sign in failed");
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        isAuthenticated: !!user || !!session,
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
