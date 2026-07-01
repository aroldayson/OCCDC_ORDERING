"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/providers/AuthProvider";
import { useEffect } from "react";
import { SignupForm } from "@/app/components/auth/SignupForm";
import type { UserRole } from "@/lib/supabase";

import { LeftAuthPanel } from "@/app/components/auth/LeftAuthPanel";

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
    categories?: string[],
  ) => {
    await signUp(email, password, role, schoolName, categories);
    router.refresh();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e2e8f0] to-[#f1f5f9] animate-gradient-xy flex items-center justify-center p-4 sm:p-8 font-sans">
      <div className="w-full sm:w-[85vw] max-w-[1400px] overflow-hidden rounded-3xl sm:rounded-[2rem] bg-white shadow-xl sm:shadow-2xl grid lg:grid-cols-2 min-h-[600px] sm:min-h-[85vh]">
        <LeftAuthPanel />

        {/* RIGHT PANEL */}
        <div className="flex flex-col justify-center p-6 sm:p-10 md:p-14 overflow-y-auto max-h-[90vh] lg:max-h-none relative">

          {/* Mobile Only Header */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <span className="text-lg">🛒</span>
            </div>
            <div className="text-left">
              <p className="uppercase tracking-widest text-blue-600 text-[10px] font-bold leading-none">
                OCCDC
              </p>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                Ordering System
              </h1>
            </div>
          </div>

          <div className="w-full max-w-[380px] mx-auto">
            <div className="mb-8 text-center flex flex-col items-center">
              <div className="hidden lg:flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-[1.75rem] font-extrabold text-slate-900 tracking-tight">
                Create Account
              </h2>
              <p className="mt-2 text-sm sm:text-[0.95rem] text-slate-500">
                Sign up to start using our platform
              </p>
            </div>

            <SignupForm onSubmit={handleSignup} />

            <div className="mt-8 relative flex items-center justify-center">
              <div className="absolute inset-x-0 h-px bg-slate-200"></div>
              <span className="relative bg-white px-4 text-xs text-slate-500 font-medium uppercase tracking-wider">or</span>
            </div>

            <div className="mt-8 space-y-3 text-center text-sm">
              <p className="text-slate-600">
                Already have an account?{" "}
                <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>

            <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col items-center gap-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 border border-slate-100 px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-1.998A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                </svg>
                Secure and trusted access
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
