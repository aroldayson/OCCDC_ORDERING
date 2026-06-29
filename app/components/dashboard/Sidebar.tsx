"use client";

import { ChevronDown, LogOut, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { navItems } from "./data";

type SidebarProps = {
  onNavigate?: () => void;
  showClose?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ onNavigate, showClose, onClose }: SidebarProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      router.refresh();
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??";
  const roleLabel =
    user?.role === "admin"
      ? "Super Admin"
      : user?.role
        ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
        : "User";

  return (
    <div className="flex h-full flex-col bg-sidebar text-white">
      {showClose && (
        <button
          onClick={onClose}
          className="absolute right-3 top-4 z-10 rounded-lg p-1.5 text-slate-400 hover:bg-sidebar-hover hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold ring-2 ring-blue-400/30">
            OCC
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Olongapo City
            </p>
            <p className="truncate text-sm font-bold leading-tight">Cooperative Council</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.label}>
              <button
                onClick={onNavigate}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-sidebar-active text-blue-700"
                    : "text-slate-300 hover:bg-sidebar-hover hover:text-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </span>
                {item.hasDropdown && (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-4 pb-3">
        <div className="rounded-xl border border-blue-500/40 bg-blue-600/10 p-3">
          <p className="text-xs font-semibold text-blue-300">Stay Updated</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
            Get the latest news and updates from your cooperative.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs text-slate-400">{user?.email ?? ""}</p>
            <p className="text-sm font-semibold">{roleLabel}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-sidebar-hover hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
