"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  Bell,
  LogOut,
  X,
  ChevronUp,
  Package,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { SidebarToggleButton } from "./SidebarToggle";
import OccdoLogo from "../brand/OccdoLogo";
import type { WeeklyOrderRecord } from "../order/types";
import { supabase } from "@/lib/supabase";

export type AdminView =
  | "overview"
  | "place-order"
  | "orders"
  | "products"
  | "other-order"
  | string;

const navItems: {
  id: AdminView;
  icon: typeof LayoutDashboard;
  label: string;
  adminOnly?: boolean;
  clientOnly?: boolean;
}[] = [
  {
    id: "overview",
    icon: LayoutDashboard,
    label: "Dashboard",
    adminOnly: true,
  },
  {
    id: "place-order",
    icon: ShoppingBag,
    label: "Weekly Order",
    clientOnly: true,
  },
  { id: "other-order", icon: FileText, label: "Other Order", adminOnly: true },
  {
    id: "orders",
    icon: ClipboardList,
    label: "Order Summary",
    clientOnly: true,
  },
  { id: "notifications", icon: Bell, label: "Notifications" },
  { id: "products", icon: Package, label: "Product", adminOnly: true },
  {
    id: "delivery-fees",
    icon: ClipboardList,
    label: "Delivery Fees",
    adminOnly: true,
  },
];

type AdminSidebarProps = {
  activeView: AdminView;
  onViewChange: (view: AdminView) => void;
  sidebarOpen: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onToggleSidebar: () => void;
  isAdmin?: boolean;
  orders?: WeeklyOrderRecord[];
  readOrderIds?: string[];
};

