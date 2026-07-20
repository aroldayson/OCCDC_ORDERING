"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ClipboardList,
  Package,
  PlusCircle,
  X,
  Eye,
  Printer,
  Clock,
  CheckCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Truck,
} from "lucide-react";
import type { WeeklyProduct } from "../order/products";
import {
  getWeeklyProducts,
  addWeeklyProduct,
  updateWeeklyProduct,
} from "../order/weeklyProductStorage";
import type { OrderStatus, WeeklyOrderRecord } from "../order/types";
import {
  filterOrdersForSchool,
  filterOrdersForWeek,
} from "../order/orderAccess";
import {
  getJuneAugustWeeks,
  getCurrentOrNextPeriodWeek,
  getCurrentPeriodWeek,
} from "../order/weekUtils";
import { useAuth } from "@/app/providers/AuthProvider";
import WeeklyOrder from "../order/WeeklyOrder";
import WeeklyItemsManager from "./WeeklyItemsManager";
import ModuleHeader from "./weekly/ModuleHeader";
import ItemFormModal, { type ItemFormData } from "./weekly/ItemFormModal";
import ToProcessView from "./weekly/ToProcessView";
import WeekSelector from "./weekly/WeekSelector";
import WeekSummaryTable from "./weekly/WeekSummaryTable";
import WeeklyProductInputTable from "./weekly/WeeklyProductInputTable";
import { addClient, getClients, type ClientRecord } from "../order/clientStorage";
import AddClientModal from "./weekly/AddClientModal";
import type { AdminView } from "./AdminSidebar";
import { orderRoleLabels, type OrderRole } from "../order/roles";
import {
  updateOrderStatus,
  getOrdersByCategoryAndWeek,
} from "../order/orderStorage";
import {
  printOrderForm,
  printAllOrders,
  printClientSummary,
  printItemizedTally,
  downloadAllOrdersExcel,
  downloadItemizedTallyExcel,
} from "./printOrder";

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-violet-50 text-violet-700 border-violet-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

type Tab = "order" | "process" | "items";
type StatusFilter = "all" | OrderStatus;

const adminTabs: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: "order", label: "Place Order", icon: Package },
  { id: "process", label: "To Process", icon: ClipboardList },
  { id: "items", label: "Weekly Items", icon: PlusCircle },
];

type WeeklyOrderViewProps = {
  orders: WeeklyOrderRecord[];
  onOrdersUpdated: () => void;
  forceTab?: Tab;
  onViewChange?: (view: AdminView) => void;
  fixedCategory?: OrderRole;
  onPrintDeliveryReceipt: (order: WeeklyOrderRecord) => void;
  onGoToOrderSummary?: (context: {
    week: string;
    school?: string;
    category?: string;
    orderId?: string;
  }) => void;
};

interface SchoolGroupBlockProps {
  clientName: string;
  clientOrders: WeeklyOrderRecord[];
  handleStatusChange: (id: string, status: OrderStatus) => Promise<void>;
  setSelectedOrderDetail: (order: WeeklyOrderRecord | null) => void;
  weeklyProducts: WeeklyProduct[];
  onPrintDeliveryReceipt: (order: WeeklyOrderRecord) => void;
}

