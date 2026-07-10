"use client";

import { createContext, useContext, useEffect, useState } from "react";
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

    async function getInitialSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;
        setSession(session);
        if (session?.user) {
          const profile = await fetchProfile(session.user.id, session.user.email || "");
          if (active) {
            setUser(profile);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error getting initial session:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!active) return;
        setSession(currentSession);
        if (currentSession?.user) {
          setLoading(true);
          const profile = await fetchProfile(currentSession.user.id, currentSession.user.email || "");
          if (active) {
            setUser(profile);
            setLoading(false);
          }
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

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
    // 1. Create the user using the Server API (which bypasses confirmation)
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

    // 2. Sign in the user on the client using password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      throw signInError;
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
