"use client";

import { useEffect, useState } from "react";
import type { UserRole } from "@/lib/supabase";
import { getClients, updateClientAddress } from "@/app/components/order/clientStorage";
import { useAuth } from "@/app/providers/AuthProvider";
import { supabase } from "@/lib/supabase";

interface SignupFormProps {
  onSubmit: (
    email: string,
    password: string,
    role: UserRole,
    schoolName?: string,
    categories?: string[],
    schoolAddress?: string,
  ) => Promise<void>;
  loading?: boolean;
}

export function SignupForm({ onSubmit, loading = false }: SignupFormProps) {
  const { signUp } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("client");
  const [schoolName, setSchoolName] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [schools, setSchools] = useState<{ id: string; name: string; address?: string }[]>([]);
  const [coops, setCoops] = useState<{ id: string; name: string; address?: string }[]>([]);
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const availableCategories = [
    "fruits",
    "vegetables",
    "egg",
    "meat",
    "fish",
    "groceries",
    "rice",
  ];

  useEffect(() => {
    getClients().then(setSchools);

    supabase
      .from("coop_profile")
      .select("id,name,address")
      .order("name", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          setCoops(data);
        }
      });
  }, []);

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign up failed");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (role === "client" && !schoolName.trim()) {
      setError("Please select your school");
      return;
    }

    if (role === "client" && !schoolAddress.trim()) {
      setError("Please enter your school address");
      return;
    }

    if (role === "admin" && !schoolName.trim()) {
      setError("Please select your cooperative");
      return;
    }

    if (role === "admin" && !schoolAddress.trim()) {
      setError("Please enter your cooperative address");
      return;
    }

    if (role === "admin" && selectedCategories.length === 0) {
      setError("Please select at least one product category you supply");
      return;
    }

    const matchedCoop = role === "admin" ? coops.find((c) => c.name === schoolName.trim()) : undefined;
    const finalCoopId = matchedCoop?.id || undefined;

    setIsLoading(true);

    try {
      // Sign up using Supabase (calls API route internally, then logs in)
      await signUp(
        email,
        password,
        role,
        schoolName.trim(),
        role === "admin" ? selectedCategories : undefined,
        schoolAddress.trim(),
        finalCoopId
      );

      if (role === "client" && schoolName && schoolAddress) {
        await updateClientAddress(schoolName, schoolAddress);
      }

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (err) {
      if (err instanceof Error && err.message === "CONFIRMATION_REQUIRED") {
        setIsSuccess(true);
        setIsLoading(false);
      } else {
        setError(err instanceof Error ? err.message : "Failed to sign up");
        setIsLoading(false);
      }
    }
  };

  if (isSuccess) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100/80 shadow-inner">
          <svg className="h-6 w-6 text-emerald-600 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0l-7.5-4.615a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-900">Check your email</h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          We've sent a verification link to <strong className="text-slate-800">{email}</strong>. Please click the link to confirm your email and finish signing up.
        </p>
        <button
          onClick={() => window.location.href = "/auth/login"}
          className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-semibold text-slate-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors disabled:opacity-50 disabled:bg-slate-50"
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="role" className="text-sm font-semibold text-slate-700">
          Account Type
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => {
            const nextRole = e.target.value as UserRole;
            setRole(nextRole);
            setSchoolName("");
            setSchoolAddress("");
          }}
          disabled={isLoading}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors disabled:opacity-50 disabled:bg-slate-50"
        >
          <option value="client">School / Client</option>
          <option value="admin">Supplier / Admin</option>
        </select>
      </div>

      {role === "admin" && (
        <>
          <div className="space-y-1.5">
            <label
              htmlFor="coopName"
              className="text-sm font-semibold text-slate-700"
            >
              Cooperative
            </label>
            <select
              id="coopName"
              value={schoolName}
              onChange={(e) => {
                const name = e.target.value;
                setSchoolName(name);
                const matched = coops.find((c) => c.name === name);
                if (matched && matched.address) {
                  setSchoolAddress(matched.address);
                }
              }}
              disabled={isLoading}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors disabled:opacity-50 disabled:bg-slate-50"
            >
              <option value="">Select your cooperative...</option>
              {coops.map((coop) => (
                <option key={coop.id} value={coop.name}>
                  {coop.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">
              Ito ang cooperative na iyong kinabibilangan
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="coopAddress"
              className="text-sm font-semibold text-slate-700"
            >
              Cooperative Address
            </label>
            <input
              type="text"
              id="coopAddress"
              value={schoolAddress}
              onChange={(e) => setSchoolAddress(e.target.value)}
              disabled={isLoading}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors disabled:opacity-50 disabled:bg-slate-50"
              placeholder="Enter cooperative address"
            />
            <p className="text-xs text-slate-500">
              Address of the cooperative
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Supplied Categories
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              {availableCategories.map((category) => {
                const isChecked = selectedCategories.includes(category);
                return (
                  <label
                    key={category}
                    className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none hover:text-slate-900 p-1"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isLoading}
                      onChange={() => {
                        if (isChecked) {
                          setSelectedCategories(
                            selectedCategories.filter((c) => c !== category),
                          );
                        } else {
                          setSelectedCategories([
                            ...selectedCategories,
                            category,
                          ]);
                        }
                      }}
                      className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="capitalize">{category}</span>
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-slate-500">
              Select the categories of products that you supply
            </p>
          </div>
        </>
      )}

      {role !== "admin" && (
        <>
          <div className="space-y-1.5">
            <label
              htmlFor="schoolName"
              className="text-sm font-semibold text-slate-700"
            >
              School
            </label>
            <select
              id="schoolName"
              value={schoolName}
              onChange={(e) => {
                const name = e.target.value;
                setSchoolName(name);
                const matched = schools.find((s) => s.name === name);
                if (matched && matched.address) {
                  setSchoolAddress(matched.address);
                }
              }}
              disabled={isLoading}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors disabled:opacity-50 disabled:bg-slate-50"
            >
              <option value="">Select your school...</option>
              {schools.map((school) => (
                <option key={school.id} value={school.name}>
                  {school.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">
              Ito ang school na naka-fix sa order form pagkatapos mag-login
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="schoolAddress"
              className="text-sm font-semibold text-slate-700"
            >
              School Address
            </label>
            <input
              type="text"
              id="schoolAddress"
              value={schoolAddress}
              onChange={(e) => setSchoolAddress(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors disabled:opacity-50 disabled:bg-slate-50"
              placeholder="123 Main St, Olongapo City"
            />
            <p className="text-xs text-slate-500">
              Address of the school for delivery and invoices
            </p>
          </div>
        </>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="text-sm font-semibold text-slate-700"
        >
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors disabled:opacity-50 disabled:bg-slate-50"
          placeholder="••••••••"
        />
        <p className="text-xs text-slate-500">At least 6 characters</p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="confirmPassword"
          className="text-sm font-semibold text-slate-700"
        >
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
          required
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors disabled:opacity-50 disabled:bg-slate-50"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-4 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 shadow-sm disabled:opacity-50"
      >
        {isLoading ? "Creating account..." : "Create Account"}
      </button>

      <button
        type="button"
        onClick={handleGoogleSignup}
        disabled={isLoading}
        className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition active:scale-[0.98] disabled:opacity-50"
      >
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Continue with Google
      </button>
    </form>
  );
}
