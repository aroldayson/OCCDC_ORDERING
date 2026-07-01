"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Menu } from "lucide-react";
import { getOrders } from "../order/orderStorage";
import { filterOrdersForSchool } from "../order/orderAccess";
import type { WeeklyOrderRecord } from "../order/types";
import { useAuth } from "@/app/providers/AuthProvider";
import { supabase } from "@/lib/supabase";
import WeeklyOrderView from "./WeeklyOrderView";
import AdminSidebar, { type AdminView } from "./AdminSidebar";
import { SidebarToggleButton } from "./SidebarToggle";
import RestaurantDashboard from "./overview/RestaurantDashboard";
import OrdersTable from "./OrdersTable";
import OrderDetailPanel from "./OrderDetailPanel";
import ProductCatalogManager from "./ProductCatalogManager";
import { isCategoryAllowed, type OrderRole } from "../order/roles";

const viewMeta: Record<AdminView, { title: string; subtitle?: string }> = {
  overview: { title: "Dashboard", subtitle: "Welcome back!" },
  "place-order": {
    title: "Weekly Product Order",
    subtitle: "Submit client weekly order",
  },
  "other-order": {
    title: "Other Order Form",
    subtitle: "Submit special or miscellaneous orders",
  },
  orders: { title: "Order Summary", subtitle: "Manage client orders" },
  products: { title: "Product Catalog", subtitle: "Manage weekly catalog products" },
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [activeView, setActiveView] = useState<AdminView>("overview");
  const [orders, setOrders] = useState<WeeklyOrderRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const loadOrders = useCallback(async () => {
    const data = await getOrders();
    setOrders(data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders();

    // Listen to local update events
    window.addEventListener("occdc-orders-updated", loadOrders);

    // Listen to remote changes on public.orders via Supabase Realtime
    const channel = supabase
      .channel("realtime-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener("occdc-orders-updated", loadOrders);
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  const visibleOrders = useMemo(() => {
    if (isAdmin) {
      if (!user?.categories || user.categories.length === 0) return orders;
      return orders.filter((o) => isCategoryAllowed(o.clientRole, user.categories));
    }
    return filterOrdersForSchool(orders, user?.school_name);
  }, [orders, isAdmin, user]);

  const dynamicViewMeta = useMemo(() => {
    const meta = { ...viewMeta };
    if (activeView.startsWith("other-order")) {
      const cat = activeView === "other-order" ? "other_order" : (activeView.replace("other-order-", "") as OrderRole);
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
      meta[activeView] = {
        title: labels[cat] ?? "Other Order Form",
        subtitle: `Manage and approve ${labels[cat] || "other"} orders`,
      };
    }
    return meta;
  }, [activeView]);

  // Enforce role-based access control constraints during render phase
  if (user) {
    const isUserAdmin = user.role === "admin";
    if (isUserAdmin) {
      if (activeView === "place-order" || activeView === "orders") {
        setActiveView("overview");
      }
    } else {
      if (activeView === "overview" || activeView.startsWith("other-order") || activeView === "products") {
        setActiveView("place-order");
      }
    }
  }

  const selectedOrder = visibleOrders.find((o) => o.id === selectedId) ?? null;

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-slate-50">
      <AdminSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        sidebarOpen={sidebarOpen}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onToggleSidebar={() => setSidebarOpen(false)}
        isAdmin={isAdmin}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center border-b border-slate-200 bg-white px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {!sidebarOpen && (
              <SidebarToggleButton
                onClick={() => setSidebarOpen(true)}
                ariaLabel="Show sidebar"
              />
            )}

            {!sidebarOpen && (
              <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white lg:flex">
                OCC
              </div>
            )}

            <div className="min-w-0 flex-1 pl-0.5 sm:pl-1">
              <h1 className="truncate text-sm font-semibold text-slate-800 sm:text-lg">
                {dynamicViewMeta[activeView].title}
              </h1>
              {dynamicViewMeta[activeView].subtitle && (
                <p className="truncate text-xs text-slate-500 sm:text-sm">
                  {dynamicViewMeta[activeView].subtitle}
                </p>
              )}
            </div>
          </div>
        </header>

        <main
          className={`min-h-0 flex-1 p-4 sm:p-6 ${activeView === "place-order" || activeView.startsWith("other-order") || activeView === "orders" || activeView === "products"
            ? "flex flex-col lg:overflow-hidden overflow-y-auto"
            : "overflow-y-auto"
            }`}
        >
          {activeView === "overview" && <RestaurantDashboard orders={visibleOrders} />}

          {activeView === "place-order" && (
            <WeeklyOrderView orders={visibleOrders} onOrdersUpdated={loadOrders} onViewChange={setActiveView} />
          )}

          {activeView.startsWith("other-order") && (
            <WeeklyOrderView
              orders={visibleOrders}
              onOrdersUpdated={loadOrders}
              forceTab="order"
              fixedCategory={activeView === "other-order" ? "other_order" : (activeView.replace("other-order-", "") as OrderRole)}
              onViewChange={setActiveView}
            />
          )}

          {activeView === "products" && (
            <ProductCatalogManager />
          )}

          {activeView === "orders" && (
            <div
              className={`flex min-h-0 flex-1 flex-col gap-4 sm:gap-5 ${selectedOrder ? "lg:grid lg:grid-cols-3 lg:gap-5" : "w-full"
                }`}
            >
              <div
                className={`flex min-h-0 flex-col ${selectedOrder ? "lg:col-span-2" : "w-full"
                  }`}
              >
                <OrdersTable
                  orders={visibleOrders}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              </div>
              {selectedOrder && (
                <div
                  className={`flex min-h-0 flex-col ${selectedOrder ? "lg:col-span-1" : ""}`}
                >
                  <OrderDetailPanel
                    order={selectedOrder}
                    onClose={() => setSelectedId(null)}
                    onStatusChange={loadOrders}
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
