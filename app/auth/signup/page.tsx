"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/providers/AuthProvider";
import { useEffect } from "react";
import { SignupForm } from "@/app/components/auth/SignupForm";
import type { UserRole } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const { signUp, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [loading, isAuthenticated, router]);

  const handleSignup = async (
    email: string,
    password: string,
    role: UserRole,
    schoolName?: string,
  ) => {
    await signUp(email, password, role, schoolName);
    router.refresh();
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">OCCDC</h1>
          <p className="mt-2 text-slate-300">Order Management System</p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-white">Create Account</h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign up to start using our platform
          </p>

          <div className="mt-6">
            <SignupForm onSubmit={handleSignup} />
          </div>

          <div className="mt-6 border-t border-slate-700 pt-6">
            <p className="text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
