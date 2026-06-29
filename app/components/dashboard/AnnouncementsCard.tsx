import { Megaphone } from "lucide-react";
import { announcements } from "./data";

export default function AnnouncementsCard() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800">Latest Announcements</h2>
        <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">View All</button>
      </div>
      <ul className="space-y-4">
        {announcements.map((item) => (
          <li key={item.title} className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Megaphone className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800">{item.title}</p>
              <p className="text-xs text-slate-500">{item.subtitle}</p>
            </div>
            <span className="shrink-0 text-xs text-slate-400">{item.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
