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
            <div key={day} className="flex flex-1 flex-col items-center gap-2">
              {isToday && (
                <div className="rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-medium text-white">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    {value} order{value !== 1 ? "s" : ""}
                  </div>
                </div>
              )}
              <div
                className={`w-full rounded-t-lg transition-all duration-300 ${
                  isToday
                    ? "bg-blue-600"
                    : "bg-slate-200 hover:bg-slate-300"
                }`}
                style={{ height: `${height}%`, minHeight: "8px" }}
              />
              <span className={`text-xs ${isToday ? "font-bold text-blue-600" : "text-slate-400"}`}>
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
