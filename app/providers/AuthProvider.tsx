"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase, type UserProfile, type UserRole } from "@/lib/supabase";

interface AuthContextType {
  user: UserProfile | null;
  session: any | null;
  loading: boolean;
  initialized: boolean;
  signUp: (
    email: string,
    password: string,
    role: UserRole,
    schoolName?: string,
    categories?: string[],
    schoolAddress?: string,
    coopId?: string,
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }

      if (profile) {
        return {
          id: profile.id,
          email: profile.email || email,
          role: profile.role as UserRole,
          school_name: profile.school_name || undefined,
          school_address: profile.school_address || undefined,
          categories: profile.categories || undefined,
          coop_id: profile.coop_id || undefined,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        };
      }
      return null;
    } catch (e) {
      console.error("Failed to fetch user profile:", e);
      return null;
    }
  };

  useEffect(() => {
    let active = true;

    async function applySession(
      currentSession: Awaited<
        ReturnType<typeof supabase.auth.getSession>
      >["data"]["session"],
      options: { refreshProfile?: boolean } = {},
    ) {
      if (!active) return;
      setSession(currentSession);

      if (currentSession?.user) {
        if (options.refreshProfile) {
          const profile = await fetchProfile(
            currentSession.user.id,
            currentSession.user.email || "",
          );
          if (active) {
            setUser(profile);
          }
        }
      } else {
        setUser(null);
      }
    }

    async function getInitialSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await applySession(session, { refreshProfile: true });
      } catch (err) {
        console.error("Error getting initial session:", err);
      } finally {
        if (active) {
          setLoading(false);
          setInitialized(true);
        }
      }
    }

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!active) return;

      // Initial session is handled above; skip to avoid duplicate profile fetches.
      if (event === "INITIAL_SESSION") {
        return;
      }

      // Token refresh on tab focus must not reload the app or redirect.
      if (event === "TOKEN_REFRESHED") {
        setSession(currentSession);
        return;
      }

      if (event === "SIGNED_OUT") {
        await applySession(null);
        return;
      }

      if (
        event === "SIGNED_IN" ||
        event === "USER_UPDATED" ||
        event === "PASSWORD_RECOVERY"
      ) {
        await applySession(currentSession, { refreshProfile: true });
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    role: UserRole,
    schoolName?: string,
    categories?: string[],
    schoolAddress?: string,
    coopId?: string,
  ) => {
    // 1. Create the user using the Server API (which handles standard signUp)
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        role,
        schoolName,
        categories,
        schoolAddress,
        coopId,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Failed to create account");
    }

    // 2. Only sign in the user if they are pre-confirmed (e.g. if email confirmation is disabled in Supabase)
    if (json.isConfirmed) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }
    } else {
      // Throw a custom token indicating that the verification email was successfully sent
      throw new Error("CONFIRMATION_REQUIRED");
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
    } catch (e) {
      console.error("Failed to sign out from Supabase:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        initialized,
        signUp,
        signIn,
        signOut,
        isAuthenticated: !!session?.user,
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
