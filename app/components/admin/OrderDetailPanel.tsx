import { X, Printer, Eye, Edit, Trash2 } from "lucide-react";
import { updateOrderStatus } from "../order/orderStorage";
import { printOrderForm } from "./printOrder";
import { useAuth } from "@/app/providers/AuthProvider";
import type { WeeklyOrderRecord, OrderStatus } from "../order/types";

const statusOptions: OrderStatus[] = ["pending", "accepted", "processing", "completed"];

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-violet-50 text-violet-700 border-violet-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type OrderDetailPanelProps = {
  order: WeeklyOrderRecord | null;
  onClose: () => void;
  onStatusChange: () => void;
};

export default function OrderDetailPanel({
  order,
  onClose,
  onStatusChange,
}: OrderDetailPanelProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  if (!order) return null;

  async function handleStatusChange(status: OrderStatus) {
    if (!isAdmin) return;
    await updateOrderStatus(order!.id, status);
    onStatusChange();
  }

  const grouped = order.items.reduce<Record<string, typeof order.items>>(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {},
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-3 sm:p-5">
        <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:mb-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-400 whitespace-nowrap">
              {order.id}
            </p>
            <h3 className="mt-0.5 text-base font-bold text-slate-800 sm:text-lg truncate">
              {order.clientName}
            </h3>
            <p className="mt-1 text-xs text-slate-500 truncate">
              Order Date: {formatDate(order.createdAt)} · Items:{" "}
              {order.itemCount}
            </p>
          </div>
          <div className="flex gap-1 shrink-0 sm:gap-2">
            <button
              onClick={() => { }}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 transition sm:p-1.5"
              title="View order"
            >
              <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              onClick={() => { }}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 transition sm:p-1.5"
              title="Edit order"
            >
              <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              onClick={() => { }}
              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition sm:p-1.5"
              title="Delete order"
            >
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 sm:p-1.5"
              aria-label="Close detail"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span
              className={`inline-block rounded-full border px-2.5 py-1 text-xs font-semibold capitalize sm:px-3 ${statusStyles[order.status]}`}
            >
              {order.status}
            </span>
          </div>
          <div className="flex gap-1 items-center text-xs font-medium text-slate-500 sm:gap-2">
            <span className="hidden sm:inline">Actions</span>
            <button
              onClick={() => printOrderForm(order)}
              className="rounded p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition sm:p-1.5"
              title="Print order"
            >
              <Printer className="h-4 w-4 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-100 p-3 sm:p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {isAdmin ? "Change Status" : "Order Status"}
        </p>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((s) => (
            <button
              key={s}
              disabled={!isAdmin}
              onClick={() => handleStatusChange(s)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize transition-all ${order.status === s
                  ? statusStyles[s]
                  : isAdmin
                    ? "border-slate-200 text-slate-500 hover:border-slate-300"
                    : "border-slate-100 text-slate-300 opacity-40"
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/30 p-3 flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Grand Total:</span>
          <span className="text-base font-extrabold text-emerald-700">
            ₱{(order.totalPrice || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {order.itemCount} Products — {order.weekLabel}
        </p>
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="mb-4">
            <p className="mb-2 text-xs font-bold capitalize text-slate-500">
              {category}
            </p>
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="flex items-start justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500 font-semibold">
                      ₱{(item.price || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })} / {item.unit}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-blue-700 block">
                      {item.qty} {item.unit}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      ₱{((item.qty || 0) * (item.price || 0)).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
