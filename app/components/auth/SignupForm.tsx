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
  ) => Promise<void>;
  loading?: boolean;
}

export function SignupForm({ onSubmit, loading = false }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [schoolName, setSchoolName] = useState("");
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(loading);

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

    if ((role === "client" || role === "user") && !schoolName.trim()) {
      setError("Please select your school");
      return;
    }

    setIsLoading(true);

    try {
      await onSubmit(email, password, role, schoolName.trim() || undefined);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to sign up";

      if (
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
        <div className="rounded-lg border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-200"
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="role"
          className="block text-sm font-medium text-slate-200"
        >
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
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="user">Regular User</option>
          <option value="client">School / Client</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {role !== "admin" && (
        <div>
          <label
            htmlFor="schoolName"
            className="block text-sm font-medium text-slate-200"
          >
            School
          </label>
          <select
            id="schoolName"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            disabled={isLoading}
            required
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">Select your school...</option>
            {schools.map((school) => (
              <option key={school.id} value={school.name}>
                {school.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">
            Ito ang school na naka-fix sa order form pagkatapos mag-login
          </p>
        </div>
      )}

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-slate-200"
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
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          placeholder="••••••••"
        />
        <p className="mt-1 text-xs text-slate-400">At least 6 characters</p>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-slate-200"
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
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Creating account..." : "Create Account"}
      </button>
    </form>
  );
}
