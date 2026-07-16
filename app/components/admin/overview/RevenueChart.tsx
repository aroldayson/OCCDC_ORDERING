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
    <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm">
      <div className="mb-4 sm:mb-5 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800">Weekly Activity (Orders per Day)</h2>
      </div>

      <div className="grid grid-cols-7 h-32 sm:h-48 items-end gap-1.5 sm:gap-3">
        {weekDays.map((day, i) => {
          const value = counts[i];
          const height = (value / max) * 100;
          const isToday = i === todayIndex;

          return (
            <div key={day} className="group flex flex-col items-center h-full justify-end relative">
              {/* Tooltip space */}
              <div className="h-6 sm:h-8 w-full shrink-0 relative flex items-center justify-center">
                <div className={`absolute bottom-0.5 sm:bottom-1 left-1/2 -translate-x-1/2 z-10 transition-opacity duration-200 pointer-events-none ${
                  isToday ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}>
                  <div className="rounded bg-slate-900 px-1.5 sm:px-2.5 py-0.5 text-[8px] sm:text-[9px] font-semibold text-white shadow-md whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span className={`h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full ${isToday ? "bg-blue-500" : "bg-slate-400"}`} />
                      <span>{value} order{value !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bar Container */}
              <div className="w-full flex-1 flex items-end min-h-[30px] sm:min-h-[40px] px-0.5 sm:px-1 mt-1 sm:mt-2">
                <div
                  className={`w-full rounded-t-md sm:rounded-t-lg transition-all duration-300 ${
                    isToday
                      ? "bg-blue-600"
                      : "bg-slate-200 hover:bg-slate-300"
                  }`}
                  style={{ height: `${height}%`, minHeight: "6px" }}
                />
              </div>

              {/* Day Label */}
              <span className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 shrink-0 ${isToday ? "font-bold text-blue-600" : "text-slate-400"}`}>
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
