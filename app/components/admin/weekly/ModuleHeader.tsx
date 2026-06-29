import { Filter, Plus } from "lucide-react";
import { weekLabel } from "../../order/products";

type ModuleHeaderProps = {
  pendingCount: number;
  onFilter: () => void;
  onAddOrder: () => void;
  filterActive?: boolean;
};

export default function ModuleHeader({
  pendingCount,
  onFilter,
  onAddOrder,
  filterActive,
}: ModuleHeaderProps) {
  return (
    <div className="flex shrink-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">Order Period</p>
        <h2 className="mt-0.5 text-xl font-bold text-slate-900 sm:text-2xl">{weekLabel}</h2>
        <p className="mt-1 text-sm text-blue-600">
          {pendingCount > 0
            ? `${pendingCount} order${pendingCount !== 1 ? "s" : ""} waiting to be processed`
            : "No orders waiting to be processed"}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <button
          onClick={onFilter}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
            filterActive
              ? "border-blue-300 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Filter className="h-4 w-4" />
          Filter
        </button>
        <button
          onClick={onAddOrder}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:px-4"
        >
          <Plus className="h-4 w-4" />
          Add Order
        </button>
      </div>
    </div>
  );
}
