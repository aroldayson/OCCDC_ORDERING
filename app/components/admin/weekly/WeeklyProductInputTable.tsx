"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  getWeeklyProducts,
  addWeeklyProduct,
  updateWeeklyProduct,
  removeWeeklyProduct,
} from "../../order/weeklyProductStorage";
import type { WeeklyProduct } from "../../order/products";
import {
  getJuneAugustWeeks,
  getCurrentPeriodWeek,
} from "../../order/weekUtils";
import { orderRoleLabels, orderRoles } from "../../order/roles";

const UNITS = [
  "kg",
  "g",
  "pc",
  "pcs",
  "tray",
  "pack",
  "packs",
  "liter",
  "liters",
  "bottle",
  "bottles",
  "gallon",
  "can",
  "box",
  "sack",
  "roll",
  "tub",
  "dozen",
  "225g",
  "ream",
  "unit",
];

const categoryLabels: Record<string, string> = Object.fromEntries(
  orderRoles.map((r) => [r, orderRoleLabels[r]]),
);

type RowState = WeeklyProduct & {
  dirty?: boolean;
  saving?: boolean;
  isNew?: boolean;
};

type WeekTabProps = {
  weekLabel: string;
  periodWeek: number;
  isActive: boolean;
  isCurrent: boolean;
  onClick: () => void;
};

