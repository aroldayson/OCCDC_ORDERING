"use client";

import { User, X, Printer } from "lucide-react";
import { useMemo } from "react";
import { orderRoleColors, orderRoleLabels } from "../../order/roles";
import type { OrderRole } from "../../order/roles";
import type { WeeklyOrderRecord } from "../../order/types";
import { getCategoryDisplayFromItem } from "./utils";
import { printClientSummary } from "../printOrder";

type ClientSummaryModalProps = {
  open: boolean;
  clientName: string | null;
  categories: OrderRole[];
  orders: WeeklyOrderRecord[];
  onClose: () => void;
  weekLabel: string;
};

export default function ClientSummaryModal({
  open,
  clientName,
  categories,
  orders,
  onClose,
  weekLabel,
}: ClientSummaryModalProps) {
  const aggregated = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; unit: string; category: string }>();
    for (const order of orders) {
      for (const item of order.items) {
        const key = `${item.productId}-${item.unit}`;
        const existing = map.get(key);
        if (existing) {
          existing.qty += item.qty;
        } else {
          map.set(key, {
            name: item.name,
            qty: item.qty,
            unit: item.unit,
            category: getCategoryDisplayFromItem(item),
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [orders]);

  if (!open || !clientName) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-[85vh] max-h-[640px] w-full max-w-lg flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{clientName}</h3>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                {categories.map((cat) => (
                  <span
                    key={cat}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${orderRoleColors[cat]}`}
                  >
                    {orderRoleLabels[cat]}
                  </span>
                ))}
                <p className="text-xs text-slate-500">Order Summary</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => printClientSummary(clientName, weekLabel, aggregated, orders.length)}
              className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
              aria-label="Print summary"
            >
              <Printer className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Total items across {orders.length} order{orders.length !== 1 ? "s" : ""}
          </p>
          <ul className="space-y-2">
            {aggregated.map((item) => (
              <li
                key={`${item.name}-${item.unit}`}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.category}</p>
                </div>
                <span className="font-bold text-blue-700">
                  {item.qty} {item.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
