import { ShoppingCart } from "lucide-react";
import { weekLabel as defaultWeekLabel } from "./products";

type SubmitBarProps = {
  selectedCount: number;
  totalCount: number;
  disabled: boolean;
  onSubmit: () => void;
  embedded?: boolean;
  weekLabel?: string;
};

export default function SubmitBar({
  selectedCount,
  totalCount,
  disabled,
  onSubmit,
  embedded,
  weekLabel,
}: SubmitBarProps) {
  const displayWeekLabel = weekLabel || defaultWeekLabel;

  return (
    <div
      className={
        embedded
          ? "shrink-0 border-t border-slate-200 bg-white pt-3"
          : "fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-sm"
      }
    >
      <div className={`flex items-center justify-between gap-4 ${embedded ? "" : "mx-auto max-w-2xl"}`}>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{displayWeekLabel}</p>
          <p className="truncate text-sm font-bold text-slate-800">
            {selectedCount} item{selectedCount === 1 ? "" : "s"} selected
          </p>
        </div>
        <button
          onClick={onSubmit}
          disabled={disabled}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingCart className="h-4 w-4" />
          Submit Order
        </button>
      </div>
    </div>
  );
}
