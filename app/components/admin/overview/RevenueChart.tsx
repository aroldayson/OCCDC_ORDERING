import type { WeeklyOrderRecord } from "../../order/types";

type RevenueChartProps = {
  orders: WeeklyOrderRecord[];
};

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function RevenueChart({ orders }: RevenueChartProps) {
  // Aggregate orders by day of week
  const counts = [0, 0, 0, 0, 0, 0, 0];

  for (const order of orders) {
    const d = new Date(order.createdAt);
    if (!isNaN(d.getTime())) {
      const dayIndex = d.getDay(); // 0 is Sunday, 6 is Saturday
      counts[dayIndex]++;
    }
  }

  const max = Math.max(...counts, 1); // Avoid division by zero
  const todayIndex = new Date().getDay();

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800">Weekly Activity (Orders per Day)</h2>
      </div>

      <div className="flex h-48 items-end justify-between gap-2 sm:gap-3">
        {weekDays.map((day, i) => {
          const value = counts[i];
          const height = (value / max) * 100;
          const isToday = i === todayIndex;

          return (
            <div key={day} className="group flex flex-1 flex-col items-center h-full justify-end">
              {/* Tooltip space */}
              <div className={`h-8 flex items-center justify-center shrink-0 transition-opacity duration-200 ${
                isToday ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}>
                <div className="rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-medium text-white shadow-md">
                  <div className="flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${isToday ? "bg-blue-500" : "bg-slate-400"}`} />
                    <span>{value} order{value !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              </div>

              {/* Bar Container */}
              <div className="w-full flex-1 flex items-end min-h-[40px] px-0.5 sm:px-1 mt-2">
                <div
                  className={`w-full rounded-t-lg transition-all duration-300 ${
                    isToday
                      ? "bg-blue-600"
                      : "bg-slate-200 hover:bg-slate-300"
                  }`}
                  style={{ height: `${height}%`, minHeight: "8px" }}
                />
              </div>

              {/* Day Label */}
              <span className={`text-xs mt-2 shrink-0 ${isToday ? "font-bold text-blue-600" : "text-slate-400"}`}>
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
