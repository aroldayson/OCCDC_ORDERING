"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./providers/AuthProvider";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          OCCDC Order Management System
        </h1>
        <p className="mt-4 text-lg text-slate-300">
          Streamline your ordering process with our modern, efficient platform
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <Link
            href="/auth/login"
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-lg border-2 border-blue-600 px-6 py-3 font-semibold text-blue-400 hover:bg-blue-600/10"
          >
            Create Account
          </Link>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <div>
            <div className="text-3xl font-bold text-blue-400">📦</div>
            <h3 className="mt-2 font-semibold text-white">Easy Ordering</h3>
            <p className="mt-1 text-sm text-slate-400">
              Simple and intuitive interface
            </p>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-400">📊</div>
            <h3 className="mt-2 font-semibold text-white">Track Orders</h3>
            <p className="mt-1 text-sm text-slate-400">
              Real-time order status updates
            </p>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-400">🔒</div>
            <h3 className="mt-2 font-semibold text-white">Secure</h3>
            <p className="mt-1 text-sm text-slate-400">
              Enterprise-grade security
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
