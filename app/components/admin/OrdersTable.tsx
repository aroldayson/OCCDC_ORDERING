import { Eye, Printer } from "lucide-react";
import type { WeeklyOrderRecord, OrderStatus } from "../order/types";
import { printOrderForm } from "./printOrder";

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  accepted: "bg-blue-50 text-blue-700",
  processing: "bg-violet-50 text-violet-700",
  completed: "bg-emerald-50 text-emerald-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type OrdersTableProps = {
  orders: WeeklyOrderRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  compact?: boolean;
};

export default function OrdersTable({
  orders,
  selectedId,
  onSelect,
  compact,
}: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate-500">
          No orders yet. Clients can place orders from the home page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Mobile cards */}
      <div
        className={`min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 ${compact ? "" : "lg:hidden"}`}
      >
        {orders.map((order) => (
          <div
            key={order.id}
            onClick={() => onSelect(order.id)}
            className={`w-full rounded-2xl border p-4 cursor-pointer transition-all ${selectedId === order.id
              ? "border-blue-300 bg-blue-50 shadow-sm"
              : "border-slate-100 bg-white hover:border-slate-200"
              }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800">
                  {order.clientName}
                </p>
                <p className="text-xs text-slate-400">{order.id}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    printOrderForm(order);
                  }}
                  className="rounded p-1.5 text-slate-400 hover:bg-blue-100 hover:text-blue-600 transition"
                  title="Print order"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[order.status]}`}
                >
                  {order.status}
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>
                {order.itemCount} items · {order.weekLabel}
              </span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div
        className={`hidden min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm ${compact ? "lg:hidden" : "lg:flex"
          }`}
      >
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400 shadow-[0_1px_0_0_rgb(241_245_249)]">
                <th className="px-3 py-3 sm:px-5">Order ID</th>
                <th className="px-3 py-3 sm:px-5">Client</th>
                <th className="hidden px-3 py-3 sm:px-5 md:table-cell">Week</th>
                <th className="hidden px-3 py-3 sm:px-5 lg:table-cell">
                  Items
                </th>
                <th className="px-3 py-3 sm:px-5">Status</th>
                <th className="hidden px-3 py-3 sm:px-5 sm:table-cell">Date</th>
                <th className="px-3 py-3 sm:px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => onSelect(order.id)}
                  className={`cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50 ${selectedId === order.id ? "bg-blue-50" : ""
                    }`}
                >
                  <td className="px-3 py-3.5 font-medium text-slate-600 sm:px-5 whitespace-nowrap">
                    {order.id}
                  </td>
                  <td className="px-3 py-3.5 font-medium text-slate-800 sm:px-5">
                    <div className="min-w-0">
                      <p className="truncate">{order.clientName}</p>
                      <p className="text-xs text-slate-500 sm:hidden">
                        {order.weekLabel}
                      </p>
                    </div>
                  </td>
                  <td className="hidden px-3 py-3.5 text-slate-500 sm:px-5 md:table-cell">
                    <p className="truncate">{order.weekLabel}</p>
                  </td>
                  <td className="hidden px-3 py-3.5 text-slate-600 sm:px-5 lg:table-cell">
                    {order.itemCount}
                  </td>
                  <td className="px-3 py-3.5 sm:px-5">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium capitalize sm:px-2.5 sm:py-1 ${statusStyles[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="hidden px-3 py-3.5 text-xs text-slate-400 sm:px-5 sm:table-cell">
                    <p className="truncate">{formatDate(order.createdAt)}</p>
                  </td>
                  <td className="px-3 py-3.5 sm:px-5 text-right">
                    <div className="flex justify-end gap-1 sm:gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(order.id);
                        }}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                        title="View order"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          printOrderForm(order);
                        }}
                        className="rounded p-1 text-slate-400 hover:bg-blue-100 hover:text-blue-600 transition"
                        title="Print order"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
