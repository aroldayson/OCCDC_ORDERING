import { Filter, LayoutList } from "lucide-react";
import { orderRoleLabels, orderRoles } from "../../order/roles";

type ModuleHeaderProps = {
  weekLabel: string;
  pendingCount: number;
  categoryFilter: string;
  onCategoryFilterChange: (cat: string) => void;
  showOverview?: boolean;
  onToggleOverview?: () => void;
};

export default function ModuleHeader({
  weekLabel,
  pendingCount,
  categoryFilter,
  onCategoryFilterChange,
  showOverview = false,
  onToggleOverview,
}: ModuleHeaderProps) {
  return (
    <div className="flex shrink-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">
          Order Period
        </p>
        <h2 className="mt-0.5 text-xl font-bold text-slate-900 sm:text-2xl">
          {weekLabel}
        </h2>
        <p className="mt-1 text-sm text-blue-600">
          {pendingCount > 0
            ? `${pendingCount} order${pendingCount !== 1 ? "s" : ""} waiting to be processed`
            : "No orders waiting to be processed"}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {onToggleOverview && (
          <button
            onClick={onToggleOverview}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              showOverview
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            title="Toggle weekly overview table"
          >
            <LayoutList className="h-4 w-4" />
            Weekly Overview
          </button>
        )}

        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="bg-transparent outline-none cursor-pointer text-slate-700 font-semibold"
          >
            <option value="all">All Categories</option>
            {orderRoles.map((role) => (
              <option key={role} value={role}>
                {orderRoleLabels[role]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
