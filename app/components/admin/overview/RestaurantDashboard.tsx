import { useState, useMemo } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import SummaryCards from "./SummaryCards";
import RevenueChart from "./RevenueChart";
import BusinessData from "./BusinessData";
import RecentActivity from "./RecentActivity";
import TopDishes from "./TopDishes";
import type { WeeklyOrderRecord } from "../../order/types";
import { getJuneAugustWeeks, getCurrentOrNextPeriodWeek, ALL_WEEKS_VALUE } from "../../order/weekUtils";
import { filterOrdersForWeek } from "../../order/orderAccess";

type RestaurantDashboardProps = {
  orders: WeeklyOrderRecord[];
  onStatusCardClick?: (status: "pending" | "in_progress" | "completed", week?: string) => void;
  onRecentOrderClick?: (order: WeeklyOrderRecord) => void;
};

export default function RestaurantDashboard({
  orders,
  onStatusCardClick,
  onRecentOrderClick,
}: RestaurantDashboardProps) {
  const [selectedWeek, setSelectedWeek] = useState<string>(() => {
    const allWeeks = getJuneAugustWeeks();
    const periodWeek = getCurrentOrNextPeriodWeek();
    if (periodWeek !== null) {
      return allWeeks[periodWeek - 1].weekLabel;
    }
    return "all";
  });

  const filteredOrders = useMemo(() => {
    return filterOrdersForWeek(
      orders,
      selectedWeek === "all" ? ALL_WEEKS_VALUE : selectedWeek,
    );
  }, [orders, selectedWeek]);

  return (
    <div className="mx-auto max-w-7xl space-y-4 sm:space-y-5">
      {/* Top Header Row with Week Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight sm:text-xl">
            Cooperative Office Performance
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Realtime performance metrics for all school orders
          </p>
        </div>
        <div className="relative flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm self-start">
          <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="cursor-pointer appearance-none bg-transparent pr-6 text-sm font-medium outline-none text-slate-700"
            aria-label="Filter dashboard by week"
          >
            <option value="all">All Weeks</option>
            {getJuneAugustWeeks().map((w) => (
              <option key={w.weekLabel} value={w.weekLabel}>
                Week {w.periodWeek} — {w.dateRange}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
        </div>
      </div>

      <SummaryCards
        orders={filteredOrders}
        onCardClick={onStatusCardClick}
        selectedWeek={selectedWeek}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart orders={filteredOrders} />
        </div>
        <div>
          <BusinessData orders={filteredOrders} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RecentActivity orders={filteredOrders} onOrderClick={onRecentOrderClick} />
        <TopDishes orders={filteredOrders} />
      </div>
    </div>
  );
}
