"use client";

import { Calendar, ChevronDown } from "lucide-react";
import { getWeekOptions, type WeekOffset } from "../../order/weekUtils";

type WeekSelectorProps = {
  selectedOffset: WeekOffset;
  onChange: (offset: WeekOffset) => void;
};

export default function WeekSelector({
  selectedOffset,
  onChange,
}: WeekSelectorProps) {
  const options = getWeekOptions();
  const selected = options.find((w) => w.offset === selectedOffset) ?? options[0];

  return (
    <div className="relative flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
      <Calendar className="h-4 w-4 text-slate-400" />
      <select
        value={selectedOffset}
        onChange={(e) => onChange(Number(e.target.value) as WeekOffset)}
        className="cursor-pointer appearance-none bg-transparent pr-6 text-sm font-medium outline-none"
        aria-label="Select order week"
      >
        {options.map((week) => (
          <option key={week.offset} value={week.offset}>
            {week.offset === 0 ? "This Week" : "Next Week"} — {week.dateRange}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
      <span className="sr-only">{selected.dateRange}</span>
    </div>
  );
}
