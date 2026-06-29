import { statsCards } from "./data";

export default function StatsGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statsCards.map((card) => (
        <div
          key={card.title}
          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
        >
          <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${card.color} text-white`}>
            <span className="text-base">{card.icon}</span>
          </div>
          <p className="text-xs text-slate-500">{card.title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{card.value}</p>
          <p className="mt-0.5 text-xs text-slate-400">{card.subtext}</p>
        </div>
      ))}
    </div>
  );
}
