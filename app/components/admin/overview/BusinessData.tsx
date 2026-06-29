import { ArrowUpRight, ClipboardList, Users, CircleDollarSign } from "lucide-react";

const items = [
  {
    label: "Number of Customers",
    value: "197",
    icon: Users,
    bg: "bg-violet-50",
    iconColor: "text-violet-500",
  },
  {
    label: "Total Orders",
    value: "270",
    icon: ClipboardList,
    bg: "bg-orange-50",
    iconColor: "text-orange-500",
  },
  {
    label: "Average Order Values",
    value: "¥ 109.00",
    icon: CircleDollarSign,
    bg: "bg-emerald-50",
    iconColor: "text-emerald-500",
  },
];

export default function BusinessData() {
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
            <button className="text-slate-300 hover:text-slate-500">
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
