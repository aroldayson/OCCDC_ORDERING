"use client";

import { useState } from "react";
import { cooperativeRows } from "./data";

export default function SharedCapitalSection() {
  const [activeTab, setActiveTab] = useState<"capital" | "contributions">("capital");

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-bold text-slate-800">Shared Capital &amp; Contributions</h2>
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab("capital")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "capital"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Shared Capital
          </button>
          <button
            onClick={() => setActiveTab("contributions")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "contributions"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Contributions
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm text-blue-600">Total shared capital</p>
          <p className="mt-2 text-3xl font-bold text-blue-800">1,000</p>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-blue-600">
              <span>Progress to target</span>
              <span>20%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-blue-200">
              <div className="h-full w-[20%] rounded-full bg-blue-600" />
            </div>
            <p className="mt-1 text-xs text-blue-500">Target: 5,000</p>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-sm text-emerald-600">Total contributions</p>
          <p className="mt-2 text-3xl font-bold text-emerald-800">0</p>
          <p className="mt-3 text-xs text-emerald-600">No contributions recorded this period</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="pb-3 pr-4">Cooperative</th>
              <th className="pb-3 pr-4">Shared Capital</th>
              <th className="pb-3 pr-4">Target</th>
              <th className="pb-3 pr-4">Contributions</th>
              <th className="pb-3">Members</th>
            </tr>
          </thead>
          <tbody>
            {cooperativeRows.map((row) => (
              <tr key={row.cooperative} className="border-b border-slate-50 last:border-0">
                <td className="py-3.5 pr-4 font-medium text-slate-700">{row.cooperative}</td>
                <td className="py-3.5 pr-4 text-slate-600">{row.sharedCapital}</td>
                <td className="py-3.5 pr-4 text-slate-600">{row.target}</td>
                <td className="py-3.5 pr-4 text-slate-600">{row.contributions}</td>
                <td className="py-3.5 text-slate-600">{row.members}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
