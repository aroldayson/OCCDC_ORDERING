"use client";

import { useEffect, useState } from "react";
import type { UserRole } from "@/lib/supabase";
import { getClients } from "@/app/components/order/clientStorage";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("client");
  const [schoolName, setSchoolName] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(loading);

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
      if (role === "admin") {
        await onSubmit(email, password, role, undefined, selectedCategories);
      } else {
        await onSubmit(
          email,
          password,
          role,
          schoolName.trim(),
          undefined,
          schoolAddress.trim(),
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to sign up";

      if (errorMessage === "verification_required") {
        setError(
          "🎉 Success! Please check your Gmail account to verify your email address before signing in.",
        );
        // We leave isLoading as false so they can read the message, or they can navigate to login.
      } else if (
        errorMessage.includes("rate limit") ||
        errorMessage.includes("rate_limit")
      ) {
        setError(
          "Too many signup attempts. Please wait a few minutes and try again with a different email or try again later.",
        );
      } else if (errorMessage.includes("already registered")) {
        setError("This email is already registered. Please sign in instead.");
      } else if (errorMessage.includes("invalid email")) {
        setError("Please enter a valid email address");
      } else if (errorMessage.includes("weak password")) {
        setError("Password is too weak. Use a stronger password.");
      } else if (errorMessage.includes("email")) {
        setError(
          "There's an issue with your email. Please try a different email address.",
        );
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm space-y-1 ${error.includes("Success!") ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-600"}`}
        >
          <p>{error}</p>
          {(error.includes("Too many signup attempts") ||
            error.toLowerCase().includes("rate limit") ||
            error.toLowerCase().includes("rate_limit")) && (
            <p className="mt-1.5 text-xs text-red-500 font-medium">
              💡 <strong>Developer Tip:</strong> Supabase has a default limit of
              3 signups per hour. To increase/disable this, go to your{" "}
              <strong>
                Supabase Dashboard &gt; Project Settings &gt; Auth
              </strong>
              , scroll down to <strong>Rate Limits</strong>, and increase the{" "}
              <strong>Signups (per hour)</strong> configuration.
            </p>
          )}
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
    </form>
  );
}
