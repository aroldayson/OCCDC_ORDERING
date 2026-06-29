"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
import AlertBanner from "./AlertBanner";
import StatsGrid from "./StatsGrid";
import SharedCapitalSection from "./SharedCapitalSection";
import AnnouncementsCard from "./AnnouncementsCard";
import NotificationsCard from "./NotificationsCard";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <aside className="relative hidden h-full w-64 shrink-0 lg:block xl:w-72">
        <Sidebar />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative h-full w-[min(288px,85vw)] shadow-2xl">
            <Sidebar
              showClose
              onClose={() => setSidebarOpen(false)}
              onNavigate={() => setSidebarOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-page">
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm font-bold text-slate-800">Cooperative Council</p>
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl space-y-5 p-4 sm:space-y-6 sm:p-6">
            <DashboardHeader />
            <AlertBanner />
            <StatsGrid />
            <SharedCapitalSection />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <AnnouncementsCard />
              <NotificationsCard />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
