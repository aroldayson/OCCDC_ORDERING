import { MessageSquare, Bell } from "lucide-react";
import { user } from "./data";

export default function DashboardHeader() {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
          Welcome back, {user.name}! 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Member ID: <span className="font-medium text-slate-600">{user.memberId}</span>
          {" · "}
          Cooperative: <span className="font-medium text-slate-600">{user.cooperative}</span>
          {" · "}
          Role: <span className="font-medium text-slate-600">{user.role}</span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50">
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Messages</span>
        </button>
        <button className="relative flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Notifications</span>
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
            3
          </span>
        </button>
      </div>
    </header>
  );
}
