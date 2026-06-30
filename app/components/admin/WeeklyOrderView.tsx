"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Package, PlusCircle } from "lucide-react";
import type { WeeklyProduct } from "../order/products";
import { addWeeklyProduct, updateWeeklyProduct } from "../order/weeklyProductStorage";
import type { OrderStatus, WeeklyOrderRecord } from "../order/types";
import { filterOrdersForSchool, filterOrdersForWeek } from "../order/orderAccess";
import { getWeekInfo, type WeekOffset } from "../order/weekUtils";
import { useAuth } from "@/app/providers/AuthProvider";
import WeeklyOrder from "../order/WeeklyOrder";
import WeeklyItemsManager from "./WeeklyItemsManager";
import ModuleHeader from "./weekly/ModuleHeader";
import ItemFormModal, { type ItemFormData } from "./weekly/ItemFormModal";
import ToProcessView from "./weekly/ToProcessView";
import WeekSelector from "./weekly/WeekSelector";
import { addClient } from "../order/clientStorage";
import AddClientModal from "./weekly/AddClientModal";

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
};

export default function WeeklyOrderView({ orders, onOrdersUpdated }: WeeklyOrderViewProps) {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin";
  const schoolName = user?.school_name?.trim() ?? "";

  const tabs = adminTabs;

  const [tab, setTab] = useState<Tab>("order");
  const [weekOffset, setWeekOffset] = useState<WeekOffset>(0);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WeeklyProduct | null>(null);
  const [placeOrderClient, setPlaceOrderClient] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [addClientOpen, setAddClientOpen] = useState(false);

  const selectedWeek = useMemo(() => getWeekInfo(weekOffset), [weekOffset]);

  const scopedOrders = useMemo(() => {
    const byWeek = filterOrdersForWeek(orders, selectedWeek.weekLabel);
    if (isAdmin) return byWeek;
    return filterOrdersForSchool(byWeek, schoolName);
  }, [orders, selectedWeek.weekLabel, isAdmin, schoolName]);

  const pendingCount = scopedOrders.filter(
    (o) => o.status === "pending" || o.status === "accepted" || o.status === "processing",
  ).length;

  function handleAddOrder(clientName?: string) {
    if (clientName) setPlaceOrderClient(clientName);
    setTab("order");
  }

  function handleAddClient() {
    setAddClientOpen(true);
  }

  async function handleSaveClient(name: string) {
    await addClient(name);
    setPlaceOrderClient(name);
    setTab("order");
  }

  function handleFilterToggle() {
    cycleFilter();
  }

  function cycleFilter() {
    const order: StatusFilter[] = ["all", "pending", "accepted", "processing"];
    const idx = order.indexOf(statusFilter);
    setStatusFilter(order[(idx + 1) % order.length]);
  }





  function handleSaveItem(data: ItemFormData) {
    const qty = parseFloat(data.defaultQty);
    if (!data.name.trim() || isNaN(qty) || qty <= 0) return;

    const payload = {
      name: data.name.trim(),
      defaultQty: qty,
      unit: data.unit.trim(),
      category: data.category,
      note: data.note.trim() || undefined,
    };

    if (editingItem) {
      updateWeeklyProduct(editingItem.id, payload, selectedWeek.weekLabel);
    } else {
      addWeeklyProduct(payload, selectedWeek.weekLabel);
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
    <div className="flex h-full min-h-0 w-full flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:flex-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${
                tab === id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {id === "process" && pendingCount > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    tab === id ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <WeekSelector selectedOffset={weekOffset} onChange={setWeekOffset} />
      </div>

      {(isAdmin || tab !== "order") && (
        <ModuleHeader
          weekLabel={selectedWeek.weekLabel}
          pendingCount={pendingCount}
          onFilter={handleFilterToggle}
          filterActive={statusFilter !== "all"}
        />
      )}

      {!isAdmin && tab === "order" && schoolName && (
        <div className="shrink-0 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Ordering for <strong>{schoolName}</strong> ·{" "}
          {weekOffset === 0 ? "This Week" : "Next Week"} ({selectedWeek.dateRange})
        </div>
      )}

      {!isAdmin && !authLoading && !schoolName && (
        <div className="shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Walang naka-link na school sa account mo. Pakicontact ang admin para
          ma-set ang school name.
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === "order" && (
          <WeeklyOrder
            embedded
            defaultClientName={placeOrderClient || undefined}
            fixedClientName={fixedClientName}
            weekLabel={selectedWeek.weekLabel}
            onOrderSubmitted={() => {
              onOrdersUpdated();
              setPlaceOrderClient("");
              setTab("process");
            }}
          />
        )}
        {tab === "process" && (
          <ToProcessView
            orders={scopedOrders}
            onUpdated={onOrdersUpdated}
            onAddOrder={handleAddOrder}
            onAddClient={handleAddClient}
            statusFilter={statusFilter}
            weekLabel={selectedWeek.weekLabel}
            isAdmin={isAdmin}
          />
        )}
        {tab === "items" && (
          <WeeklyItemsManager
            orders={scopedOrders}
          />
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
    </div>
  );
}
