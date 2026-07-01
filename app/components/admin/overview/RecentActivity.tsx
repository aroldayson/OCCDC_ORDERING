import { Clock } from "lucide-react";
import type { OrderStatus, WeeklyOrderRecord } from "../../order/types";
import { orderRoleLabels } from "../../order/roles";

type RecentActivityProps = {
  orders: WeeklyOrderRecord[];

};

export default function RecentActivity({ orders }: RecentActivityProps) {
  const sortedOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const statusStyles: Record<OrderStatus, string> = {
    pending: "bg-amber-50 text-amber-600",
    accepted: "bg-blue-50 text-blue-600",
    processing: "bg-violet-50 text-violet-600",
    completed: "bg-emerald-50 text-emerald-600",
    cancelled: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col h-[400px]">
      <h2 className="mb-4 text-base font-bold text-slate-800 shrink-0">Recent Orders</h2>
      {sortedOrders.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500 flex-1 flex items-center justify-center">No orders placed yet.</div>
      ) : (
        <ul className="space-y-4 overflow-y-auto flex-1 pr-2">
          {sortedOrders.map((order) => {
            const formattedDate = new Date(order.createdAt).toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <li key={order.id} className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg">
                  🏫
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {order.clientName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {orderRoleLabels[order.clientRole] || "Other"} · {order.id} ·{" "}
                    <span className="inline-flex items-center gap-0.5">
                      <Clock className="h-3 w-3" />
                      {formattedDate}
                    </span>
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[order.status] ?? "bg-slate-50 text-slate-600"
                    }`}
                >
                  {order.status}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
