import { ArrowUpRight, ClipboardList, ChefHat, Lamp } from "lucide-react";

const summaryCards = [
  {
    label: "Pending Orders",
    value: "25",
    sub: "47% Cleared",
    subColor: "text-emerald-500",
    icon: ClipboardList,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
  },
  {
    label: "Orders in Progress",
    value: "17",
    sub: null,
    icon: ChefHat,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
  },
  {
    label: "Available Tables",
    value: "3",
    suffix: "/12",
    sub: "87% Booked",
    subColor: "text-emerald-500",
    icon: Lamp,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
  },
];

export default function SummaryCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {summaryCards.map((card) => (
        <div
          key={card.label}
          className="relative rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <button className="absolute right-4 top-4 text-slate-300 hover:text-slate-500">
            <ArrowUpRight className="h-4 w-4" />
          </button>
          <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}>
            <card.icon className={`h-5 w-5 ${card.iconColor}`} />
          </div>
          <p className="text-sm text-slate-500">{card.label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-800">
            {card.value}
            {card.suffix && <span className="text-xl text-slate-400">{card.suffix}</span>}
          </p>
          {card.sub && (
            <p className={`mt-1 text-sm font-medium ${card.subColor}`}>{card.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
