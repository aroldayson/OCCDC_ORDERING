"use client";

import { Calendar, ChevronDown } from "lucide-react";
import {
  getWeekOptions,
  getJuneAugustWeeks,
  getCurrentPeriodWeek,
  type WeekOffset,
} from "../../order/weekUtils";

type WeekSelectorProps = {
  /** The weekLabel string currently selected (used as the stable key). */
  selectedWeekLabel: string;
  onChange: (weekLabel: string) => void;
};

export default function WeekSelector({
  selectedWeekLabel,
  onChange,
}: WeekSelectorProps) {
  const dynamicWeeks = getWeekOptions();
  const periodWeeks = getJuneAugustWeeks();
  const currentPeriodWeek = getCurrentPeriodWeek();

  return (
    <div className="relative flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
      <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
      <select
        value={selectedWeekLabel}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none bg-transparent pr-6 text-sm font-medium outline-none"
        aria-label="Select order week"
      >
        {/* Dynamic: This Week / Next Week */}
        <optgroup label="Current Period">
          {dynamicWeeks.map((w) => (
            <option key={w.weekLabel} value={w.weekLabel}>
              {w.offset === 0 ? "This Week" : "Next Week"} — {w.dateRange}
            </option>
          ))}
        </optgroup>

        {/* Fixed: June–August Weeks 1–8 */}
        <optgroup label="June – August 2026">
          {periodWeeks.map((w) => (
            <option key={w.weekLabel} value={w.weekLabel}>
              Week {w.periodWeek}
              {w.periodWeek === currentPeriodWeek ? " ★" : ""} — {w.dateRange}
            </option>
          ))}
        </optgroup>
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
    </div>
  );
}
