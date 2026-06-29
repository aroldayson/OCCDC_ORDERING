import { ChevronDown, Calendar } from "lucide-react";

const topDishes = [
  { name: "Twice Cooked Pork", orders: 960, emoji: "🥩" },
  { name: "Kung Pao Chicken", orders: 842, emoji: "🍗" },
  { name: "Mapo Tofu", orders: 715, emoji: "🫕" },
  { name: "Dan Dan Noodles", orders: 623, emoji: "🍜" },
];

export default function TopDishes() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800">Top Dishes</h2>
        <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
          <Calendar className="h-3.5 w-3.5" />
          This Week
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
      <ul className="space-y-4">
        {topDishes.map((dish) => (
          <li key={dish.name} className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
              {dish.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{dish.name}</p>
              <p className="text-sm">
                <span className="font-bold text-slate-800">{dish.orders}</span>{" "}
                <span className="text-orange-500">Orders</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