function SchoolGroupBlock({
  clientName,
  clientOrders,
  handleStatusChange,
  setSelectedOrderDetail,
  weeklyProducts,
  onPrintDeliveryReceipt,
}: SchoolGroupBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition hover:shadow-md mb-6">
      <div
        className="bg-slate-50 border-b border-slate-200 px-5 py-4 cursor-pointer hover:bg-slate-100 flex justify-between items-center transition"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <h3 className="text-lg font-bold text-slate-800">{clientName}</h3>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(new Set(clientOrders.map((o: any) => o.status))).map(
                (status: any) => (
                  <span
                    key={status}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${statusStyles[status as OrderStatus] || "bg-slate-50 text-slate-700 border-slate-200"}`}
                  >
                    {status === "pending" ? "Pending Approval" : status}
                  </span>
                ),
              )}
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1 sm:mt-0.5">
            {clientOrders.length} Order{clientOrders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={async (e) => {
              e.stopPropagation();
              const activeOrders = clientOrders.filter((o) => o.status !== "cancelled");
              if (activeOrders.length === 0) {
                alert("No active orders to print (all orders are cancelled).");
                return;
              }
              const aggregatedItems: {
                name: string;
                qty: number;
                unit: string;
                category: string;
                price: number;
                orderId?: string;
              }[] = [];

              activeOrders.forEach((o) =>
                o.items.forEach((i) => {
                  aggregatedItems.push({
                    name: i.name,
                    qty: i.qty,
                    unit: i.unit,
                    category: i.category || "",
                    price: i.price || 0,
                    orderId: o.id,
                  });
                })
              );

              aggregatedItems.sort((a, b) => {
                const orderCompare = (a.orderId || "").localeCompare(b.orderId || "");
                if (orderCompare !== 0) return orderCompare;
                return a.name.localeCompare(b.name);
              });

              const { resolveClientBySchoolName } =
                await import("../order/clientStorage");
              const clientRecord = await resolveClientBySchoolName(clientName);
              await printClientSummary(
                clientName,
                activeOrders[0]?.weekLabel || "",
                aggregatedItems,
                activeOrders,
                clientRecord || undefined,
              );
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print School Orders</span>
          </button>
          <div className="shrink-0 p-2 rounded-full bg-white shadow-sm border border-slate-200 text-slate-500">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="flex flex-col bg-white">
          {clientOrders.map((order, idx: number) => {
            const isAdditional = idx > 0;
            return (
              <div
                key={order.id}
                className={`p-5 ${idx > 0 ? "border-t border-slate-200 border-dashed" : ""}`}
              >
                {isAdditional && (
                  <div className="text-[10px] font-bold text-amber-600 bg-amber-50 inline-block px-2 py-1 rounded-md mb-3 border border-amber-200 uppercase tracking-wider">
                    Additional Order #{idx}
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${order.status === "completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : order.status === "pending"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-blue-50 text-blue-700"
                          }`}
                      >
                        {order.status === "pending"
                          ? "Pending Approval"
                          : order.status}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        ID:{" "}
                        <span className="font-semibold text-slate-600">
                          {order.id}
                        </span>
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      Submitted:{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-lg font-extrabold text-slate-800">
                      {order.items.length} Items
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      Other Order Type
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50/30 rounded-xl border border-slate-100 p-4 space-y-4">
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1.5 px-3 border-b border-slate-50">
                      Order Items
                    </div>
                    {order.items.map((item: any) => {
                      const isDeleted = item.deleted === true;
                      const isUnpriced =
                        !isDeleted && (!item.price || item.price === 0);
                      return (
                        <div
                          key={item.productId}
                          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm py-2 px-3 border-b border-slate-100/60 last:border-0 last:pb-0 gap-1 sm:gap-0 ${isDeleted ? "bg-red-50/30" : ""}`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium ${isDeleted ? "text-red-600 line-through decoration-red-500 decoration-2" : isUnpriced ? "text-blue-600 underline decoration-blue-500 decoration-2" : "text-slate-700"}`}
                            >
                              {item.name}
                            </span>
                            {isDeleted && (
                              <span className="text-[9px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded border border-red-600 uppercase tracking-wider">
                                Deleted
                              </span>
                            )}
                            {isUnpriced && (
                              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                                No Price
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between sm:justify-end sm:gap-4 text-slate-600">
                            <span
                              className={`text-xs font-medium ${isDeleted ? "text-red-400" : isUnpriced ? "text-blue-400" : "text-slate-400"}`}
                            >
                              {item.qty} {item.unit} × ₱
                              {(item.price || 0).toLocaleString("en-PH", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                            <span
                              className={`font-bold min-w-[70px] text-right ${isDeleted ? "text-red-400 line-through" : isUnpriced ? "text-blue-500" : "text-slate-700"}`}
                            >
                              ₱
                              {(
                                (item.qty || 0) * (item.price || 0)
                              ).toLocaleString("en-PH", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-3 flex justify-between items-center text-xs">
                    <span className="font-bold text-emerald-800 uppercase tracking-wider">
                      Order Total
                    </span>
                    <span className="font-extrabold text-emerald-800 text-sm">
                      ₱
                      {(order.totalPrice || 0).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Change Status
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "pending",
                        "accepted",
                        "processing",
                        "completed",
                        "cancelled",
                      ].map((status) => (
                        <button
                          key={status}
                          onClick={() =>
                            handleStatusChange(order.id, status as OrderStatus)
                          }
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-all ${order.status === status
                            ? statusStyles[status as OrderStatus]
                            : "border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                            }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={async () => {
                        const { resolveClientBySchoolName } =
                          await import("../order/clientStorage");
                        const clientRecord =
                          await resolveClientBySchoolName(clientName);
                        printOrderForm(order, undefined, clientRecord);
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition"
                    >
                      <Printer className="h-4 w-4 text-slate-500" />
                      Print Order
                    </button>
                    <button
                      onClick={() => onPrintDeliveryReceipt(order)}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition"
                    >
                      <Truck className="h-4 w-4 text-violet-500" />
                      Delivery Receipt
                    </button>
                    <button
                      onClick={() => setSelectedOrderDetail(order)}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition"
                    >
                      <Eye className="h-4 w-4 text-slate-500" />
                      View JSON Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {clientOrders.length > 1 && (
            <div className="bg-slate-800 text-white px-5 py-4 flex justify-between items-center rounded-b-xl">
              <span className="font-bold">
                Grand Total ({clientOrders.length} Orders)
              </span>
              <span className="text-lg font-black">
                ₱
                {clientOrders
                  .reduce(
                    (sum: number, o: WeeklyOrderRecord) =>
                      sum + (o.totalPrice || 0),
                    0,
                  )
                  .toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WeeklyOrderView({
  orders,
  onOrdersUpdated,
  forceTab,
  onViewChange,
  fixedCategory,
  onPrintDeliveryReceipt,
  onGoToOrderSummary,
}: WeeklyOrderViewProps) {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams?.get("tab");
  const weekFromUrl = searchParams?.get("week");
  const schoolFromUrl = searchParams?.get("school");
  const categoryFromUrl = searchParams?.get("category");
  const orderIdFromUrl = searchParams?.get("orderId");
  const isAdmin = user?.role === "admin";
  const showAllButtons = useMemo(() => {
    return !user?.categories || user.categories.length > 1;
  }, [user?.categories]);
  const isWednesday = new Date().getDay() === 3;
  const schoolName = user?.school_name?.trim() ?? "";

  const tabs = adminTabs;

  const [internalTab, setTab] = useState<Tab>("order");
  const tab = forceTab ?? internalTab;
  // selectedWeekLabel is the stable key used for filtering.
  // Always resolve to a fixed June–August week label so it matches the WeekSelector options.
  const [selectedWeekLabel, setSelectedWeekLabel] = useState<string>(() => {
    const allWeeks = getJuneAugustWeeks();
    const periodWeek = getCurrentOrNextPeriodWeek();
    if (periodWeek !== null) {
      // Current or next upcoming week — select it directly
      return allWeeks[periodWeek - 1].weekLabel;
    }
    // Outside the period: pick the last week as the closest available option
    return allWeeks[allWeeks.length - 1].weekLabel;
  });
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WeeklyProduct | null>(null);
  const [placeOrderClient, setPlaceOrderClient] = useState("");
  const [statusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(!isAdmin);
  const [weeklyProducts, setWeeklyProducts] = useState<WeeklyProduct[]>([]);
  const [printLoading, setPrintLoading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [showOverview, setShowOverview] = useState(false);

  const [allClients, setAllClients] = useState<ClientRecord[]>([]);

  useEffect(() => {
    getClients().then(setAllClients);
  }, []);

  useEffect(() => {
    getWeeklyProducts(selectedWeekLabel).then(setWeeklyProducts);
  }, [selectedWeekLabel]);

  useEffect(() => {
    if (tabFromUrl === "process" && !forceTab) {
      setTab("process");
    }
    if (weekFromUrl) {
      setSelectedWeekLabel(weekFromUrl);
    }
    if (categoryFromUrl) {
      setCategoryFilter(categoryFromUrl);
    }
  }, [tabFromUrl, weekFromUrl, categoryFromUrl, forceTab]);

  const scopedOrders = useMemo(() => {
    const byWeek = filterOrdersForWeek(orders, selectedWeekLabel);
    if (isAdmin) return byWeek;
    return filterOrdersForSchool(byWeek, schoolName);
  }, [orders, selectedWeekLabel, isAdmin, schoolName]);

  const isPastWeek = useMemo(() => {
    const allWeeks = getJuneAugustWeeks();
    const selectedWeek = allWeeks.find(
      (w) => w.weekLabel === selectedWeekLabel,
    );
    const currentPeriodWeek = getCurrentPeriodWeek();
    const currentOrNextWeek = getCurrentOrNextPeriodWeek();

    if (!selectedWeek) return false;
    if (currentPeriodWeek === null && currentOrNextWeek === null) {
      return true;
    }
    if (currentPeriodWeek === null) {
      // Before the period starts — no past weeks yet.
      return false;
    }
    return selectedWeek.periodWeek < currentPeriodWeek;
  }, [selectedWeekLabel]);

  const [selectedOrderDetail, setSelectedOrderDetail] =
    useState<WeeklyOrderRecord | null>(null);

  const pendingCount = useMemo(() => {
    const list = fixedCategory
      ? scopedOrders.filter((o) => o.clientRole === fixedCategory)
      : scopedOrders;
    return list.filter(
      (o) =>
        o.status === "pending" ||
        o.status === "accepted" ||
        o.status === "processing",
    ).length;
  }, [scopedOrders, fixedCategory]);

  const categoryOrders = useMemo(() => {
    if (!fixedCategory) return [];
    return scopedOrders.filter((o) => o.clientRole === fixedCategory);
  }, [scopedOrders, fixedCategory]);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryStatusFilter, setCategoryStatusFilter] =
    useState<string>("pending");

  const categoryPendingCount = useMemo(() => {
    return categoryOrders.filter((o) => o.status === "pending").length;
  }, [categoryOrders]);

  const categoryApprovedCount = useMemo(() => {
    return categoryOrders.filter(
      (o) => o.status === "accepted" || o.status === "processing",
    ).length;
  }, [categoryOrders]);

  const categoryCompletedCount = useMemo(() => {
    return categoryOrders.filter((o) => o.status === "completed").length;
  }, [categoryOrders]);

  const filteredCategoryOrders = useMemo(() => {
    let list = categoryOrders;

    // Status filter
    if (categoryStatusFilter !== "all") {
      if (categoryStatusFilter === "pending") {
        list = list.filter((o) => o.status === "pending");
      } else if (categoryStatusFilter === "approved") {
        list = list.filter(
          (o) => o.status === "accepted" || o.status === "processing",
        );
      } else if (categoryStatusFilter === "completed") {
        list = list.filter((o) => o.status === "completed");
      } else if (categoryStatusFilter === "cancelled") {
        list = list.filter((o) => o.status === "cancelled");
      }
    }

    // Search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.clientName.toLowerCase().includes(q) ||
          o.items.some((i) => i.name.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [categoryOrders, categoryStatusFilter, searchQuery]);

  const groupedCategoryOrders = useMemo(() => {
    const groups = new Map<string, WeeklyOrderRecord[]>();
    filteredCategoryOrders.forEach((o) => {
      if (!groups.has(o.clientName)) {
        groups.set(o.clientName, []);
      }
      groups.get(o.clientName)!.push(o);
    });

    Array.from(groups.values()).forEach((group) => {
      group.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    });

    return Array.from(groups.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
  }, [filteredCategoryOrders]);

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    await updateOrderStatus(id, status);
    onOrdersUpdated();
  };

  function handleAddOrder(clientName?: string) {
    if (clientName) setPlaceOrderClient(clientName);
    setShowOrderForm(true);
    setTab("order");
  }

  function handleAddClient() {
    setAddClientOpen(true);
  }

  async function handleSaveClient(name: string) {
    await addClient(name);
    setPlaceOrderClient(name);
    setShowOrderForm(true);
    setTab("order");
  }

  function handleSaveItem(data: ItemFormData) {
    const qty = parseFloat(data.defaultQty);
    const priceVal = parseFloat(data.price);
    if (
      !data.name.trim() ||
      isNaN(qty) ||
      qty <= 0 ||
      isNaN(priceVal) ||
      priceVal < 0
    )
      return;

    const payload = {
      name: data.name.trim(),
      defaultQty: qty,
      unit: data.unit.trim(),
      category: data.category,
      price: priceVal,
    };

    if (editingItem) {
      updateWeeklyProduct(editingItem.id, payload, selectedWeekLabel);
    } else {
      addWeeklyProduct(payload, selectedWeekLabel);
    }
    setItemModalOpen(false);
    setEditingItem(null);
  }

  const fixedClientName = !isAdmin && schoolName ? schoolName : undefined;

  if (authLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-auto lg:h-full lg:min-h-0 w-full flex-col gap-4 lg:overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {!forceTab && (
          <div className="flex w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:flex-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${tab === id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {id === "process" && pendingCount > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab === id
                      ? "bg-white/20 text-white"
                      : "bg-blue-100 text-blue-700"
                      }`}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <WeekSelector
          selectedWeekLabel={selectedWeekLabel}
          onChange={setSelectedWeekLabel}
        />
      </div>

      {tab !== "order" && (
        <ModuleHeader
          weekLabel={selectedWeekLabel}
          pendingCount={pendingCount}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          showOverview={showOverview}
          onToggleOverview={
            isAdmin ? () => setShowOverview((v) => !v) : undefined
          }
        />
      )}

      {/* Per-week overview table — shown when toggled in the header */}
      {tab !== "order" && showOverview && isAdmin && (
        <WeekSummaryTable
          allOrders={orders}
          selectedWeekLabel={selectedWeekLabel}
          onSelectWeek={(label) => {
            setSelectedWeekLabel(label);
            setShowOverview(false);
          }}
        />
      )}

      {!isAdmin && tab === "order" && schoolName && (
        <div className="shrink-0 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Ordering for <strong>{schoolName}</strong> · {selectedWeekLabel}
        </div>
      )}

      {isAdmin && tab === "order" && (
        <div className="shrink-0 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="text-sm font-semibold text-blue-900">
            Select School Client to place order for:
          </div>
          <select
            value={placeOrderClient}
            onChange={(e) => {
              setPlaceOrderClient(e.target.value);
              setShowOrderForm(!!e.target.value);
            }}
            className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">-- Choose a school client --</option>
            {allClients.map((client) => (
              <option key={client.id} value={client.name}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {!isAdmin && !authLoading && !schoolName && (
        <div className="shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Walang naka-link na school sa account mo. Pakicontact ang admin para
          ma-set ang school name.
        </div>
      )}

      <div
        className={`min-h-0 flex-1 ${fixedCategory ? "overflow-y-auto pr-1" : tab === "order" ? "overflow-y-auto" : "lg:overflow-hidden overflow-y-auto"}`}
      >
        {tab === "order" && (
          <div className="flex flex-col gap-8">
            {isAdmin && fixedCategory !== "other_order" && (
              <div className="flex flex-wrap justify-end gap-3">
                {showAllButtons && (
                  <>
                    <button
                      disabled={printLoading}
                      onClick={async () => {
                        const categoriesToPrint = user?.categories && user.categories.length > 0
                          ? user.categories
                          : ["egg", "meat", "rice", "fish", "fruits", "groceries", "vegetables"];

                        setPrintLoading(true);
                        try {
                          const allOrdersPromises = categoriesToPrint.map((cat) =>
                            getOrdersByCategoryAndWeek(cat as OrderRole, selectedWeekLabel)
                          );
                          const ordersResults = await Promise.all(allOrdersPromises);
                          const combinedOrders = ordersResults.flat().filter((o) => o.status !== "cancelled");

                          if (combinedOrders.length > 0) {
                            const title = categoriesToPrint.length === 1
                              ? (orderRoleLabels[categoriesToPrint[0] as keyof typeof orderRoleLabels] || categoriesToPrint[0])
                              : "All Categories";
                            await printAllOrders(
                              title,
                              selectedWeekLabel,
                              combinedOrders,
                            );
                          } else {
                            alert("No active orders found to print.");
                          }
                        } catch (err) {
                          console.error("Error printing all categories:", err);
                        } finally {
                          setPrintLoading(false);
                        }
                      }}
                      className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Printer className="h-4 w-4 text-blue-500" />
                      {printLoading ? "Loading…" : "Print All Categories"}
                    </button>
                    <button
                      disabled={printLoading}
                      onClick={async () => {
                        const categoriesToPrint = user?.categories && user.categories.length > 0
                          ? user.categories
                          : ["egg", "meat", "rice", "fish", "fruits", "groceries", "vegetables"];

                        setPrintLoading(true);
                        try {
                          const allClients = await getClients();
                          const allSchoolNames = allClients.map((c) => c.name);

                          const allOrdersPromises = categoriesToPrint.map((cat) =>
                            getOrdersByCategoryAndWeek(cat as OrderRole, selectedWeekLabel)
                          );
                          const ordersResults = await Promise.all(allOrdersPromises);
                          const combinedOrders = ordersResults.flat().filter((o) => o.status !== "cancelled");

                          if (combinedOrders.length > 0) {
                            const title = categoriesToPrint.length === 1
                              ? (orderRoleLabels[categoriesToPrint[0] as keyof typeof orderRoleLabels] || categoriesToPrint[0])
                              : "All Categories";
                            await printItemizedTally(
                              title,
                              selectedWeekLabel,
                              combinedOrders,
                              allSchoolNames,
                            );
                          } else {
                            alert("No active orders found to print.");
                          }
                        } catch (err) {
                          console.error("Error printing itemized tally:", err);
                        } finally {
                          setPrintLoading(false);
                        }
                      }}
                      className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-semibold text-indigo-700 shadow-sm hover:bg-indigo-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Printer className="h-4 w-4 text-indigo-500" />
                      {printLoading ? "Loading…" : "Print Itemized Tally (All)"}
                    </button>
                  </>
                )}
                <button
                  disabled={printLoading}
                  onClick={async () => {
                    if (!fixedCategory) return;
                    setPrintLoading(true);
                    try {
                      const freshOrders = await getOrdersByCategoryAndWeek(
                        fixedCategory,
                        selectedWeekLabel,
                      );
                      const activeOrders = freshOrders.filter((o) => o.status !== "cancelled");
                      if (activeOrders.length === 0) {
                        alert("No active orders to print (all orders are cancelled).");
                        return;
                      }
                      await printAllOrders(
                        orderRoleLabels[fixedCategory],
                        selectedWeekLabel,
                        activeOrders,
                      );
                    } finally {
                      setPrintLoading(false);
                    }
                  }}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer className="h-4 w-4 text-slate-500" />
                  {printLoading ? "Loading…" : `Print ${orderRoleLabels[fixedCategory!] || "Category"}`}
                </button>
                <button
                  disabled={printLoading}
                  onClick={async () => {
                    if (!fixedCategory) return;
                    setPrintLoading(true);
                    try {
                      const [freshOrders, { getClients }] = await Promise.all([
                        getOrdersByCategoryAndWeek(
                          fixedCategory,
                          selectedWeekLabel,
                        ),
                        import("../order/clientStorage"),
                      ]);
                      const activeOrders = freshOrders.filter((o) => o.status !== "cancelled");
                      if (activeOrders.length === 0) {
                        alert("No active orders to print (all orders are cancelled).");
                        return;
                      }
                      const allClients = await getClients();
                      const allSchoolNames = allClients.map((c) => c.name);
                      await printItemizedTally(
                        orderRoleLabels[fixedCategory],
                        selectedWeekLabel,
                        activeOrders,
                        allSchoolNames,
                      );
                    } finally {
                      setPrintLoading(false);
                    }
                  }}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer className="h-4 w-4 text-slate-500" />
                  {printLoading ? "Loading…" : `Tally ${orderRoleLabels[fixedCategory!] || "Category"}`}
                </button>

                {/* Export dropdown */}
                <div className="relative">
                  <button
                    disabled={printLoading}
                    onClick={() => setExportOpen((o) => !o)}
                    className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="h-4 w-4 text-emerald-500" />
                    Export
                  </button>
                  {exportOpen && (
                    <>
                      {/* invisible backdrop to close on outside click */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setExportOpen(false)}
                      />
                      <div className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                        <button
                          className="flex w-full items-center gap-2 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                          onClick={async () => {
                            if (!fixedCategory) return;
                            setExportOpen(false);
                            setPrintLoading(true);
                            try {
                              const freshOrders =
                                await getOrdersByCategoryAndWeek(
                                  fixedCategory,
                                  selectedWeekLabel,
                                );
                              await downloadAllOrdersExcel(
                                orderRoleLabels[fixedCategory],
                                selectedWeekLabel,
                                freshOrders,
                              );
                            } finally {
                              setPrintLoading(false);
                            }
                          }}
                        >
                          All Orders (.xlsx)
                        </button>
                        <button
                          className="flex w-full items-center gap-2 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition border-t border-slate-100"
                          onClick={async () => {
                            if (!fixedCategory) return;
                            setExportOpen(false);
                            setPrintLoading(true);
                            try {
                              const [freshOrders, { getClients }] =
                                await Promise.all([
                                  getOrdersByCategoryAndWeek(
                                    fixedCategory,
                                    selectedWeekLabel,
                                  ),
                                  import("../order/clientStorage"),
                                ]);
                              const allClients = await getClients();
                              await downloadItemizedTallyExcel(
                                orderRoleLabels[fixedCategory],
                                selectedWeekLabel,
                                freshOrders,
                                allClients.map((c) => c.name),
                              );
                            } finally {
                              setPrintLoading(false);
                            }
                          }}
                        >
                          Itemized Tally (.xlsx)
                        </button>
                        {showAllButtons && (
                          <>
                            <button
                              className="flex w-full items-center gap-2 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition border-t border-slate-100"
                              onClick={async () => {
                                const categoriesToPrint = user?.categories && user.categories.length > 0
                                  ? user.categories
                                  : ["egg", "meat", "rice", "fish", "fruits", "groceries", "vegetables"];
                                setExportOpen(false);
                                setPrintLoading(true);
                                try {
                                  const allOrdersPromises = categoriesToPrint.map((cat) =>
                                    getOrdersByCategoryAndWeek(cat as OrderRole, selectedWeekLabel)
                                  );
                                  const ordersResults = await Promise.all(allOrdersPromises);
                                  const combinedOrders = ordersResults.flat().filter((o) => o.status !== "cancelled");

                                  if (combinedOrders.length > 0) {
                                    const title = categoriesToPrint.length === 1
                                      ? (orderRoleLabels[categoriesToPrint[0] as keyof typeof orderRoleLabels] || categoriesToPrint[0])
                                      : "All Categories";
                                    await downloadAllOrdersExcel(
                                      title,
                                      selectedWeekLabel,
                                      combinedOrders,
                                    );
                                  } else {
                                    alert("No orders found to export.");
                                  }
                                } catch (err) {
                                  console.error("Error exporting all categories:", err);
                                } finally {
                                  setPrintLoading(false);
                                }
                              }}
                            >
                              All Categories (.xlsx)
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition border-t border-slate-100"
                              onClick={async () => {
                                const categoriesToPrint = user?.categories && user.categories.length > 0
                                  ? user.categories
                                  : ["egg", "meat", "rice", "fish", "fruits", "groceries", "vegetables"];
                                setExportOpen(false);
                                setPrintLoading(true);
                                try {
                                  const allClients = await getClients();
                                  const allOrdersPromises = categoriesToPrint.map((cat) =>
                                    getOrdersByCategoryAndWeek(cat as OrderRole, selectedWeekLabel)
                                  );
                                  const ordersResults = await Promise.all(allOrdersPromises);
                                  const combinedOrders = ordersResults.flat().filter((o) => o.status !== "cancelled");

                                  if (combinedOrders.length > 0) {
                                    const title = categoriesToPrint.length === 1
                                      ? (orderRoleLabels[categoriesToPrint[0] as keyof typeof orderRoleLabels] || categoriesToPrint[0])
                                      : "All Categories";
                                    await downloadItemizedTallyExcel(
                                      title,
                                      selectedWeekLabel,
                                      combinedOrders,
                                      allClients.map((c) => c.name),
                                    );
                                  } else {
                                    alert("No orders found to export.");
                                  }
                                } catch (err) {
                                  console.error("Error exporting itemized tally:", err);
                                } finally {
                                  setPrintLoading(false);
                                }
                              }}
                            >
                              Itemized Tally (All) (.xlsx)
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {fixedCategory !== "other_order" && showOrderForm && (
              <WeeklyOrder
                embedded
                defaultClientName={placeOrderClient || undefined}
                fixedClientName={fixedClientName}
                weekLabel={selectedWeekLabel}
                fixedCategory={fixedCategory}
                onOrderSubmitted={() => {
                  onOrdersUpdated();
                  setPlaceOrderClient("");
                  setShowOrderForm(false);
                  if (onViewChange && !isAdmin) {
                    onViewChange("orders");
                  } else {
                    setTab("process");
                  }
                }}
              />
            )}

            {fixedCategory && (
              <div className="space-y-6">
                {/* Stats cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Card 1: Pending */}
                  <div
                    onClick={() => setCategoryStatusFilter("pending")}
                    className={`rounded-2xl border p-5 shadow-sm cursor-pointer transition-all ${categoryStatusFilter === "pending"
                      ? "border-blue-500 bg-blue-50/20 ring-2 ring-blue-100"
                      : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                  >
                    <div className="flex items-center gap-2 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                      <Clock className="h-4 w-4 text-blue-500" />
                      Pending
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-800">
                      {categoryPendingCount}
                    </div>
                  </div>

                  {/* Card 2: Approved */}
                  <div
                    onClick={() => setCategoryStatusFilter("approved")}
                    className={`rounded-2xl border p-5 shadow-sm cursor-pointer transition-all ${categoryStatusFilter === "approved"
                      ? "border-blue-500 bg-blue-50/20 ring-2 ring-blue-100"
                      : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                  >
                    <div className="flex items-center gap-2 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Approved
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-800">
                      {categoryApprovedCount}
                    </div>
                  </div>

                  {/* Card 3: Completed */}
                  <div
                    onClick={() => setCategoryStatusFilter("completed")}
                    className={`rounded-2xl border p-5 shadow-sm cursor-pointer transition-all ${categoryStatusFilter === "completed"
                      ? "border-blue-500 bg-blue-50/20 ring-2 ring-blue-100"
                      : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                  >
                    <div className="flex items-center gap-2 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                      <CheckCircle className="h-4 w-4 text-slate-400" />
                      Completed
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-800">
                      {categoryCompletedCount}
                    </div>
                  </div>
                </div>

                {/* Filters & Search Row */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full max-w-md">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search member, school, or items..."
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    {[
                      "all",
                      "pending",
                      "approved",
                      "completed",
                      "cancelled",
                    ].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setCategoryStatusFilter(filter)}
                        className={`rounded-full px-3 py-1.5 capitalize transition ${categoryStatusFilter === filter
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Approval Block Card List */}
                <div className="space-y-4">
                  {groupedCategoryOrders.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                      No other orders found for the selected filter.
                    </div>
                  ) : (
                    groupedCategoryOrders.map(([clientName, clientOrders]) => (
                      <SchoolGroupBlock
                        key={clientName}
                        clientName={clientName}
                        clientOrders={clientOrders}
                        handleStatusChange={handleStatusChange}
                        setSelectedOrderDetail={setSelectedOrderDetail}
                        weeklyProducts={weeklyProducts}
                        onPrintDeliveryReceipt={onPrintDeliveryReceipt}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {tab === "process" && (
          <ToProcessView
            orders={scopedOrders}
            onUpdated={onOrdersUpdated}
            onAddOrder={handleAddOrder}
            onAddClient={handleAddClient}
            statusFilter={statusFilter}
            categoryFilter={categoryFilter}
            weekLabel={selectedWeekLabel}
            isAdmin={isAdmin}
            isWednesday={isWednesday}
            isPastWeek={isPastWeek}
            onGoToOrderSummary={onGoToOrderSummary}
            focusSchool={schoolFromUrl ?? undefined}
            focusOrderId={orderIdFromUrl ?? undefined}
          />
        )}
        {tab === "items" && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-sm max-w-lg mx-auto mt-16 space-y-6">
            <div className="rounded-full bg-blue-50 p-6 text-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-spin"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                Module Under Construction
              </h2>
              <p className="mt-3 text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                This section is currently under development to bring you a fully featured Weekly Items input manager.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-xs text-slate-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
              Coming Soon
            </div>
          </div>
        )}
      </div>

      <ItemFormModal
        open={itemModalOpen}
        editing={editingItem}
        onClose={() => {
          setItemModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
      />

      <AddClientModal
        open={addClientOpen}
        onClose={() => setAddClientOpen(false)}
        onSave={handleSaveClient}
      />

      {selectedOrderDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedOrderDetail(null)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Order Details ({selectedOrderDetail.id})
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedOrderDetail.clientName}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-2">
              {selectedOrderDetail.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm py-2 border-b border-slate-200/60 last:border-0 gap-1 sm:gap-0"
                >
                  <span className="font-medium text-slate-700">
                    {item.name}
                  </span>
                  <div className="flex items-center justify-between sm:justify-end sm:gap-4">
                    <span className="text-xs text-slate-400 font-medium">
                      {item.qty} {item.unit} × ₱
                      {(item.price || 0).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <span className="font-bold text-slate-700 min-w-[70px] text-right">
                      ₱
                      {((item.qty || 0) * (item.price || 0)).toLocaleString(
                        "en-PH",
                        { minimumFractionDigits: 2 },
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Price
              </p>
              <p className="mt-1 text-sm font-bold text-slate-800">
                ₱
                {(selectedOrderDetail.totalPrice || 0).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
