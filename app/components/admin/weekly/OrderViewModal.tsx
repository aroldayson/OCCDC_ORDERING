"use client";

import { X } from "lucide-react";
import { updateOrderStatus } from "../../order/orderStorage";
import type { OrderStatus, WeeklyOrderRecord } from "../../order/types";
import { formatOrderDate, getCategoryDisplayFromItem } from "./utils";

const statusOptions: OrderStatus[] = ["pending", "accepted", "processing", "completed"];

type OrderViewModalProps = {
  order: WeeklyOrderRecord | null;
  onClose: () => void;
  onUpdated: () => void;
};

export default function OrderViewModal({ order, onClose, onUpdated }: OrderViewModalProps) {
  if (!order) return null;

  async function handleStatus(status: OrderStatus) {
    await updateOrderStatus(order!.id, status);
    onUpdated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs text-slate-400">{order.id}</p>
            <h3 className="text-lg font-bold text-slate-800">{order.clientName}</h3>
            <p className="text-xs text-slate-500">{formatOrderDate(order.createdAt)}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="shrink-0 border-b border-slate-100 px-5 py-3">
          <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Update Status</p>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((s) => (
              <button
                key={s}
                disabled
                onClick={() => handleStatus(s)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize transition-opacity ${order.status === s
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                <th className="pb-2">Product</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Qty</th>
                <th className="pb-2">Unit</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.productId} className="border-b border-slate-50">
                  <td className="py-2 font-medium text-slate-800">{item.name}</td>
                  <td className="py-2 text-slate-600">{getCategoryDisplayFromItem(item)}</td>
                  <td className="py-2">{item.qty}</td>
                  <td className="py-2 text-slate-600">{item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
