"use client";

import { User, X, Printer, FileDown, Sheet } from "lucide-react";
import { useMemo, useState } from "react";
import { orderRoleColors, orderRoleLabels } from "../../order/roles";
import type { OrderRole } from "../../order/roles";
import type { WeeklyOrderRecord } from "../../order/types";
import { getCategoryDisplayFromItem } from "./utils";
import {
  printClientSummary,
  downloadClientSummaryPdf,
  downloadClientSummaryExcel,
  printOrderForm,
  downloadSingleOrderExcel,
} from "../printOrder";
import { mergeOrdersByCategory } from "../../order/orderStorage";

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
  categories: rawCategories,
  orders: rawOrders,
  onClose,
  weekLabel,
}: ClientSummaryModalProps) {
  const [loading, setLoading] = useState(false);
  const orders = useMemo(() => rawOrders.filter(o => o.status !== "cancelled"), [rawOrders]);
  const categories = useMemo(() => {
    return Array.from(new Set(orders.map((o) => o.clientRole)));
  }, [orders]);

  const aggregated = useMemo(() => {
    const list: {
      name: string;
      qty: number;
      unit: string;
      category: string;
      price: number;
      orderId?: string;
    }[] = [];
    for (const order of orders) {
      for (const item of order.items) {
        list.push({
          name: item.name,
          qty: item.qty,
          unit: item.unit,
          category: getCategoryDisplayFromItem(item),
          price: item.price || 0,
          orderId: order.id,
        });
      }
    }
    return list.sort((a, b) => {
      const orderCompare = (a.orderId || "").localeCompare(b.orderId || "");
      if (orderCompare !== 0) return orderCompare;
      return a.name.localeCompare(b.name);
    });
  }, [orders]);

  if (!open || !clientName) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
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
                <p className="text-xs text-slate-500">
                  {loading ? "Processing print files..." : "Order Summary"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  const { resolveClientBySchoolName } = await import("../../order/clientStorage");
                  const clientRecord = await resolveClientBySchoolName(clientName);
                  await printClientSummary(
                    clientName,
                    weekLabel,
                    aggregated,
                    orders,
                    clientRecord || undefined,
                  );
                } catch (e) {
                  console.error("Print summary error:", e);
                } finally {
                  setLoading(false);
                }
              }}
              className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
              aria-label="Print summary"
              title="Print"
            >
              <Printer className="h-5 w-5" />
            </button>
            <button
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  const { resolveClientBySchoolName } = await import("../../order/clientStorage");
                  const clientRecord = await resolveClientBySchoolName(clientName);
                  await downloadClientSummaryPdf(
                    clientName,
                    weekLabel,
                    aggregated,
                    orders,
                    clientRecord || undefined,
                  );
                } catch (e) {
                  console.error("Download PDF summary error:", e);
                } finally {
                  setLoading(false);
                }
              }}
              className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
              aria-label="Download PDF"
              title="Download PDF"
            >
              <FileDown className="h-5 w-5" />
            </button>
            <button
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  const { resolveClientBySchoolName } = await import("../../order/clientStorage");
                  const clientRecord = await resolveClientBySchoolName(clientName);
                  await downloadClientSummaryExcel(
                    clientName,
                    weekLabel,
                    aggregated,
                    orders,
                    clientRecord || undefined,
                  );
                } catch (e) {
                  console.error("Download Excel summary error:", e);
                } finally {
                  setLoading(false);
                }
              }}
              className="rounded-lg p-1.5 text-green-600 hover:bg-green-50 disabled:opacity-50"
              aria-label="Download Excel"
              title="Download Excel"
            >
              <Sheet className="h-5 w-5" />
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
            Total items across {orders.length} order
            {orders.length !== 1 ? "s" : ""}
          </p>
          <ul className="space-y-2">
            {aggregated.map((item) => (
              <li
                key={`${item.name}-${item.unit}-${item.orderId || ""}`}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.category} • {item.orderId}</p>
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
