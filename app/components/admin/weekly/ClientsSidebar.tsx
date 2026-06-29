"use client";

import { Plus, Search, User } from "lucide-react";
import { useMemo, useState } from "react";
import { orderRoleColors, orderRoleLabels } from "../../order/roles";
import type { ClientGroup } from "./utils";

type ClientsSidebarProps = {
  clients: ClientGroup[];
  selectedClient: string | null;
  onSelect: (name: string) => void;
  onAddClient: () => void;
};

export default function ClientsSidebar({
  clients,
  selectedClient,
  onSelect,
  onAddClient,
}: ClientsSidebarProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.categories.some((cat) => orderRoleLabels[cat].toLowerCase().includes(q))
    );
  }, [clients, search]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white lg:w-56 lg:shrink-0 xl:w-64">
      <div className="shrink-0 border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-bold text-slate-800">Schools</p>
        <p className="text-xs text-slate-500">Sorted alphabetically</p>
      </div>

      <div className="shrink-0 px-3 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search schools..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {filtered.length === 0 ? (
          <li className="px-2 py-4 text-center text-xs text-slate-500">No schools found</li>
        ) : (
          filtered.map((client) => {
            const active = selectedClient === client.name;
            return (
              <li key={client.id} className="mb-1">
                <button
                  onClick={() => onSelect(client.name)}
                  className={`flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    active
                      ? "bg-blue-50 font-semibold text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <User
                    className={`mt-0.5 h-4 w-4 shrink-0 ${active ? "text-blue-600" : "text-slate-400"}`}
                  />
                  <span className="min-w-0">
                    <span className="block truncate">{client.name}</span>
                    {client.categories.length > 0 && (
                      <span className="mt-1 flex flex-wrap gap-1">
                        {client.categories.map((cat) => (
                          <span
                            key={cat}
                            className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${orderRoleColors[cat]}`}
                          >
                            {orderRoleLabels[cat]}
                          </span>
                        ))}
                      </span>
                    )}
                    <span className="mt-0.5 block text-xs font-normal text-slate-500">
                      {client.orderCount} order{client.orderCount !== 1 ? "s" : ""}
                    </span>
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>

      <div className="shrink-0 border-t border-slate-100 p-3">
        <button
          onClick={onAddClient}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
        >
          <Plus className="h-4 w-4" />
          Add School
        </button>
      </div>
    </div>
  );
}
