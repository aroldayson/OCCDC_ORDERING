"use client";

import { useMemo } from "react";
import type { WeeklyOrderRecord } from "../../order/types";
import { orderRoleLabels } from "../../order/roles";
import { formatOrderDate } from "./utils";

type ClientOrdersViewProps = {
  orders: WeeklyOrderRecord[];
  schoolName: string;
};

const statusStyles: Record<
  WeeklyOrderRecord["status"],
  { label: string; className: string }
> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  accepted: { label: "Accepted", className: "bg-sky-100 text-sky-700" },
  processing: { label: "Processing", className: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-700" },
};

export default function ClientOrdersView({
  orders,
  schoolName,
}: ClientOrdersViewProps) {
  const sorted = useMemo(
    () =>
      [...orders].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [orders],
  );

  if (sorted.length === 0) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
        <div>
          <p className="text-sm font-semibold text-slate-700">No orders yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Wala pang order si <strong>{schoolName}</strong> para sa napiling
            week.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">My Orders</h3>
        <p className="text-xs text-slate-500">{schoolName}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ul className="divide-y divide-slate-100">
          {sorted.map((order) => {
            const status = statusStyles[order.status];
            return (
              <li key={order.id} className="px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {order.id}
                    </p>
                    <p className="text-xs text-slate-500">
                      {orderRoleLabels[order.clientRole]} ·{" "}
                      {order.itemCount} items · {formatOrderDate(order.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
