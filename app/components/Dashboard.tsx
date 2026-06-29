"use client";

import { useState } from "react";
import {
  LayoutGrid,
  ArrowLeftRight,
  BarChart2,
  Package,
  Grid3x3,
  Search,
  Calendar,
  Menu,
  X,
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  ArrowUpRight,
} from "lucide-react";

const navItems = [
  { icon: LayoutGrid, label: "Summary", active: true },
  { icon: ArrowLeftRight, label: "Transaction", active: false },
  { icon: BarChart2, label: "Statistics", active: false },
  { icon: Package, label: "Product", active: false },
  { icon: Grid3x3, label: "Category", active: false },
];

const statCards = [
  { label: "CUSTOMERS", value: "54,235" },
  { label: "INCOME", value: "$980,632" },
  { label: "PRODUCTS SOLD", value: "5,490" },
];

const financeData = [40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const recentOrders = [
  { id: "#1235465", product: "DJI Mavic Pro 2", date: "Sep 12, 2021", price: "$1,299", status: "Delivered" },
  { id: "#1235464", product: "Kung Pao Chicken", date: "Sep 11, 2021", price: "$24.99", status: "Delivered" },
  { id: "#1235463", product: "Wireless Headset", date: "Sep 10, 2021", price: "$189", status: "Canceled" },
  { id: "#1235462", product: "Mapo Tofu", date: "Sep 09, 2021", price: "$18.00", status: "Delivered" },
];

const activities = [
  { label: "Withdraw Earning", amount: "-$2,400", icon: Wallet },
  { label: "Paying Website tax", amount: "-$340", icon: CreditCard },
  { label: "New Order Payment", amount: "+$1,280", icon: ArrowUpRight },
  { label: "Supplier Payment", amount: "-$890", icon: CreditCard },
];

const categories = [
  { name: "Footwear", emoji: "👟", bg: "bg-amber-50", border: "border-amber-100" },
  { name: "Accessories", emoji: "👜", bg: "bg-teal-50", border: "border-teal-100" },
];

function DonutChart() {
  const segments = [
    { percent: 35, color: "#4f6ef7" },
    { percent: 25, color: "#8b5cf6" },
    { percent: 20, color: "#a78bfa" },
    { percent: 20, color: "#e0e7ff" },
  ];

  let offset = 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg viewBox="0 0 130 130" className="h-28 w-28 sm:h-32 sm:w-32">
      {segments.map((seg, i) => {
        const dash = (seg.percent / 100) * circumference;
        const gap = circumference - dash;
        const rotation = (offset / 100) * 360 - 90;
        offset += seg.percent;
        return (
          <circle
            key={i}
            cx="65"
            cy="65"
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth="18"
            strokeDasharray={`${dash} ${gap}`}
            transform={`rotate(${rotation} 65 65)`}
          />
        );
      })}
      <text x="65" y="62" textAnchor="middle" className="fill-slate-800 text-[18px] font-bold">
        68%
      </text>
      <text x="65" y="78" textAnchor="middle" className="fill-slate-400 text-[9px]">
        Growth
      </text>
    </svg>
  );
}

function SidebarToggleButton({
  collapsed,
  onClick,
}: {
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="absolute -right-3.5 top-7 z-30 flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-md transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
      aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
        <line x1="4.5" y1="3" x2="4.5" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        {collapsed ? (
          <path d="M8 7L10.5 5.5V8.5L8 7Z" fill="currentColor" />
        ) : (
          <path d="M10 7L7.5 5.5V8.5L10 7Z" fill="currentColor" />
        )}
      </svg>
    </button>
  );
}

