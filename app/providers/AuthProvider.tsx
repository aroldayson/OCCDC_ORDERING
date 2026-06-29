"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase, type UserProfile, type UserRole } from "@/lib/supabase";

interface AuthContextType {
  user: UserProfile | null;
  session: any;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    role: UserRole,
    schoolName?: string,
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function schoolFromMetadata(metadata?: Record<string, unknown>): string | undefined {
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
): UserProfile {
  return {
    id: authUser.id,
    email: authUser.email ?? "",
    role,
    school_name:
      schoolName ?? schoolFromMetadata(authUser.user_metadata) ?? undefined,
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

  if (profile) {
    return {
      ...profile,
      email: profile.email || (authUser.email ?? ""),
      role: (profile.role as UserRole) || roleFromMeta || "user",
      school_name: profile.school_name?.trim() || schoolFromMeta || undefined,
    };
  }

  return buildFallbackProfile(authUser, roleFromMeta ?? "user", schoolFromMeta);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<any>(null);
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
  ) => {
    const trimmedSchool = schoolName?.trim() || undefined;

    try {
      const {
        data: { user: authUser, session },
        error: authError,
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            schoolName: trimmedSchool ?? null,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }
      if (!authUser) throw new Error("No user returned from signup");

      if (session) {
        setSession(session);
      }

      try {
        const { error: profileError } = await supabase.from("user_profiles").upsert(
          {
            id: authUser.id,
            email,
            role,
            school_name: trimmedSchool ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        );

        if (!profileError) {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", authUser.id)
            .maybeSingle();

          if (profile) {
            setUser(mergeProfileWithAuth(profile as UserProfile, authUser));
            return;
          }
        } else {
          console.warn("Profile upsert during signup:", profileError);
        }
      } catch (insertError) {
        console.warn("Profile upsert skipped during signup:", insertError);
      }

      setUser(buildFallbackProfile(authUser, role, trimmedSchool));
    } catch (error: any) {
      throw new Error(error.message || "Sign up failed");
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
    } catch (error: any) {
      throw new Error(error.message || "Sign in failed");
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
