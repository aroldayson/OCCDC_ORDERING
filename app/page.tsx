"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./providers/AuthProvider";
import Link from "next/link";
import { Apple, Truck, HeartPulse, ArrowRight } from "lucide-react";

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
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0c1e45] via-[#0f2c6e] to-[#0a1532] animate-gradient-xy px-4 py-16">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-400/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-4xl text-center">
        {/* Main Hero Typography */}
        <div className="mb-6 inline-block rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-semibold text-blue-300">
          Empowering School Nutrition 🍎
        </div>
        
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl">
          OCCDC School <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent drop-shadow-sm">
            Feeding Program
          </span>
        </h1>
        
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl">
          Streamline food procurement for your school's feeding program to ensure every student gets a healthy, nutritious meal on time.
        </p>

        {/* Call to Action Buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <Link
            href="/auth/login"
            className="group flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-1 hover:bg-blue-500 hover:shadow-blue-500/40"
          >
            Access Portal
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-xl border border-slate-700 bg-slate-800/50 px-8 py-4 text-base font-bold text-slate-300 backdrop-blur-sm transition-all hover:-translate-y-1 hover:bg-slate-800 hover:text-white"
          >
            Create an Account
          </Link>
        </div>

        {/* Feature Cards Grid (Glassmorphism) */}
        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          <div className="group rounded-2xl border border-white/5 bg-white/5 p-8 text-left backdrop-blur-md transition-all hover:-translate-y-2 hover:border-blue-500/30 hover:bg-white/10">
            <div className="mb-4 inline-flex rounded-xl bg-blue-500/20 p-3 text-blue-400 shadow-inner group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <Apple className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-slate-200">Fresh Ingredients</h3>
            <p className="text-sm leading-relaxed text-slate-400">
              Easily order fresh vegetables, fruits, and meats specifically curated for school feeding programs.
            </p>
          </div>

          <div className="group rounded-2xl border border-white/5 bg-white/5 p-8 text-left backdrop-blur-md transition-all hover:-translate-y-2 hover:border-indigo-500/30 hover:bg-white/10">
            <div className="mb-4 inline-flex rounded-xl bg-indigo-500/20 p-3 text-indigo-400 shadow-inner group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <Truck className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-slate-200">Manage Deliveries</h3>
            <p className="text-sm leading-relaxed text-slate-400">
              Track weekly supply deliveries to ensure your school kitchen is always stocked and ready.
            </p>
          </div>

          <div className="group rounded-2xl border border-white/5 bg-white/5 p-8 text-left backdrop-blur-md transition-all hover:-translate-y-2 hover:border-purple-500/30 hover:bg-white/10">
            <div className="mb-4 inline-flex rounded-xl bg-purple-500/20 p-3 text-purple-400 shadow-inner group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <HeartPulse className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-slate-200">Nutritional Focus</h3>
            <p className="text-sm leading-relaxed text-slate-400">
              All partnered suppliers meet strict safety and nutritional standards for student health.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
