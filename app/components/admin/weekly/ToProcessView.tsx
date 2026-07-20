"use client";

import { useEffect, useMemo, useState } from "react";
import type { OrderStatus, WeeklyOrderRecord } from "../../order/types";
import ClientsSidebar from "./ClientsSidebar";
import OrderDetailsPanel from "./OrderDetailsPanel";
import ClientSummaryModal from "./ClientSummaryModal";
import OrderViewModal from "./OrderViewModal";
import { buildClientGroups } from "./utils";
import { getClients } from "../../order/clientStorage";
import type { ClientRecord } from "../../order/clientStorage";

type StatusFilter = "all" | OrderStatus;

type ToProcessViewProps = {
  orders: WeeklyOrderRecord[];
  onUpdated: () => void;
  onAddOrder: (clientName?: string) => void;
  onAddClient: () => void;
  statusFilter: StatusFilter;
  categoryFilter: string;
  weekLabel?: string;
  isAdmin?: boolean;
  isWednesday?: boolean;
  isPastWeek?: boolean;
};

export default function ToProcessView({
  orders,
  onUpdated,
  onAddOrder,
  onAddClient,
  statusFilter,
  categoryFilter,
  weekLabel,
  isAdmin = false,
  isWednesday = false,
  isPastWeek = false,
}: ToProcessViewProps) {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<WeeklyOrderRecord | null>(null);
  const [mobileShowSidebar, setMobileShowSidebar] = useState(true);
  const [registeredClients, setRegisteredClients] = useState<ClientRecord[]>(
    [],
  );

  useEffect(() => {
    getClients().then(setRegisteredClients);
    const refresh = () => getClients().then(setRegisteredClients);
    window.addEventListener("occdo-clients-updated", refresh);
    return () => window.removeEventListener("occdo-clients-updated", refresh);
  }, []);

  const filteredOrders = useMemo(() => {
    let base = orders.filter(
      (o) =>
        o.status === "pending" ||
        o.status === "accepted" ||
        o.status === "processing",
    );
    if (statusFilter !== "all") {
      base = base.filter((o) => o.status === statusFilter);
    }
    if (categoryFilter !== "all") {
      base = base.filter((o) => o.clientRole === categoryFilter);
    }
    return base;
  }, [orders, statusFilter, categoryFilter]);

  const clients = useMemo(() => {
    const groups = buildClientGroups(filteredOrders, registeredClients);
    return groups.filter((c) => c.orderCount > 0);
  }, [filteredOrders, registeredClients]);

  const clientOrders = useMemo(() => {
    if (!selectedClient) return [];
    return filteredOrders.filter((o) => o.clientName === selectedClient);
  }, [filteredOrders, selectedClient]);

  const selectedCategories = useMemo(() => {
    const seen = new Set<string>();
    return clientOrders
      .map((o) => o.clientRole)
      .filter((role) => {
        if (seen.has(role)) return false;
        seen.add(role);
        return true;
      });
  }, [clientOrders]);

  useEffect(() => {
    if (clients.length === 0) {
      setSelectedClient(null);
      return;
    }

    if (!selectedClient || !clients.some((c) => c.name === selectedClient)) {
      setSelectedClient(clients[0].name);
    }
  }, [clients, selectedClient]);

  return (
    <>
      <div className="flex h-auto lg:h-full lg:min-h-0 flex-col gap-4 lg:overflow-hidden lg:flex-row w-full">
        {isAdmin && (
          <div
            className={`${mobileShowSidebar ? "flex" : "hidden"} lg:flex h-auto lg:h-full lg:min-h-0 w-full lg:w-56 lg:shrink-0 xl:w-64 flex-col`}
          >
            <ClientsSidebar
              clients={clients}
              selectedClient={selectedClient}
              onSelect={(name) => {
                setSelectedClient(name);
                setMobileShowSidebar(false);
              }}
              onAddClient={onAddClient}
              isAdmin={isAdmin}
            />
          </div>
        )}
        <div
          className={`${!isAdmin || !mobileShowSidebar ? "flex" : "hidden"} lg:flex h-auto lg:h-full lg:min-h-0 flex-1 flex-col lg:overflow-hidden`}
        >
          <OrderDetailsPanel
            clientName={selectedClient}
            categories={selectedCategories}
            orders={clientOrders}
            categoryFilter={categoryFilter}
            onUpdated={onUpdated}
            onAddOrder={() => onAddOrder(selectedClient ?? undefined)}
            onViewSummary={() => setSummaryOpen(true)}
            onViewOrder={setViewOrder}
            onBack={() => setMobileShowSidebar(true)}
            weekLabel={weekLabel}
            isWednesday={isWednesday}
            isPastWeek={isPastWeek}
          />
        </div>
      </div>

      {(isWednesday || isPastWeek) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 mb-4">
          {isWednesday
            ? "Wednesday processing pause: action buttons are disabled until the next business day."
            : "Past week view only: order edits and deletions are disabled for previous weeks."}
        </div>
      )}
      <ClientSummaryModal
        open={summaryOpen}
        clientName={selectedClient}
        categories={selectedCategories}
        orders={clientOrders}
        onClose={() => setSummaryOpen(false)}
        weekLabel={weekLabel ?? ""}
      />

      <OrderViewModal
        order={viewOrder}
        onClose={() => setViewOrder(null)}
        onUpdated={onUpdated}
      />
    </>
  );
}
