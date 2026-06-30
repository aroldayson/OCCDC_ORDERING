import { Users, ClipboardList, Package } from "lucide-react";
import type { WeeklyOrderRecord } from "../../order/types";

type BusinessDataProps = {
  orders: WeeklyOrderRecord[];
};

export default function BusinessData({ orders }: BusinessDataProps) {
  // Count unique schools
  const uniqueSchools = new Set(orders.map((o) => o.clientName)).size;

  // Calculate total item quantities
  const totalQty = orders.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum, item) => itemSum + item.qty, 0);
  }, 0);

  const items = [
    {
      label: "Number of Schools",
      value: uniqueSchools.toString(),
      icon: Users,
      bg: "bg-violet-50",
      iconColor: "text-violet-500",
    },
    {
      label: "Total Orders Placed",
      value: orders.length.toString(),
      icon: ClipboardList,
      bg: "bg-orange-50",
      iconColor: "text-orange-500",
    },
    {
      label: "Total Quantities Ordered",
      value: totalQty.toLocaleString(),
      icon: Package,
      bg: "bg-emerald-50",
      iconColor: "text-emerald-500",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-bold text-slate-800">Business Data</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`relative flex items-center justify-between rounded-xl ${item.bg} px-4 py-3.5`}
          >
            <div className="flex items-center gap-3">
              <item.icon className={`h-5 w-5 ${item.iconColor}`} />
              <div>
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="text-lg font-bold text-slate-800">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
