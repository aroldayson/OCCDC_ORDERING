import { ClipboardList, Clock, CheckCircle2, Package } from "lucide-react";
import type { WeeklyOrderRecord } from "../order/types";

type OrderStatsCardsProps = {
  orders: WeeklyOrderRecord[];
};

export default function OrderStatsCards({ orders }: OrderStatsCardsProps) {
  const pending = orders.filter((o) => o.status === "pending").length;
  const processing = orders.filter((o) => o.status === "processing").length;
  const completed = orders.filter((o) => o.status === "completed").length;
  const totalItems = orders.reduce((sum, o) => sum + o.itemCount, 0);

  const stats = [
    { label: "Total Orders", value: orders.length, icon: ClipboardList, color: "bg-blue-500" },
    { label: "Pending", value: pending, icon: Clock, color: "bg-amber-500" },
    { label: "Processing", value: processing, icon: Package, color: "bg-violet-500" },
    { label: "Completed", value: completed, icon: CheckCircle2, color: "bg-emerald-500" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
        >
          <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${stat.color} text-white`}>
            <stat.icon className="h-4 w-4" />
          </div>
          <p className="text-xs text-slate-500">{stat.label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{stat.value}</p>
        </div>
      ))}
      <div className="col-span-2 rounded-2xl border border-blue-100 bg-blue-50 p-4 lg:col-span-4">
        <p className="text-sm text-blue-600">
          <span className="font-bold">{totalItems}</span> total items ordered across all clients this week.
        </p>
      </div>
    </div>
  );
}
