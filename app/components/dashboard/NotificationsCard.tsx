import { Bell } from "lucide-react";
import { notifications } from "./data";

export default function NotificationsCard() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800">Recent Notifications</h2>
        <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">View All</button>
      </div>
      <ul className="space-y-4">
        {notifications.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <Bell className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-700">{item.message}</p>
              <p className="mt-0.5 text-xs text-slate-400">{item.time}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
