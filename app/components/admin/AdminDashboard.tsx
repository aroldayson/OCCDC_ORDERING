  "use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Menu, Bell, Check, ChevronRight } from "lucide-react";
import NotificationsView from "./NotificationsView";
import { getOrders } from "../order/orderStorage";
import { filterOrdersForSchool, filterOrdersForWeek } from "../order/orderAccess";
import type { WeeklyOrderRecord } from "../order/types";
import { useAuth } from "@/app/providers/AuthProvider";
import WeeklyOrderView from "./WeeklyOrderView";
import AdminSidebar, { type AdminView } from "./AdminSidebar";
import { SidebarToggleButton } from "./SidebarToggle";
import OccdoLogo from "../brand/OccdoLogo";
import RestaurantDashboard from "./overview/RestaurantDashboard";
import OrdersTable from "./OrdersTable";
import OrderDetailPanel from "./OrderDetailPanel";
import ProductCatalogManager from "./ProductCatalogManager";
import DeliveryFeeManager from "./DeliveryFeeManager";
import PrintReceiptModal from "./PrintReceiptModal";
import { isCategoryAllowed, type OrderRole } from "../order/roles";
import {
  getJuneAugustWeeks,
  getCanonicalWeekLabelForOrder,
  getPeriodWeekFromLabel,
  getWeekLabelForPeriodWeek,
} from "../order/weekUtils";
import {
  useRealtimeOrderNotifications,
  type NotificationToast,
} from "@/app/hooks/useRealtimeOrderNotifications";

