import SummaryCards from "./SummaryCards";
import RevenueChart from "./RevenueChart";
import BusinessData from "./BusinessData";
import RecentActivity from "./RecentActivity";
import TopDishes from "./TopDishes";
import type { WeeklyOrderRecord } from "../../order/types";

type RestaurantDashboardProps = {
  orders: WeeklyOrderRecord[];
};

export default function RestaurantDashboard({ orders }: RestaurantDashboardProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-4 sm:space-y-5">
      <SummaryCards orders={orders} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart orders={orders} />
        </div>
        <div>
          <BusinessData orders={orders} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RecentActivity orders={orders} />
        <TopDishes orders={orders} />
      </div>
    </div>
  );
}
