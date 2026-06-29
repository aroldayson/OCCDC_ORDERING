"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { LogOut, User } from "lucide-react";

export function UserProfile() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await signOut();
      router.refresh();
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <User className="h-3.5 w-3.5" />
        </div>
        <span className="hidden sm:inline">{user.email}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 space-y-1 rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">{user.email}</p>
            <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            {user.school_name && (
              <p className="text-xs text-slate-500">{user.school_name}</p>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
