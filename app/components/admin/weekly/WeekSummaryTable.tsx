"use client";

import { CalendarDays } from "lucide-react";
import {
  getJuneAugustWeeks,
  getCurrentPeriodWeek,
} from "../../order/weekUtils";
import { filterOrdersForWeek } from "../../order/orderAccess";
import type { WeeklyOrderRecord } from "../../order/types";

type WeekSummaryTableProps = {
  /** All orders across all weeks (unfiltered by week). */
  allOrders: WeeklyOrderRecord[];
  /** Currently selected weekLabel — used to highlight the active row. */
  selectedWeekLabel: string;
  /** Called when the user clicks "View" on a week row. */
  onSelectWeek: (weekLabel: string) => void;
};

export default function WeekSummaryTable({
  allOrders,
  selectedWeekLabel,
  onSelectWeek,
}: WeekSummaryTableProps) {
  const weeks = getJuneAugustWeeks();
  const currentPeriodWeek = getCurrentPeriodWeek();

  const rows = weeks.map((w) => {
    const weekOrders = filterOrdersForWeek(allOrders, w.weekLabel);
    const total = weekOrders.length;
    const pending = weekOrders.filter(
      (o) =>
        o.status === "pending" ||
        o.status === "accepted" ||
        o.status === "processing",
    ).length;
    const completed = weekOrders.filter((o) => o.status === "completed").length;
    const cancelled = weekOrders.filter((o) => o.status === "cancelled").length;
    const isActive = w.weekLabel === selectedWeekLabel;
    const isCurrent = w.periodWeek === currentPeriodWeek;

    return { ...w, total, pending, completed, cancelled, isActive, isCurrent };
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <CalendarDays className="h-4 w-4 text-blue-500" />
        <h3 className="text-sm font-bold text-slate-800">
          Weekly Overview — June – August 2026
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Week
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Date Range
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-amber-600">
                Pending
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Completed
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-red-500">
                Cancelled
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr
                key={row.weekLabel}
                className={`transition-colors ${
                  row.isActive ? "bg-blue-50" : "hover:bg-slate-50"
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold ${row.isActive ? "text-blue-700" : "text-slate-800"}`}
                    >
                      Week {row.periodWeek}
                    </span>
                    {row.isCurrent && (
                      <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                        NOW
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{row.dateRange}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`font-bold ${row.total > 0 ? "text-slate-800" : "text-slate-300"}`}
                  >
                    {row.total}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {row.pending > 0 ? (
                    <span className="inline-flex items-center justify-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                      {row.pending}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {row.completed > 0 ? (
                    <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                      {row.completed}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {row.cancelled > 0 ? (
                    <span className="inline-flex items-center justify-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                      {row.cancelled}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onSelectWeek(row.weekLabel)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      row.isActive
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white"
                    }`}
                  >
                    {row.isActive ? "Viewing" : "View"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