function SidebarInner({
  activeView,
  onViewChange,
  onNavigate,
  onToggleSidebar,
  isAdmin = true,
  orders = [],
  readOrderIds = [],
}: {
  activeView: AdminView;
  onViewChange: (view: AdminView) => void;
  onNavigate?: () => void;
  onToggleSidebar?: () => void;
  isAdmin?: boolean;
  orders?: WeeklyOrderRecord[];
  readOrderIds?: string[];
}) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [coopName, setCoopName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (user?.role === "admin" && user?.coop_id) {
      supabase
        .from("coop_profile")
        .select("name")
        .eq("id", user.coop_id)
        .maybeSingle()
        .then(({ data }) => {
          if (active && data && data.name) {
            setCoopName(data.name);
          }
        });
    } else if (user?.role === "client" && user?.school_name) {
      supabase
        .from("schools")
        .select("coop_id")
        .ilike("name", user.school_name.trim())
        .maybeSingle()
        .then(({ data: schoolData }) => {
          if (active && schoolData && schoolData.coop_id) {
            supabase
              .from("coop_profile")
              .select("name")
              .eq("id", schoolData.coop_id)
              .maybeSingle()
              .then(({ data: coopData }) => {
                if (active && coopData && coopData.name) {
                  setCoopName(coopData.name);
                }
              });
          }
        });
    }
    return () => {
      active = false;
    };
  }, [user?.role, user?.coop_id, user?.school_name]);

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
      ? "Supplier"
      : user?.role === "client"
        ? "School Client"
        : user?.role
          ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
          : "User";

  const getSupplierNavItems = () => {
    const list = [
      { id: "overview", icon: LayoutDashboard, label: "Dashboard" },
      { id: "place-order", icon: ShoppingBag, label: "Weekly Order" },
      { id: "orders", icon: ClipboardList, label: "Order Summary" },
      { id: "notifications", icon: Bell, label: "Notifications" },
    ];

    const cats =
      user?.categories && user.categories.length > 0
        ? user.categories
        : [
            "vegetables",
            "fruits",
            "fish",
            "egg",
            "meat",
            "groceries",
            "rice",
            "other_order",
          ];

    const labels: Record<string, string> = {
      vegetables: "Vegetables Orders",
      fruits: "Fruits Orders",
      meat: "Meat Orders",
      fish: "Fish Orders",
      egg: "Egg Orders",
      groceries: "Groceries Orders",
      rice: "Rice Orders",
      other_order: "Other Orders",
    };

    cats.forEach((cat) => {
      const id = cat === "other_order" ? "other-order" : `other-order-${cat}`;
      if (!list.some((item) => item.id === id)) {
        list.push({
          id,
          icon: FileText,
          label: labels[cat] ?? "Other Order",
        });
      }
    });

    list.push({ id: "products", icon: Package, label: "Pricing Update" });
    return list;
  };

  const visibleNavItems = isAdmin
    ? getSupplierNavItems()
    : navItems.filter((item) => !item.adminOnly);

  const getPendingCountForId = (id: string) => {
    if (id === "notifications") {
      return orders.filter((o) => {
        if (isAdmin) {
          const isPending = o.status === "pending";
          const isApproved =
            o.status === "accepted" ||
            o.status === "processing" ||
            o.status === "completed";
          const isRecent =
            Date.now() - new Date(o.createdAt).getTime() <
            7 * 24 * 60 * 60 * 1000;
          return (isPending || (isApproved && isRecent)) && !readOrderIds.includes(o.id);
        } else {
          const isApproved =
            o.status === "accepted" ||
            o.status === "processing" ||
            o.status === "completed";
          const isRecent =
            Date.now() - new Date(o.createdAt).getTime() <
            7 * 24 * 60 * 60 * 1000;
          return isApproved && isRecent && !readOrderIds.includes(o.id);
        }
      }).length;
    }
    if (id.startsWith("other-order-")) {
      const cat = id.replace("other-order-", "");
      return orders.filter(
        (o) =>
          o.clientRole === cat &&
          o.status === "pending" &&
          !readOrderIds.includes(o.id),
      ).length;
    }
    if (id === "other-order") {
      return orders.filter(
        (o) =>
          o.clientRole === "other_order" &&
          o.status === "pending" &&
          !readOrderIds.includes(o.id),
      ).length;
    }
    return 0;
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 pb-4 pt-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-0.5 shadow-sm">
            <OccdoLogo size={40} className="h-full w-full" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-white">
              Olongapo City
            </p>
            <p className="text-sm font-medium text-[#82caff]/80">
              Cooperative Office
            </p>
          </div>
        </div>
        {onToggleSidebar && (
          <SidebarToggleButton
            onClick={onToggleSidebar}
            ariaLabel="Hide sidebar"
            className="text-white/60 hover:bg-white/10 hover:text-white"
          />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        <div className="mb-2 flex items-center justify-between rounded-xl bg-sidebar-section px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
            Menu
          </p>
          <ChevronUp className="h-3.5 w-3.5 text-white/80" strokeWidth={2} />
        </div>

        <ul className="space-y-1.5 px-1 py-1">
          {visibleNavItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    onViewChange(item.id);
                    onNavigate?.();
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "rounded-full bg-sidebar-active font-semibold text-sidebar-active-text shadow-md"
                      : "rounded-xl text-[#e2e8f0] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <item.icon
                    className={`h-4 w-4 shrink-0 ${isActive ? "text-sidebar-active-text" : "text-white/90"}`}
                    strokeWidth={2}
                  />
                  <span>{item.label}</span>
                  {getPendingCountForId(item.id) > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white ring-2 ring-white/10 animate-pulse">
                      {getPendingCountForId(item.id)}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-3 border-t border-white/10 p-4">
        <div className="rounded-2xl border border-[#1e3a5f] bg-[#1e3a5f]/40 p-3">
          <div className="mb-1 flex items-center gap-2">
            <Bell className="h-3.5 w-3.5 text-[#82caff]" strokeWidth={2} />
            <p className="text-xs font-bold text-[#82caff]">Stay Updated</p>
          </div>
          <p className="text-[11px] leading-relaxed text-white/50">
            Get the latest news and updates from {coopName || "your cooperative"}.
          </p>
        </div>

        <div className="rounded-2xl border border-[#1e3a5f] bg-[#0a1931]/80 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sidebar-active text-sm font-bold text-sidebar-active-text">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-white">{user?.email ?? ""}</p>
              {user?.school_name && (
                <p className="truncate text-[11px] text-white/70">
                  {user.school_name}
                </p>
              )}
              <p className="text-[11px] text-white/50">{roleLabel}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-[#1e3a5f] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/5"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} />
          Logout
        </button>

        <p className="text-center text-[10px] text-white/30 select-none">
          v1.0.1 &copy; 2026 OCCDO
        </p>
      </div>
    </>
  );
}

export default function AdminSidebar({
  activeView,
  onViewChange,
  sidebarOpen,
  mobileOpen,
  onMobileClose,
  onToggleSidebar,
  isAdmin = true,
  orders = [],
  readOrderIds = [],
}: AdminSidebarProps) {
  return (
    <>
      <div
        className={`hidden h-full shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out lg:block ${
          sidebarOpen ? "w-64" : "w-0"
        }`}
      >
        <aside className="sidebar-gradient flex h-full w-64 flex-col overflow-hidden text-white">
          <SidebarInner
            activeView={activeView}
            onViewChange={onViewChange}
            onToggleSidebar={onToggleSidebar}
            isAdmin={isAdmin}
            orders={orders}
            readOrderIds={readOrderIds}
          />
        </aside>
      </div>

      <div
        className={`fixed inset-0 z-50 bg-[#050a18]/80 lg:hidden transition-opacity duration-300 ${
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <div className="absolute inset-0" onClick={onMobileClose} />
        <aside
          className={`sidebar-gradient absolute left-0 top-0 m-3 flex h-[calc(100%-24px)] w-[calc(100%-24px)] max-w-72 flex-col overflow-hidden rounded-2xl text-white shadow-2xl transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            onClick={onMobileClose}
            className="absolute right-3 top-4 z-10 rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
          <SidebarInner
            activeView={activeView}
            onViewChange={onViewChange}
            onNavigate={onMobileClose}
            isAdmin={isAdmin}
            orders={orders}
            readOrderIds={readOrderIds}
          />
        </aside>
      </div>
    </>
  );
}