function normalizeWeekFilterValue(weekParam: string | null | undefined): string {
  if (!weekParam || weekParam === "all") return "all";
  const periodWeek = getPeriodWeekFromLabel(weekParam);
  if (periodWeek !== null) {
    return getWeekLabelForPeriodWeek(periodWeek) ?? weekParam;
  }
  return weekParam;
}

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

  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeView, setActiveView] = useState<AdminView>(() => {
    const initialView = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("view")
      : null;
    if (initialView) return initialView;
    return user?.role === "admin" ? "overview" : "place-order";
  });

  // Sync activeView with URL search parameter "view" when it changes
  useEffect(() => {
    const viewParam = searchParams?.get("view");
    if (viewParam) {
      setActiveView(viewParam);
    }
    if (viewParam === "overview") {
      const hasStaleParams =
        searchParams?.get("orderId") ||
        searchParams?.get("week") ||
        searchParams?.get("school") ||
        searchParams?.get("category") ||
        searchParams?.get("status");
      if (hasStaleParams) {
        router.replace(`${window.location.pathname}?view=overview`, {
          scroll: false,
        });
      }
      setOrderDetailOpen(false);
      setSelectedId(null);
    }
  }, [searchParams, router]);

  // Handler to change view and update URL query param
  const handleViewChange = useCallback((view: AdminView) => {
    setActiveView(view);
    if (view === "overview") {
      setOrderDetailOpen(false);
      setSelectedId(null);
    }
    router.push(`${window.location.pathname}?view=${encodeURIComponent(view)}`);
  }, [router]);

  const handleGoToPricing = useCallback(
    (order: WeeklyOrderRecord) => {
      setActiveView("products");
      const params = new URLSearchParams(window.location.search);
      params.set("view", "products");
      if (order.weekLabel) params.set("week", getCanonicalWeekLabelForOrder(order));
      if (order.clientName) params.set("school", order.clientName);
      if (order.clientRole) params.set("category", order.clientRole);
      if (order.id) params.set("orderId", order.id);
      router.push(`${window.location.pathname}?${params.toString()}`);
    },
    [router],
  );

  const handleGoToOrdersFromPricing = useCallback(
    (context: {
      week: string;
      school?: string;
      category?: string;
      orderId?: string;
    }) => {
      setActiveView("orders");
      setOrdersWeek(context.week);
      if (context.orderId) {
        setSelectedId(context.orderId);
        setOrderDetailOpen(true);
      }
      const params = new URLSearchParams();
      params.set("view", "orders");
      params.set("week", context.week);
      if (context.school) params.set("school", context.school);
      if (context.category) params.set("category", context.category);
      if (context.orderId) params.set("orderId", context.orderId);
      if (context.orderId) params.set("detail", "1");
      router.push(`${window.location.pathname}?${params.toString()}`);
    },
    [router],
  );

  const handleGoToProcessTab = useCallback(
    (order: WeeklyOrderRecord) => {
      setOrderDetailOpen(false);
      setActiveView("place-order");
      const params = new URLSearchParams();
      params.set("view", "place-order");
      params.set("tab", "process");
      if (order.weekLabel) params.set("week", getCanonicalWeekLabelForOrder(order));
      if (order.clientName) params.set("school", order.clientName);
      if (order.clientRole) params.set("category", order.clientRole);
      if (order.id) params.set("orderId", order.id);
      router.push(`${window.location.pathname}?${params.toString()}`);
    },
    [router],
  );

  const handleGoToDashboard = useCallback(() => {
    setActiveView("overview");
    setOrderDetailOpen(false);
    setSelectedId(null);
    router.push(`${window.location.pathname}?view=overview`);
  }, [router]);
  const [orders, setOrders] = useState<WeeklyOrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleCloseOrderDetail = useCallback(() => {
    setOrderDetailOpen(false);
    const params = new URLSearchParams(window.location.search);
    params.delete("orderId");
    params.delete("detail");
    const query = params.toString();
    router.replace(
      query
        ? `${window.location.pathname}?${query}`
        : `${window.location.pathname}?view=orders`,
      { scroll: false },
    );
  }, [router]);

  // Table filters for Order Summary view
  const [ordersSearch, setOrdersSearch] = useState("");
  const [ordersCategory, setOrdersCategory] = useState("all");
  const [ordersStatus, setOrdersStatus] = useState("all");
  const [ordersWeek, setOrdersWeek] = useState("all");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drPrintOrder, setDrPrintOrder] = useState<WeeklyOrderRecord | null>(null);

  useEffect(() => {
    if (activeView !== "orders") return;
    const weekParam = searchParams?.get("week");
    const orderIdParam = searchParams?.get("orderId");
    const statusParam = searchParams?.get("status");
    const categoryParam = searchParams?.get("category");
    setOrdersWeek(normalizeWeekFilterValue(weekParam));
    setOrdersStatus(statusParam ?? "all");
    setOrdersCategory(categoryParam ?? "all");
    if (orderIdParam) {
      setSelectedId(orderIdParam);
      setOrderDetailOpen(searchParams?.get("detail") === "1");
    } else {
      setSelectedId(null);
      setOrderDetailOpen(false);
    }
  }, [activeView, searchParams]);

  const [readOrderIds, setReadOrderIds] = useState<string[]>([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [toasts, setToasts] = useState<
    (NotificationToast & { id: string })[]
  >([]);

  // Load read notifications from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("occdo-read-order-ids");
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
    localStorage.setItem("occdo-read-order-ids", JSON.stringify(ids));
  };

  const showToast = useCallback((toast: NotificationToast) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const loadOrders = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setOrdersLoading(true);
    }
    try {
      const data = await getOrders();
      setOrders(data);
      // Prune readOrderIds — remove IDs of orders that no longer exist
      setReadOrderIds((prev) => {
        if (prev.length === 0) return prev;
        const existingIds = new Set(data.map((o) => o.id));
        const pruned = prev.filter((id) => existingIds.has(id));
        if (pruned.length !== prev.length) {
          localStorage.setItem("occdo-read-order-ids", JSON.stringify(pruned));
          return pruned;
        }
        return prev;
      });
    } finally {
      if (!options?.silent) {
        setOrdersLoading(false);
      }
    }
  }, []);

  const handlePrintDeliveryReceipt = useCallback(async (order: WeeklyOrderRecord) => {
    if (user?.role === "client") {
      try {
        const { resolveClientBySchoolName } = await import("../order/clientStorage");
        const clientRec = await resolveClientBySchoolName(order.clientName);
        const { printDeliveryReceipt } = await import("./printOrder");
        await printDeliveryReceipt(
          order,
          undefined,
          clientRec || undefined,
          "school",
          clientRec?.contact_person || "",
          clientRec?.contact_number || ""
        );
      } catch (e) {
        console.error("Direct print error:", e);
      }
    } else {
      setDrPrintOrder(order);
    }
  }, [user?.role]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useRealtimeOrderNotifications({
    enabled: Boolean(user),
    isAdmin,
    user: user ?? null,
    onOrdersChanged: loadOrders,
    onNotification: showToast,
  });

  const visibleOrders = useMemo(() => {
    if (isAdmin) {
      if (!user?.categories || user.categories.length === 0) return orders;
      return orders.filter((o) =>
        isCategoryAllowed(o.clientRole, user.categories),
      );
    }
    return filterOrdersForSchool(orders, user?.school_name);
  }, [orders, isAdmin, user]);

  const filteredOrders = useMemo(() => {
    let result = visibleOrders;

    const q = ordersSearch.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.clientName.toLowerCase().includes(q) ||
          o.items.some((i) => i.name.toLowerCase().includes(q)),
      );
    }

    if (ordersCategory !== "all") {
      result = result.filter((o) => o.clientRole === ordersCategory);
    }

    if (ordersStatus === "in_progress") {
      result = result.filter(
        (o) => o.status === "processing" || o.status === "accepted",
      );
    } else if (ordersStatus !== "all") {
      result = result.filter((o) => o.status === ordersStatus);
    }

    result = filterOrdersForWeek(result, ordersWeek);

    return result;
  }, [visibleOrders, ordersSearch, ordersCategory, ordersStatus, ordersWeek]);

  const handleDashboardOrderNavigate = useCallback(
    (
      options: {
        status?: string;
        order?: WeeklyOrderRecord;
        week?: string;
        openDetail?: boolean;
      },
    ) => {
      const status = options.status ?? "all";
      const week = normalizeWeekFilterValue(
        options.week ??
          (options.order ? getCanonicalWeekLabelForOrder(options.order) : "all"),
      );

      let matchingOrders = visibleOrders;
      matchingOrders = filterOrdersForWeek(matchingOrders, week);
      if (status === "in_progress") {
        matchingOrders = matchingOrders.filter(
          (o) => o.status === "processing" || o.status === "accepted",
        );
      } else if (status !== "all") {
        matchingOrders = matchingOrders.filter((o) => o.status === status);
      }

      const targetOrder =
        options.order ??
        [...matchingOrders].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];

      const openDetail = options.openDetail ?? Boolean(options.order);

      setActiveView("orders");
      setOrdersStatus(status);
      setOrdersCategory("all");
      setOrdersWeek(normalizeWeekFilterValue(week));
      setSelectedId(targetOrder?.id ?? null);
      setOrderDetailOpen(openDetail && Boolean(targetOrder));

      const params = new URLSearchParams();
      params.set("view", "orders");
      if (status !== "all") params.set("status", status);
      if (week !== "all") params.set("week", week);
      if (targetOrder) {
        params.set("orderId", targetOrder.id);
        if (openDetail) {
          params.set("school", targetOrder.clientName);
          params.set("category", targetOrder.clientRole);
          params.set("detail", "1");
        }
      }
      router.push(`${window.location.pathname}?${params.toString()}`);
    },
    [router, visibleOrders],
  );

  const handleSelectOrder = useCallback(
    (id: string) => {
      const order = visibleOrders.find((o) => o.id === id);
      setSelectedId(id);
      setOrderDetailOpen(true);

      const params = new URLSearchParams(window.location.search);
      params.set("view", "orders");
      params.set("orderId", id);
      params.set("detail", "1");
      if (order?.weekLabel) params.set("week", getCanonicalWeekLabelForOrder(order));
      if (order?.clientName) params.set("school", order.clientName);
      if (order?.clientRole) params.set("category", order.clientRole);
      router.replace(`${window.location.pathname}?${params.toString()}`, {
        scroll: false,
      });
    },
    [router, visibleOrders],
  );

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

  // Enforce role-based access control constraints
  useEffect(() => {
    if (user && user.role !== "admin") {
      if (
        activeView === "overview" ||
        activeView.startsWith("other-order") ||
        activeView === "products" ||
        activeView === "delivery-fees"
      ) {
        handleViewChange("place-order");
      }
    }
  }, [user, activeView, handleViewChange]);

  const selectedOrder = visibleOrders.find((o) => o.id === selectedId) ?? null;

  // Compute orders that qualify for notifications list
  const notifOrders = useMemo(() => {
    return visibleOrders
      .filter((o) => {
        if (isAdmin) {
          const isPending = o.status === "pending";
          const isApproved =
            o.status === "accepted" ||
            o.status === "processing" ||
            o.status === "completed";
          const isRecent =
            Date.now() - new Date(o.createdAt).getTime() <
            7 * 24 * 60 * 60 * 1000;
          return isPending || (isApproved && isRecent);
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

  // Compute unread count based on localStorage (only count unread notifications in the list for badge alerts)
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
      handleViewChange(view);
    } else {
      handleViewChange("orders");
    }
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-slate-50 relative">
      <AdminSidebar
        activeView={activeView}
        onViewChange={handleViewChange}
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
              <button
                type="button"
                onClick={isAdmin ? handleGoToDashboard : undefined}
                className={`hidden h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-0.5 shadow-sm lg:flex ${
                  isAdmin ? "cursor-pointer hover:ring-2 hover:ring-blue-200" : ""
                }`}
                aria-label={isAdmin ? "Go to Dashboard" : undefined}
              >
                <OccdoLogo size={28} className="h-full w-full" />
              </button>
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
                            className={`flex gap-3 py-3 cursor-pointer transition hover:bg-slate-50/50 relative ${isUnread ? "bg-blue-50/10" : ""
                              }`}
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                              <Bell className="h-4.5 w-4.5" strokeWidth={2} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-bold text-slate-800 truncate">
                                  Order ID: {order.id} — {formatStatusLabel(order.status)}
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
                          handleViewChange("notifications");
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
          className={`min-h-0 flex-1 p-4 sm:p-6 ${activeView === "place-order" ||
            activeView.startsWith("other-order") ||
            activeView === "orders" ||
            activeView === "products" ||
            activeView === "notifications"
            ? "flex flex-col lg:overflow-hidden overflow-y-auto"
            : "overflow-y-auto"
            }`}
        >
          {activeView === "overview" && (
            <RestaurantDashboard
              orders={visibleOrders}
              onStatusCardClick={(status, week) =>
                handleDashboardOrderNavigate({ status, week, openDetail: false })
              }
              onRecentOrderClick={(order) =>
                handleDashboardOrderNavigate({ order, openDetail: true })
              }
            />
          )}

          {activeView === "notifications" && (
            <NotificationsView
              orders={visibleOrders}
              onOrdersUpdated={loadOrders}
              onViewChange={handleViewChange}
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
              onViewChange={handleViewChange}
              onPrintDeliveryReceipt={handlePrintDeliveryReceipt}
              onGoToOrderSummary={handleGoToOrdersFromPricing}
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
              onViewChange={handleViewChange}
              onPrintDeliveryReceipt={handlePrintDeliveryReceipt}
              onGoToOrderSummary={handleGoToOrdersFromPricing}
            />
          )}

          {activeView === "products" && (
            <ProductCatalogManager
              orders={visibleOrders}
              onBackToOrders={handleGoToOrdersFromPricing}
            />
          )}

          {activeView === "delivery-fees" && <DeliveryFeeManager />}

          {activeView === "orders" && (
            <div className="flex min-h-0 flex-1 flex-col gap-4 w-full">
              {/* Filters row */}
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shrink-0">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 flex-1">
                  {/* Search query */}
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={ordersSearch}
                      onChange={(e) => setOrdersSearch(e.target.value)}
                      placeholder="Search orders..."
                      className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  {/* Category filter */}
                  <select
                    value={ordersCategory}
                    onChange={(e) => setOrdersCategory(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="all">All Categories</option>
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                    <option value="fish">Fish</option>
                    <option value="egg">Egg</option>
                    <option value="meat">Meat</option>
                    <option value="groceries">Groceries</option>
                    <option value="rice">Rice</option>
                    <option value="other_order">Other Order</option>
                  </select>

                  {/* Status filter */}
                  <select
                    value={ordersStatus}
                    onChange={(e) => setOrdersStatus(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="accepted">Approved</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  {/* Week filter */}
                  <select
                    value={ordersWeek}
                    onChange={(e) => setOrdersWeek(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="all">All Weeks (June – August)</option>
                    {getJuneAugustWeeks().map((w) => (
                      <option key={w.weekLabel} value={w.weekLabel}>
                        {w.weekLabel}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex shrink-0">
                  <button
                    onClick={async () => {
                      const { printAllSchoolSummaries } = await import("./printOrder");
                      await printAllSchoolSummaries(
                        filteredOrders,
                        ordersWeek === "all" ? "All Weeks" : ordersWeek
                      );
                    }}
                    className="w-full md:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 active:bg-blue-800 shadow-sm border border-blue-500"
                    title="Print all consolidated school summaries"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <path d="M6 14h12v8H6z" />
                      <path d="M6 2h12v4H6z" />
                    </svg>
                    <span>Print All (Per School)</span>
                  </button>
                </div>
              </div>

              <OrdersTable
                orders={filteredOrders}
                selectedId={selectedId}
                onSelect={handleSelectOrder}
                onPrintDeliveryReceipt={handlePrintDeliveryReceipt}
                onGoToPricing={handleGoToPricing}
                onOrdersUpdated={loadOrders}
                loading={ordersLoading}
              />

              {/* Centered modal overlay for order detail */}
              {orderDetailOpen && selectedOrder && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) handleCloseOrderDetail();
                  }}
                >
                  <div className="relative flex w-full max-w-lg max-h-[90dvh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                    <OrderDetailPanel
                      order={selectedOrder}
                      onClose={handleCloseOrderDetail}
                      onStatusChange={loadOrders}
                      onPrintDeliveryReceipt={handlePrintDeliveryReceipt}
                      onGoToProcess={handleGoToProcessTab}
                    />
                  </div>
                </div>
              )}
              {drPrintOrder && (
                <PrintReceiptModal
                  order={drPrintOrder}
                  onClose={() => {
                    setDrPrintOrder(null);
                    loadOrders();
                  }}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Real-time notification toasts */}
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
