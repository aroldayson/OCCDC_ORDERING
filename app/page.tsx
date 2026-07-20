"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./providers/AuthProvider";
import Link from "next/link";
import {
  Apple,
  Truck,
  HeartPulse,
  ArrowRight,
  School,
  Package,
} from "lucide-react";

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── HERO SECTION ── */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0c1e45] via-[#0f2c6e] to-[#0a1532] px-4 py-24">
        <div className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[120px]" />

        <div className="relative z-10 w-full max-w-4xl text-center">
          <div className="mb-6 inline-block rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-semibold text-blue-300">
            Empowering School Nutrition 🍎
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl">
            OCCDO School <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Feeding Program
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl">
            Streamline food procurement for your school's feeding program to
            ensure every student gets a healthy, nutritious meal on time.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <a
              href="#get-started"
              className="group flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-1 hover:bg-blue-500"
            >
              Get Started
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
            <Link
              href="/auth/login"
              className="rounded-xl border border-slate-700 bg-slate-800/50 px-8 py-4 text-base font-bold text-slate-300 backdrop-blur-sm transition-all hover:-translate-y-1 hover:bg-slate-800 hover:text-white"
            >
              Sign In
            </Link>
          </div>

          {/* Feature cards */}
          <div className="mt-20 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: <Apple className="h-7 w-7" />,
                bg: "bg-blue-500/20",
                text: "text-blue-400",
                hover: "hover:border-blue-500/30",
                title: "Fresh Ingredients",
                desc: "Easily order fresh vegetables, fruits, and meats specifically curated for school feeding programs.",
              },
              {
                icon: <Truck className="h-7 w-7" />,
                bg: "bg-indigo-500/20",
                text: "text-indigo-400",
                hover: "hover:border-indigo-500/30",
                title: "Manage Deliveries",
                desc: "Track weekly supply deliveries to ensure your school kitchen is always stocked and ready.",
              },
              {
                icon: <HeartPulse className="h-7 w-7" />,
                bg: "bg-purple-500/20",
                text: "text-purple-400",
                hover: "hover:border-purple-500/30",
                title: "Nutritional Focus",
                desc: "All partnered suppliers meet strict safety and nutritional standards for student health.",
              },
            ].map(({ icon, bg, text, hover, title, desc }) => (
              <div
                key={title}
                className={`group rounded-2xl border border-white/5 bg-white/5 p-8 text-left backdrop-blur-md transition-all hover:-translate-y-2 hover:bg-white/10 ${hover}`}
              >
                <div
                  className={`mb-4 inline-flex rounded-xl p-3 ${bg} ${text} transition-colors`}
                >
                  {icon}
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-200">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GET STARTED SECTION ── */}
      <section id="get-started" className="bg-white px-4 py-20">
        <div className="mx-auto max-w-5xl">
          {/* Section header */}
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-blue-600">
              Get Started
            </p>
            <h2 className="text-4xl font-extrabold text-slate-900">
              Join the OCCDO Portal
            </h2>
            <p className="mt-3 text-slate-500">
              Choose your role, follow the steps below, and start using the
              portal.
            </p>
          </div>

          {/* Role cards */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* School card */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              {/* Role header */}
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <School className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">School</h3>
                  <p className="text-sm text-slate-500">
                    Place weekly orders for your feeding program
                  </p>
                </div>
              </div>

              {/* Steps */}
              <ol className="mb-8 flex-1 space-y-3">
                {[
                  "Create a School account with your school name and contact details",
                  "Wait for cooperative admin approval of your account",
                  "Log in and select your weekly order category",
                  "Add items and submit your weekly order",
                  "Track order status and receive pricing updates every Thursday",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="text-sm text-slate-600">{step}</span>
                  </li>
                ))}
              </ol>

              {/* CTA */}
              <div>
                <Link
                  href="/auth/signup"
                  className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-blue-500"
                >
                  Sign up as School
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <p className="mt-3 text-xs text-slate-400">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            {/* Supplier card */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              {/* Role header */}
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Supplier</h3>
                  <p className="text-sm text-slate-500">
                    Manage orders, pricing, and deliveries
                  </p>
                </div>
              </div>

              {/* Steps */}
              <ol className="mb-8 flex-1 space-y-3">
                {[
                  "Register a Supplier account with your business details",
                  "Wait for cooperative admin to approve your account",
                  "Log in to view the weekly product catalog",
                  "Set pricing for items ordered by schools each week",
                  "Process orders, coordinate deliveries, and manage school accounts",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="text-sm text-slate-600">{step}</span>
                  </li>
                ))}
              </ol>

              {/* CTA */}
              <div>
                <Link
                  href="/auth/signup"
                  className="group inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-purple-600/20 transition-all hover:-translate-y-0.5 hover:bg-purple-500"
                >
                  Register as Supplier
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <p className="mt-3 text-xs text-slate-400">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="font-semibold text-purple-600 hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