function SidebarContent({
  collapsed = false,
  onNavigate,
  showClose,
  onClose,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  showClose?: boolean;
  onClose?: () => void;
}) {
  return (
    <>
      <div className={`flex items-center pt-6 pb-5 ${collapsed ? "justify-center px-2" : "justify-between px-5 lg:px-6"}`}>
        <div className={`flex items-center ${collapsed ? "" : "gap-2.5"}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-bold text-white">
            O2
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-widest text-slate-400">020</p>
              <p className="truncate text-sm font-bold text-slate-800">Brand Protector</p>
            </div>
          )}
        </div>
        {showClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className={`flex-1 overflow-y-auto overflow-x-hidden ${collapsed ? "px-2" : "px-3 lg:px-4"}`}>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.label}>
              <button
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                className={`flex w-full items-center rounded-xl text-sm font-medium transition-all ${
                  collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5 lg:px-4 lg:py-3"
                } ${
                  item.active
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:bg-white/60 hover:text-slate-700"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <span className="truncate uppercase tracking-wide text-xs lg:text-sm lg:normal-case">
                    {item.label}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className={`shrink-0 ${collapsed ? "px-2 pb-4" : "p-3 lg:p-4"}`}>
        {collapsed ? (
          <div className="flex justify-center">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-300 to-violet-400 text-sm font-semibold text-white"
              title="Sally Hawkins"
            >
              SH
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-3 shadow-sm lg:p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-300 to-violet-400 text-sm font-semibold text-white">
                SH
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">Sally Hawkins</p>
                <p className="text-xs text-slate-400">Pro Member</p>
              </div>
            </div>
            <button className="mt-3 w-full rounded-full bg-rose-100 py-1.5 text-[11px] font-bold tracking-wider text-rose-500 transition-colors hover:bg-rose-200">
              UPGRADE
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function OrderCards() {
  return (
    <div className="space-y-3 md:hidden">
      {recentOrders.map((order) => (
        <div key={order.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-slate-800">{order.product}</p>
              <p className="text-xs text-slate-400">{order.id}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                order.status === "Delivered"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-500"
              }`}
            >
              {order.status}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{order.date}</span>
            <span className="font-semibold text-slate-700">{order.price}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SummaryPanel() {
  return (
    <aside className="w-full shrink-0 border-t border-slate-100 bg-white xl:w-[280px] xl:border-t-0 xl:border-l 2xl:w-[300px]">
      <div className="p-4 sm:p-5">
        <h2 className="mb-4 text-base font-bold text-slate-800">Summary</h2>

        <div className="relative mb-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs text-slate-400">Your Balance</p>
          <p className="mt-1 text-2xl font-bold text-slate-800 sm:text-3xl">$10,632.00</p>
          <div className="mt-3 flex items-center gap-4">
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-500">
              <TrendingUp className="h-3.5 w-3.5" />
              +12.5%
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-red-400">
              <TrendingDown className="h-3.5 w-3.5" />
              -3.2%
            </span>
          </div>
          <button className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-transform hover:scale-105">
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <ul className="mb-5 space-y-3">
          {activities.map((act) => (
            <li key={act.label} className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                <act.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-700">{act.label}</p>
              </div>
              <span
                className={`shrink-0 text-xs font-semibold ${
                  act.amount.startsWith("+") ? "text-emerald-500" : "text-slate-600"
                }`}
              >
                {act.amount}
              </span>
            </li>
          ))}
        </ul>

        <p className="mb-3 text-sm font-semibold text-slate-700">Top Categories</p>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-3 sm:p-4 ${cat.bg} ${cat.border}`}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <p className="text-center text-xs font-medium text-slate-700">{cat.name}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const maxFinance = Math.max(...financeData);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-white">
      {/* Desktop sidebar — collapsible with edge toggle */}
      <div
        className={`relative hidden shrink-0 transition-[width] duration-300 ease-in-out lg:block ${
          sidebarCollapsed ? "w-[72px]" : "w-60 xl:w-64"
        }`}
      >
        <aside className="flex h-full w-full flex-col border-r border-slate-200/80 bg-sidebar">
          <SidebarContent collapsed={sidebarCollapsed} />
        </aside>
        <SidebarToggleButton
          collapsed={sidebarCollapsed}
          onClick={() => setSidebarCollapsed((v) => !v)}
        />
      </div>

      {/* Mobile sidebar — slide overlay */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/40 transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 flex h-full w-[min(280px,85vw)] flex-col bg-sidebar shadow-2xl transition-transform duration-300 ease-in-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent
            showClose
            onClose={() => setMobileOpen(false)}
            onNavigate={() => setMobileOpen(false)}
          />
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden xl:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="shrink-0 rounded-xl p-2 text-slate-500 hover:bg-slate-50 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="truncate text-base font-bold text-slate-800 sm:text-xl">Business Dashboard</h1>
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <button className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 sm:p-2.5">
                <Search className="h-5 w-5" />
              </button>
              <button className="relative rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 sm:p-2.5">
                <Calendar className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-400" />
              </button>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {statCards.map((card) => (
                  <div
                    key={card.label}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 p-4 text-white shadow-lg sm:p-5"
                  >
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
                    <div className="absolute -bottom-6 -right-2 h-20 w-20 rounded-full bg-white/5" />
                    <p className="text-[10px] font-semibold tracking-widest text-white/80 sm:text-[11px]">
                      {card.label}
                    </p>
                    <p className="mt-1 text-2xl font-bold sm:mt-2 sm:text-3xl">{card.value}</p>
                    <div className="absolute bottom-3 right-4 opacity-20">
                      <div className="grid grid-cols-3 gap-1">
                        {Array.from({ length: 9 }).map((_, i) => (
                          <div key={i} className="h-1.5 w-1.5 rounded-full bg-white" />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
                  <h2 className="mb-1 text-sm font-bold text-slate-800">Data Analytics Overview</h2>
                  <p className="mb-3 text-xs text-slate-400 sm:mb-4">Marketplace performance</p>
                  <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <DonutChart />
                    <button className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-5 py-2.5 text-xs font-bold tracking-wider text-white shadow-md hover:opacity-90 sm:w-auto">
                      START
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5 md:col-span-2 xl:col-span-1">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-800">Finance Flow</h2>
                    <span className="text-xs text-slate-400">September 2021</span>
                  </div>
                  <div className="flex h-32 items-end justify-between gap-1 sm:h-36 sm:gap-1.5">
                    {financeData.map((val, i) => (
                      <div key={months[i]} className="flex flex-1 flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-blue-500 to-violet-400"
                          style={{ height: `${(val / maxFinance) * 100}%`, minHeight: "4px" }}
                        />
                        <span className="hidden text-[8px] text-slate-400 sm:block sm:text-[9px]">
                          {months[i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-violet-50 p-4 shadow-sm sm:p-5 md:col-span-2 xl:col-span-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">Upgrade to Pro</p>
                  <p className="mt-1 text-2xl font-bold text-slate-800">
                    $29 <span className="text-sm font-normal text-slate-400">p/m</span>
                  </p>
                  <p className="mt-2 max-w-[200px] text-xs leading-relaxed text-slate-500">
                    Unlock advanced analytics, unlimited orders, and priority support.
                  </p>
                  <div className="absolute -bottom-2 right-2 text-5xl opacity-80 sm:text-6xl">👜</div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
                <h2 className="mb-4 text-sm font-bold text-slate-800">Recent Orders</h2>
                <OrderCards />
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs text-slate-400">
                        <th className="pb-3 pr-4 font-medium">Order ID</th>
                        <th className="pb-3 pr-4 font-medium">Product</th>
                        <th className="pb-3 pr-4 font-medium">Date</th>
                        <th className="pb-3 pr-4 font-medium">Price</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="border-b border-slate-50 last:border-0">
                          <td className="py-3.5 pr-4 text-xs font-medium text-slate-500">{order.id}</td>
                          <td className="py-3.5 pr-4 font-medium text-slate-700">{order.product}</td>
                          <td className="py-3.5 pr-4 text-xs text-slate-400">{order.date}</td>
                          <td className="py-3.5 pr-4 font-semibold text-slate-700">{order.price}</td>
                          <td className="py-3.5">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                order.status === "Delivered"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-red-50 text-red-500"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </main>
        </div>

        <div className="min-h-0 shrink-0 overflow-y-auto xl:max-h-full">
          <SummaryPanel />
        </div>
      </div>
    </div>
  );
}
