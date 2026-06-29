"use client";

import { useEffect, useMemo, useState } from "react";
import type { OrderStatus, WeeklyOrderRecord } from "../../order/types";
import ClientsSidebar from "./ClientsSidebar";
import OrderDetailsPanel from "./OrderDetailsPanel";
import ClientSummaryModal from "./ClientSummaryModal";
import OrderViewModal from "./OrderViewModal";
import { buildClientGroups } from "./utils";

type StatusFilter = "all" | OrderStatus;

type ToProcessViewProps = {
  orders: WeeklyOrderRecord[];
  onUpdated: () => void;
  onAddOrder: (clientName?: string) => void;
  onAddClient: () => void;
  statusFilter: StatusFilter;
};

export default function ToProcessView({
  orders,
  onUpdated,
  onAddOrder,
  onAddClient,
  statusFilter,
}: ToProcessViewProps) {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<WeeklyOrderRecord | null>(null);

  const filteredOrders = useMemo(() => {
    const base = orders.filter((o) => o.status === "pending" || o.status === "processing");
    if (statusFilter === "all") return base;
    return base.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const clients = useMemo(() => {
    const groups = buildClientGroups(filteredOrders);
    return groups.filter((c) => c.orderCount > 0);
  }, [filteredOrders]);

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
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden lg:flex-row">
        <ClientsSidebar
          clients={clients}
          selectedClient={selectedClient}
          onSelect={setSelectedClient}
          onAddClient={onAddClient}
        />
        <div className="min-h-0 flex-1 overflow-hidden">
          <OrderDetailsPanel
            clientName={selectedClient}
            categories={selectedCategories}
            orders={clientOrders}
            onUpdated={onUpdated}
            onAddOrder={() => onAddOrder(selectedClient ?? undefined)}
            onViewSummary={() => setSummaryOpen(true)}
            onViewOrder={setViewOrder}
          />
        </div>
      </div>

      <ClientSummaryModal
        open={summaryOpen}
        clientName={selectedClient}
        categories={selectedCategories}
        orders={clientOrders}
        onClose={() => setSummaryOpen(false)}
      />

      <OrderViewModal
        order={viewOrder}
        onClose={() => setViewOrder(null)}
        onUpdated={onUpdated}
      />
    </>
  );
}
