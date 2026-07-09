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
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    const refresh = () => getClients().then(setSchools);
    window.addEventListener("occdc-clients-updated", refresh);
    return () => window.removeEventListener("occdc-clients-updated", refresh);
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

    if (role === "admin" && selectedCategories.length === 0) {
      setError("Please select at least one product category you supply");
      return;
    }

    setIsLoading(true);

    try {
      // Sign up using Supabase (calls API route internally, then logs in)
      await signUp(
        email,
        password,
        role,
        role === "client" ? schoolName.trim() : undefined,
        role === "admin" ? selectedCategories : undefined,
        role === "client" ? schoolAddress.trim() : undefined
      );

      if (role === "client" && schoolName && schoolAddress) {
        await updateClientAddress(schoolName, schoolAddress);
      }

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
      setIsLoading(false);
    }
  };

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
            if (nextRole === "admin") setSchoolName("");
          }}
          disabled={isLoading}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors disabled:opacity-50 disabled:bg-slate-50"
        >
          <option value="client">School / Client</option>
          <option value="admin">Supplier / Admin</option>
        </select>
      </div>

      {role === "admin" && (
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
              onChange={(e) => setSchoolName(e.target.value)}
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
