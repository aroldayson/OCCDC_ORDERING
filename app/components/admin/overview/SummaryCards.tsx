import { ClipboardList, ChefHat, CheckCircle2 } from "lucide-react";
import type { WeeklyOrderRecord } from "../../order/types";

type SummaryCardsProps = {
  orders: WeeklyOrderRecord[];
};

export default function SummaryCards({ orders }: SummaryCardsProps) {
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const inProgressCount = orders.filter((o) => o.status === "processing" || o.status === "accepted").length;
  const completedCount = orders.filter((o) => o.status === "completed").length;

  const totalCount = orders.length;
  const clearPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const cards = [
    {
      label: "Pending Orders",
      value: pendingCount.toString(),
      sub: `${clearPercent}% of total completed`,
      subColor: "text-amber-600",
      icon: ClipboardList,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
    },
    {
      label: "Orders in Progress",
      value: inProgressCount.toString(),
      sub: "Active and processing",
      subColor: "text-blue-600",
      icon: ChefHat,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
    },
    {
      label: "Completed Orders",
      value: completedCount.toString(),
      sub: `${completedCount} out of ${totalCount} orders`,
      subColor: "text-emerald-600",
      icon: CheckCircle2,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="relative rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}>
            <card.icon className={`h-5 w-5 ${card.iconColor}`} />
          </div>
          <p className="text-sm text-slate-500">{card.label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-800">
            {card.value}
          </p>
          {card.sub && (
            <p className={`mt-1 text-xs font-medium ${card.subColor}`}>{card.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
