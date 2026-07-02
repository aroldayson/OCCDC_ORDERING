"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Menu, Bell, Check, ChevronRight } from "lucide-react";
import NotificationsView from "./NotificationsView";
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
import DeliveryFeeManager from "./DeliveryFeeManager";
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
  products: {
    title: "Pricing Update",
    subtitle: "Manage weekly catalog pricing and products",
  },
  "delivery-fees": {
    title: "Delivery Fees",
    subtitle: "Manage delivery fees for all schools",
  },
  notifications: {
    title: "Notifications",
    subtitle: "Review and accept pending orders",
  },
};

const categoryLabels: Record<string, string> = {
  vegetables: "Vegetables",
  fruits: "Fruits",
  meat: "Meat",
  fish: "Fish",
  egg: "Eggs",
  groceries: "Groceries",
  rice: "Rice",
  other_order: "Other",
};

const formatStatusLabel = (status: string) => {
  if (status === "accepted") return "Approved";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [activeView, setActiveView] = useState<AdminView>("overview");
  const [orders, setOrders] = useState<WeeklyOrderRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [readOrderIds, setReadOrderIds] = useState<string[]>([]);
  const [toasts, setToasts] = useState<
    { id: string; message: string; type: "success" | "info" }[]
  >([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Load read notifications from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("occdc-read-order-ids");
    if (saved) {
      try {
        setReadOrderIds(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing read order IDs", e);
      }
    }
  }, []);

  const saveReadIds = (ids: string[]) => {
    setReadOrderIds(ids);
    localStorage.setItem("occdc-read-order-ids", JSON.stringify(ids));
  };

  const showToast = useCallback(
    (message: string, type: "success" | "info" = "info") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    [],
  );

  const loadOrders = useCallback(async () => {
    const data = await getOrders();
    setOrders(data);
    // Prune readOrderIds — remove IDs of orders that no longer exist
    setReadOrderIds((prev) => {
      if (prev.length === 0) return prev;
      const existingIds = new Set(data.map((o) => o.id));
      const pruned = prev.filter((id) => existingIds.has(id));
      if (pruned.length !== prev.length) {
        localStorage.setItem("occdc-read-order-ids", JSON.stringify(pruned));
        return pruned;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
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
        (payload) => {
          loadOrders();

          if (payload.eventType === "INSERT") {
            // Realtime payload uses snake_case DB column names
            const raw = payload.new as Record<string, unknown>;
            const clientRole = (raw.client_role ?? raw.clientRole) as string;
            const clientName = (raw.client_name ?? raw.clientName) as string;

            if (isAdmin) {
              if (
                !user?.categories ||
                user.categories.length === 0 ||
                isCategoryAllowed(
                  clientRole as Parameters<typeof isCategoryAllowed>[0],
                  user.categories,
                )
              ) {
                showToast(`New order from ${clientName}!`, "info");
              }
            }
          } else if (payload.eventType === "UPDATE") {
            const raw = payload.new as Record<string, unknown>;
            const rawOld = payload.old as Record<string, unknown>;
            const clientName = (raw.client_name ?? raw.clientName) as string;
            const newStatus = raw.status as string;
            const oldStatus = rawOld?.status as string | undefined;

            if (
              !isAdmin &&
              user?.school_name &&
              clientName === user.school_name
            ) {
              const isApproved =
                newStatus === "accepted" ||
                newStatus === "processing" ||
                newStatus === "completed";
              const statusChanged = !oldStatus || oldStatus !== newStatus;
              if (isApproved && statusChanged) {
                showToast(
                  `Your order has been approved by the supplier!`,
                  "success",
                );
              }
            }
          }
        },
      )
      .subscribe();

    return () => {
      window.removeEventListener("occdc-orders-updated", loadOrders);
      supabase.removeChannel(channel);
    };
  }, [loadOrders, isAdmin, user, showToast]);

  const visibleOrders = useMemo(() => {
    if (isAdmin) {
      if (!user?.categories || user.categories.length === 0) return orders;
      return orders.filter((o) =>
        isCategoryAllowed(o.clientRole, user.categories),
      );
    }
    return filterOrdersForSchool(orders, user?.school_name);
  }, [orders, isAdmin, user]);

  const dynamicViewMeta = useMemo(() => {
    const meta = { ...viewMeta };
    if (activeView.startsWith("other-order")) {
      const cat =
        activeView === "other-order"
          ? "other_order"
          : (activeView.replace("other-order-", "") as OrderRole);
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
      if (
        activeView === "overview" ||
        activeView.startsWith("other-order") ||
        activeView === "products" ||
        activeView === "delivery-fees"
      ) {
        setActiveView("place-order");
      }
    }
  }

  const selectedOrder = visibleOrders.find((o) => o.id === selectedId) ?? null;

  // Compute orders that qualify for notifications list
  const notifOrders = useMemo(() => {
    return visibleOrders
      .filter((o) => {
        if (isAdmin) {
          return o.status === "pending";
        } else {
          const isApproved =
            o.status === "accepted" ||
            o.status === "processing" ||
            o.status === "completed";
          const isRecent =
            Date.now() - new Date(o.createdAt).getTime() <
            7 * 24 * 60 * 60 * 1000;
          return isApproved && isRecent;
        }
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [visibleOrders, isAdmin]);

  // Compute unread count based on localStorage
  const pendingCount = useMemo(() => {
    return notifOrders.filter((o) => !readOrderIds.includes(o.id)).length;
  }, [notifOrders, readOrderIds]);

  const handleMarkAllAsRead = () => {
    const allIds = notifOrders.map((o) => o.id);
    const updated = Array.from(new Set([...readOrderIds, ...allIds]));
    saveReadIds(updated);
  };

  const handleItemClick = (order: WeeklyOrderRecord) => {
    if (!readOrderIds.includes(order.id)) {
      saveReadIds([...readOrderIds, order.id]);
    }
    setNotifDropdownOpen(false);
    if (isAdmin) {
      const view =
        order.clientRole === "other_order"
          ? "other-order"
          : `other-order-${order.clientRole}`;
      setActiveView(view);
    } else {
      setActiveView("orders");
    }
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-slate-50 relative">
      <AdminSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        sidebarOpen={sidebarOpen}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onToggleSidebar={() => setSidebarOpen(false)}
        isAdmin={isAdmin}
        orders={visibleOrders}
        readOrderIds={readOrderIds}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden relative">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 py-2 sm:px-4 sm:py-3 relative z-30">
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
                {dynamicViewMeta[activeView]?.title || "Dashboard"}
              </h1>
              {dynamicViewMeta[activeView]?.subtitle && (
                <p className="truncate text-xs text-slate-500 sm:text-sm">
                  {dynamicViewMeta[activeView].subtitle}
                </p>
              )}
            </div>
          </div>

          {user && (
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 focus:outline-none"
                aria-label="View notifications"
              >
                <Bell className="h-5 w-5 text-slate-600" strokeWidth={2} />
                {pendingCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white ring-2 ring-white animate-bounce">
                    {pendingCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Card matching Reference Image */}
              {notifDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setNotifDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50 animate-slide-in">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="font-bold text-slate-800 text-sm">
                        Notifications
                      </span>
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                      >
                        Mark all as read
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifOrders.slice(0, 4).map((order) => {
                        const isUnread = !readOrderIds.includes(order.id);
                        const categoryLabel =
                          categoryLabels[order.clientRole] || order.clientRole;
                        const dateStr = new Date(
                          order.createdAt,
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });

                        return (
                          <div
                            key={order.id}
                            onClick={() => handleItemClick(order)}
                            className={`flex gap-3 py-3 cursor-pointer transition hover:bg-slate-50/50 relative ${
                              isUnread ? "bg-blue-50/10" : ""
                            }`}
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                              <Bell className="h-4.5 w-4.5" strokeWidth={2} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-bold text-slate-800 truncate">
                                  {isAdmin
                                    ? `Order ID: ${order.id} — Pending`
                                    : `Order ID: ${order.id} — ${formatStatusLabel(order.status)}`}
                                </p>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  {dateStr}
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
                                {isAdmin
                                  ? `${order.clientName} submitted a ${categoryLabel.toLowerCase()} order with ${order.items.length} items.`
                                  : `Your ${categoryLabel.toLowerCase()} order with ${order.items.length} items is now ${formatStatusLabel(order.status).toLowerCase()}.`}
                              </p>
                            </div>

                            {isUnread && (
                              <span className="absolute right-2 bottom-3 h-2 w-2 rounded-full bg-orange-500" />
                            )}
                          </div>
                        );
                      })}

                      {notifOrders.length === 0 && (
                        <div className="py-8 text-center">
                          <p className="text-xs text-slate-400">
                            No notifications found.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-3 text-center">
                      <button
                        onClick={() => {
                          setNotifDropdownOpen(false);
                          setActiveView("notifications");
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                      >
                        <span>View all notifications</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </header>

        <main
          className={`min-h-0 flex-1 p-4 sm:p-6 ${
            activeView === "place-order" ||
            activeView.startsWith("other-order") ||
            activeView === "orders" ||
            activeView === "products" ||
            activeView === "notifications"
              ? "flex flex-col lg:overflow-hidden overflow-y-auto"
              : "overflow-y-auto"
          }`}
        >
          {activeView === "overview" && (
            <RestaurantDashboard orders={visibleOrders} />
          )}

          {activeView === "notifications" && (
            <NotificationsView
              orders={visibleOrders}
              onOrdersUpdated={loadOrders}
              onViewChange={setActiveView}
              onSelectOrder={setSelectedId}
              isAdmin={isAdmin}
              readOrderIds={readOrderIds}
              onMarkReadIds={saveReadIds}
            />
          )}

          {activeView === "place-order" && (
            <WeeklyOrderView
              orders={visibleOrders}
              onOrdersUpdated={loadOrders}
              onViewChange={setActiveView}
            />
          )}

          {activeView.startsWith("other-order") && (
            <WeeklyOrderView
              orders={visibleOrders}
              onOrdersUpdated={loadOrders}
              forceTab="order"
              fixedCategory={
                activeView === "other-order"
                  ? "other_order"
                  : (activeView.replace("other-order-", "") as OrderRole)
              }
              onViewChange={setActiveView}
            />
          )}

          {activeView === "products" && (
            <ProductCatalogManager orders={visibleOrders} />
          )}

          {activeView === "delivery-fees" && <DeliveryFeeManager />}

          {activeView === "orders" && (
            <div
              className={`flex min-h-0 flex-1 flex-col gap-4 sm:gap-5 ${
                selectedOrder ? "lg:grid lg:grid-cols-3 lg:gap-5" : "w-full"
              }`}
            >
              <div
                className={`flex min-h-0 flex-col ${
                  selectedOrder ? "lg:col-span-2" : "w-full"
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

      {/* Toast notifications container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-bold shadow-lg transition-all duration-300 animate-slide-in ${
              toast.type === "success"
                ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                : "border-blue-100 bg-blue-50 text-blue-800"
            }`}
          >
            {toast.type === "success" ? (
              <Check className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
