"use client";

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

export type AdminView = "overview" | "place-order" | "orders" | "products" | "other-order" | string;

const navItems: {
  id: AdminView;
  icon: typeof LayoutDashboard;
  label: string;
  adminOnly?: boolean;
  clientOnly?: boolean;
}[] = [
  { id: "overview", icon: LayoutDashboard, label: "Dashboard", adminOnly: true },
  { id: "place-order", icon: ShoppingBag, label: "Weekly Order", clientOnly: true },
  { id: "other-order", icon: FileText, label: "Other Order", adminOnly: true },
  { id: "orders", icon: ClipboardList, label: "Order Summary", clientOnly: true },
  { id: "products", icon: Package, label: "Product", adminOnly: true },
];

type AdminSidebarProps = {
  activeView: AdminView;
  onViewChange: (view: AdminView) => void;
  sidebarOpen: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onToggleSidebar: () => void;
  isAdmin?: boolean;
};

function SidebarInner({
  activeView,
  onViewChange,
  onNavigate,
  onToggleSidebar,
  isAdmin = true,
}: {
  activeView: AdminView;
  onViewChange: (view: AdminView) => void;
  onNavigate?: () => void;
  onToggleSidebar?: () => void;
  isAdmin?: boolean;
}) {
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
      : user?.role === "client"
        ? "School Client"
        : user?.role
          ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
          : "User";

  const getSupplierNavItems = () => {
    const list = [
      { id: "overview", icon: LayoutDashboard, label: "Dashboard" }
    ];

    const cats = user?.categories && user.categories.length > 0
      ? user.categories
      : ["vegetables", "fruits", "fish", "egg", "meat", "groceries", "other_order"];

    const labels: Record<string, string> = {
      vegetables: "Vegetables Orders",
      fruits: "Fruits Orders",
      meat: "Meat Orders",
      fish: "Fish Orders",
      egg: "Egg Orders",
      groceries: "Groceries Orders",
      other_order: "Other Orders",
    };

    cats.forEach((cat) => {
      const id = cat === "other_order" ? "other-order" : `other-order-${cat}`;
      if (!list.some(item => item.id === id)) {
        list.push({
          id,
          icon: FileText,
          label: labels[cat] ?? "Other Order",
        });
      }
    });

    list.push({ id: "products", icon: Package, label: "Product" });
    return list;
  };

  const visibleNavItems = isAdmin
    ? getSupplierNavItems()
    : navItems.filter((item) => !item.adminOnly);

  return (
    <>
      <div className="flex items-center justify-between px-4 pb-4 pt-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sidebar-active text-[9px] font-bold text-sidebar-active-text">
            OCC
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-white">
              Olongapo City
            </p>
            <p className="text-sm font-medium text-[#82caff]/80">Cooperative Council</p>
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
                  {item.label}
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
            Get the latest news and updates from your cooperative.
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
          />
        </aside>
      </div>

      <div
        className={`fixed inset-0 z-50 bg-[#050a18]/80 lg:hidden transition-opacity duration-300 ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
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
          />
        </aside>
      </div>
    </>
  );
}
