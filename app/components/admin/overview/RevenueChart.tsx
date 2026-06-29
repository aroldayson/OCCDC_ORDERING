import { ArrowUpRight, Calendar, ChevronDown } from "lucide-react";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const revenueData = [320, 410, 380, 598, 245, 490, 360];

export default function RevenueChart() {
  const max = Math.max(...revenueData);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800">Total Revenue</h2>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
            <Calendar className="h-3.5 w-3.5" />
            This Week
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button className="text-slate-300 hover:text-slate-500">
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex h-48 items-end justify-between gap-2 sm:gap-3">
        {weekDays.map((day, i) => {
          const value = revenueData[i];
          const height = (value / max) * 100;
          const isHighlight = day === "Thu";
          return (
            <div key={day} className="flex flex-1 flex-col items-center gap-2">
              {isHighlight && (
                <div className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] font-medium text-white sm:text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                    ${value.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    ${revenueData[i - 1]?.toFixed(2) ?? "—"}
                  </div>
                </div>
              )}
              <div
                className={`w-full rounded-t-lg ${
                  isHighlight
                    ? "bg-orange-500"
                    : "bg-[repeating-linear-gradient(135deg,#e2e8f0_0px,#e2e8f0_4px,#f1f5f9_4px,#f1f5f9_8px)]"
                }`}
                style={{ height: `${height}%`, minHeight: "8px" }}
              />
              <span className="text-xs text-slate-400">{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
