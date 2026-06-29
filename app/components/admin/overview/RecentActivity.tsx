import { Clock } from "lucide-react";

const activities = [
  { name: "Kung Pao Chicken", price: "¥ 109.00", order: "#4587", time: "9min", status: "Completed" },
  { name: "Mapo Tofu", price: "¥ 89.00", order: "#4586", time: "12min", status: "Pending" },
  { name: "Sweet & Sour Pork", price: "¥ 119.00", order: "#4585", time: "5min", status: "Completed" },
  { name: "Fried Rice", price: "¥ 69.00", order: "#4584", time: "15min", status: "Pending" },
];

export default function RecentActivity() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-bold text-slate-800">Recent Activity</h2>
      <ul className="space-y-4">
        {activities.map((item) => (
          <li key={item.order} className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-50 text-lg">
              🍽️
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800">Status Changed</p>
              <p className="text-xs text-slate-500">
                {item.price} · {item.order} ·{" "}
                <span className="inline-flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  Wait {item.time}
                </span>
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                item.status === "Completed"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              {item.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
