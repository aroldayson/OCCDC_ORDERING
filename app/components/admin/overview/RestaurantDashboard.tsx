import SummaryCards from "./SummaryCards";
import RevenueChart from "./RevenueChart";
import BusinessData from "./BusinessData";
import RecentActivity from "./RecentActivity";
import TopDishes from "./TopDishes";

export default function RestaurantDashboard() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 sm:space-y-5">
      <SummaryCards />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <BusinessData />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RecentActivity />
        <TopDishes />
      </div>
    </div>
  );
}
