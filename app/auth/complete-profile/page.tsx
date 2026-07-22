"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { supabase, type UserRole } from "@/lib/supabase";
import { getClients, updateClientAddress } from "@/app/components/order/clientStorage";
import { LeftAuthPanel } from "@/app/components/auth/LeftAuthPanel";
import OccdoLogo from "@/app/components/brand/OccdoLogo";
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";
import { ClipboardList, GraduationCap, MapPin, Truck } from "lucide-react";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, initialized } = useAuth();
  
  const [role, setRole] = useState<UserRole>("client");
  const [schoolName, setSchoolName] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
  }, []);

  // Redirect if they already have a completed profile
  useEffect(() => {
    if (initialized && user && user.role !== "user") {
      router.push("/dashboard");
    }
  }, [user, initialized, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user) {
      setError("You must be signed in to complete your profile.");
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

    setSubmitting(true);

    try {
      // 1. Update user profile table via API
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          role,
          school_name: role === "client" ? schoolName.trim() : null,
          school_address: role === "client" ? schoolAddress.trim() : null,
          categories: role === "admin" ? selectedCategories : null,
        }),
      });
      
      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to update profile");
      }

      // 3. Update schools table if client
      if (role === "client" && schoolName && schoolAddress) {
        await updateClientAddress(schoolName, schoolAddress);
      }

      // 4. Force a full reload redirect to ensure AuthProvider is fully reinitialized
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Complete profile error:", err);
      setError(err instanceof Error ? err.message : "Failed to complete profile. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e2e8f0] to-[#f1f5f9] animate-gradient-xy flex items-center justify-center p-4 sm:p-8 font-sans">
        <div className="w-full sm:w-[85vw] max-w-[1400px] overflow-hidden rounded-3xl sm:rounded-[2rem] bg-white shadow-xl sm:shadow-2xl grid lg:grid-cols-2 min-h-[600px] sm:min-h-[85vh]">
          <LeftAuthPanel />

          {/* RIGHT PANEL */}
          <div className="flex flex-col justify-center p-6 sm:p-10 md:p-14 overflow-y-auto max-h-[90vh] lg:max-h-none relative">
            {/* Mobile Only Header */}
            <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
              <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm overflow-hidden p-0.5">
                <OccdoLogo size={36} className="h-full w-full" />
              </div>
              <div className="text-left">
                <p className="uppercase tracking-widest text-blue-600 text-[10px] font-bold leading-none">
                  OCCDO
                </p>
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  Ordering System
                </h1>
              </div>
            </div>

            <div className="w-full max-w-[420px] mx-auto">
              <div className="mb-8 text-center flex flex-col items-center">
                <div className="hidden lg:flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md mb-6">
                  <ClipboardList className="h-7 w-7" />
                </div>
                <h2 className="text-2xl sm:text-[1.75rem] font-extrabold text-slate-900 tracking-tight">
                  Complete Your Profile
                </h2>
                <p className="mt-2 text-sm sm:text-[0.95rem] text-slate-500 text-center">
                  Mag-set up ng account details para makapagsimula sa platform.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="role" className="text-sm font-semibold text-slate-700">
                    Account Type
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value as UserRole);
                    }}
                    disabled={submitting}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors disabled:opacity-50"
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
                              disabled={submitting}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedCategories(
                                    selectedCategories.filter((c) => c !== category)
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
                      Pumili ng mga kategorya na iyong isyu-supply sa system.
                    </p>
                  </div>
                )}

                {role !== "admin" && (
                  <>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="schoolName"
                        className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
                      >
                        <GraduationCap className="h-4 w-4 text-slate-400" />
                        School Name
                      </label>
                      <select
                        id="schoolName"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        disabled={submitting}
                        required
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors disabled:opacity-50"
                      >
                        <option value="">Select your school...</option>
                        {schools.map((school) => (
                          <option key={school.id} value={school.name}>
                            {school.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-500">
                        Ito ang school na naka-fix sa order form pagkatapos mag-login.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="schoolAddress"
                        className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
                      >
                        <MapPin className="h-4 w-4 text-slate-400" />
                        School Address
                      </label>
                      <input
                        type="text"
                        id="schoolAddress"
                        value={schoolAddress}
                        onChange={(e) => setSchoolAddress(e.target.value)}
                        disabled={submitting}
                        required
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors disabled:opacity-50"
                        placeholder="e.g. 123 Rizal St, Olongapo City"
                      />
                      <p className="text-xs text-slate-500">
                        Address para sa delivery at tracking ng mga orders.
                      </p>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-4 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Saving profile..." : "Submit & Continue"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
