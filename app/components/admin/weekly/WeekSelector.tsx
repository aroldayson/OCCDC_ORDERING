"use client";

import { Calendar, ChevronDown } from "lucide-react";
import {
  ALL_WEEKS_VALUE,
  getJuneAugustWeeks,
  getCurrentOrNextPeriodWeek,
} from "../../order/weekUtils";

type WeekSelectorProps = {
  /** The weekLabel string currently selected (used as the stable key). */
  selectedWeekLabel: string;
  onChange: (weekLabel: string) => void;
  /** When true, includes an "All Weeks" option at the top. */
  showAllOption?: boolean;
};

export default function WeekSelector({
  selectedWeekLabel,
  onChange,
  showAllOption = true,
}: WeekSelectorProps) {
  const allWeeks = getJuneAugustWeeks();
  const currentOrNextWeek = getCurrentOrNextPeriodWeek();

  return (
    <div className="relative flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
      <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
      <select
        value={selectedWeekLabel}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none bg-transparent pr-6 text-sm font-medium outline-none"
        aria-label="Select order week"
      >
        {showAllOption && (
          <option value={ALL_WEEKS_VALUE}>All Weeks</option>
        )}
        {allWeeks.map((w) => (
          <option key={w.weekLabel} value={w.weekLabel}>
            Week {w.periodWeek}
            {w.periodWeek === currentOrNextWeek ? " ★" : ""} — {w.dateRange}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
    </div>
  );
}