function WeekTab({
  weekLabel,
  periodWeek,
  isActive,
  isCurrent,
  onClick,
}: WeekTabProps) {
  // Short label: "Wk 1"
  return (
    <button
      onClick={onClick}
      title={weekLabel}
      className={`relative flex shrink-0 flex-col items-center rounded-lg px-3 py-2 text-xs font-semibold transition ${
        isActive
          ? "bg-blue-600 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      Wk {periodWeek}
      {isCurrent && (
        <span
          className={`mt-0.5 rounded-full px-1.5 py-px text-[9px] font-bold leading-none ${
            isActive ? "bg-white/30 text-white" : "bg-blue-100 text-blue-700"
          }`}
        >
          NOW
        </span>
      )}
    </button>
  );
}

export default function WeeklyProductInputTable() {
  const weeks = getJuneAugustWeeks();
  const currentPeriodWeek = getCurrentPeriodWeek();
  const defaultWeek = currentPeriodWeek !== null ? currentPeriodWeek - 1 : 0;

  const [activeIdx, setActiveIdx] = useState(defaultWeek);
  const [rows, setRows] = useState<RowState[]>([]);
  const [loading, setLoading] = useState(false);
  const tabListRef = useRef<HTMLDivElement>(null);

  const activeWeek = weeks[activeIdx];

  // Load products for the active week
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getWeeklyProducts(activeWeek.weekLabel).then((products) => {
      if (!cancelled) {
        setRows(
          products.map((p) => ({
            ...p,
            dirty: false,
            saving: false,
            isNew: false,
          })),
        );
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeWeek.weekLabel]);

  // ── Row helpers ────────────────────────────────────────────────────────────

  function updateRow(
    id: string,
    field: keyof WeeklyProduct,
    value: string | number,
  ) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, [field]: value, dirty: true } : r,
      ),
    );
  }

  async function saveRow(row: RowState) {
    if (!row.dirty) return;
    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, saving: true } : r)),
    );
    await updateWeeklyProduct(
      row.id,
      {
        name: row.name,
        defaultQty: row.defaultQty,
        unit: row.unit,
        price: row.price,
        category: row.category,
      },
      activeWeek.weekLabel,
    );
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? { ...r, dirty: false, saving: false, isNew: false }
          : r,
      ),
    );
  }

  async function addRow() {
    const newProduct = await addWeeklyProduct(
      {
        name: "New Item",
        defaultQty: 1,
        unit: "kg",
        price: 0,
        category: "vegetables",
      },
      activeWeek.weekLabel,
    );
    setRows((prev) => [
      ...prev,
      { ...newProduct, dirty: false, saving: false, isNew: true },
    ]);
  }

  async function deleteRow(id: string) {
    if (!window.confirm("Remove this item from this week?")) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
    await removeWeeklyProduct(id, activeWeek.weekLabel);
  }

  // ── Copy from previous week ────────────────────────────────────────────────
  async function copyFromPrevious() {
    if (activeIdx === 0) return;
    if (
      !window.confirm(
        `Copy all items from Week ${weeks[activeIdx - 1].periodWeek} into Week ${activeWeek.periodWeek}? Existing items will not be removed.`,
      )
    )
      return;
    setLoading(true);
    const prev = await getWeeklyProducts(weeks[activeIdx - 1].weekLabel);
    for (const p of prev) {
      await addWeeklyProduct(
        {
          name: p.name,
          defaultQty: p.defaultQty,
          unit: p.unit,
          price: p.price,
          category: p.category,
        },
        activeWeek.weekLabel,
      );
    }
    const refreshed = await getWeeklyProducts(activeWeek.weekLabel);
    setRows(
      refreshed.map((p) => ({
        ...p,
        dirty: false,
        saving: false,
        isNew: false,
      })),
    );
    setLoading(false);
  }

  // ── Scroll tabs ────────────────────────────────────────────────────────────
  function scrollTabs(dir: -1 | 1) {
    tabListRef.current?.scrollBy({ left: dir * 120, behavior: "smooth" });
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-sm font-bold text-slate-800">
            Weekly Product Input
          </p>
          <p className="text-xs text-slate-500">
            June – August 2026 · Edit items per week
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeIdx > 0 && (
            <button
              onClick={copyFromPrevious}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              title={`Copy items from Week ${weeks[activeIdx - 1].periodWeek}`}
            >
              Copy from Wk {weeks[activeIdx - 1].periodWeek}
            </button>
          )}
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Row
          </button>
        </div>
      </div>

      {/* Week Tabs */}
      <div className="flex shrink-0 items-center gap-1 border-b border-slate-100 bg-slate-50 px-3 py-2">
        <button
          onClick={() => scrollTabs(-1)}
          className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-200 transition"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div
          ref={tabListRef}
          className="flex flex-1 gap-1 overflow-x-auto scrollbar-none"
          style={{ scrollbarWidth: "none" }}
        >
          {weeks.map((w, idx) => (
            <WeekTab
              key={w.weekLabel}
              weekLabel={w.weekLabel}
              periodWeek={w.periodWeek}
              isActive={idx === activeIdx}
              isCurrent={w.periodWeek === currentPeriodWeek}
              onClick={() => setActiveIdx(idx)}
            />
          ))}
        </div>
        <button
          onClick={() => scrollTabs(1)}
          className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-200 transition"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Active week date hint */}
      <div className="shrink-0 bg-blue-50 px-4 py-2 text-xs font-medium text-blue-700">
        Week {activeWeek.periodWeek} · {activeWeek.dateRange}
      </div>

      {/* Table */}
      <div className="min-h-0 flex-1 overflow-auto">
        {loading ? (
          <div className="flex h-32 items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="w-8 px-3 py-3 text-center">#</th>
                <th className="px-3 py-3">Item Name</th>
                <th className="px-3 py-3 w-36">Category</th>
                <th className="px-3 py-3 w-24">Qty</th>
                <th className="px-3 py-3 w-28">Unit</th>
                <th className="px-3 py-3 w-28">Price (₱)</th>
                <th className="px-3 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-slate-400"
                  >
                    No items for this week.{" "}
                    <button
                      onClick={addRow}
                      className="text-blue-600 underline"
                    >
                      Add the first row
                    </button>
                    {activeIdx > 0 && (
                      <>
                        {" "}
                        or{" "}
                        <button
                          onClick={copyFromPrevious}
                          className="text-blue-600 underline"
                        >
                          copy from Week {weeks[activeIdx - 1].periodWeek}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`border-b border-slate-50 transition-colors ${
                      row.dirty
                        ? "bg-amber-50/40"
                        : row.isNew
                          ? "bg-green-50/40"
                          : "hover:bg-slate-50/60"
                    }`}
                  >
                    {/* Row number */}
                    <td className="px-3 py-2 text-center text-xs text-slate-400">
                      {idx + 1}
                    </td>

                    {/* Name */}
                    <td className="px-3 py-1.5">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) =>
                          updateRow(row.id, "name", e.target.value)
                        }
                        onBlur={() => saveRow(row)}
                        className="w-full rounded border border-transparent bg-transparent px-2 py-1.5 text-sm text-slate-800 outline-none focus:border-blue-300 focus:bg-white focus:ring-1 focus:ring-blue-100"
                        placeholder="Item name"
                      />
                    </td>

                    {/* Category */}
                    <td className="px-3 py-1.5">
                      <select
                        value={row.category}
                        onChange={(e) => {
                          updateRow(row.id, "category", e.target.value);
                          // auto-save on change
                          const updated = {
                            ...row,
                            category: e.target
                              .value as WeeklyProduct["category"],
                            dirty: true,
                          };
                          saveRow(updated);
                        }}
                        className="w-full rounded border border-transparent bg-transparent px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-1 focus:ring-blue-100"
                      >
                        {orderRoles.map((r) => (
                          <option key={r} value={r}>
                            {categoryLabels[r]}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Qty */}
                    <td className="px-3 py-1.5">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={row.defaultQty}
                        onChange={(e) =>
                          updateRow(
                            row.id,
                            "defaultQty",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        onBlur={() => saveRow(row)}
                        className="w-full rounded border border-transparent bg-transparent px-2 py-1.5 text-sm text-slate-800 outline-none focus:border-blue-300 focus:bg-white focus:ring-1 focus:ring-blue-100"
                      />
                    </td>

                    {/* Unit */}
                    <td className="px-3 py-1.5">
                      <select
                        value={row.unit}
                        onChange={(e) => {
                          updateRow(row.id, "unit", e.target.value);
                          const updated = {
                            ...row,
                            unit: e.target.value,
                            dirty: true,
                          };
                          saveRow(updated);
                        }}
                        className="w-full rounded border border-transparent bg-transparent px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-1 focus:ring-blue-100"
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Price */}
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-400">₱</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={row.price}
                          onChange={(e) =>
                            updateRow(
                              row.id,
                              "price",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          onBlur={() => saveRow(row)}
                          className="w-full rounded border border-transparent bg-transparent px-2 py-1.5 text-sm text-slate-800 outline-none focus:border-blue-300 focus:bg-white focus:ring-1 focus:ring-blue-100"
                        />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-1.5">
                      <div className="flex items-center justify-end gap-1">
                        {row.saving && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                        )}
                        {row.dirty && !row.saving && (
                          <button
                            onClick={() => saveRow(row)}
                            className="rounded px-1.5 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50"
                            title="Save"
                          >
                            Save
                          </button>
                        )}
                        <button
                          onClick={() => deleteRow(row.id)}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                          aria-label="Delete row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
        <span>
          {rows.length} item{rows.length !== 1 ? "s" : ""} · Week{" "}
          {activeWeek.periodWeek}
        </span>
        <span className="text-slate-400">Changes auto-save on blur</span>
      </div>
    </div>
  );
}
