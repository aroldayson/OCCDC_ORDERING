"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { WeeklyProduct } from "../order/products";
import { getWeeklyProducts, removeWeeklyProduct } from "../order/weeklyProductStorage";
import { getCategoryDisplay } from "./weekly/utils";

const PAGE_SIZES = [10, 20, 50];

type WeeklyItemsManagerProps = {
  onEditItem?: (item: WeeklyProduct | null) => void;
  onAddItem?: () => void;
};

export default function WeeklyItemsManager({ onEditItem, onAddItem }: WeeklyItemsManagerProps) {
  const [items, setItems] = useState<WeeklyProduct[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [viewItem, setViewItem] = useState<WeeklyProduct | null>(null);

  const loadItems = useCallback(() => {
    setItems(getWeeklyProducts());
  }, []);

  useEffect(() => {
    loadItems();
    window.addEventListener("occdc-weekly-products-updated", loadItems);
    return () => window.removeEventListener("occdc-weekly-products-updated", loadItems);
  }, [loadItems]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        getCategoryDisplay(item).toLowerCase().includes(q) ||
        item.unit.toLowerCase().includes(q) ||
        (item.note?.toLowerCase().includes(q) ?? false)
    );
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, filtered.length);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  function handleDelete(item: WeeklyProduct) {
    if (confirm(`Remove "${item.name}" from the weekly list?`)) {
      removeWeeklyProduct(item.id);
    }
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
          {onAddItem && (
            <button
              onClick={onAddItem}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          )}
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 sm:px-5">Item</th>
                <th className="px-4 py-3 sm:px-5">Category</th>
                <th className="px-4 py-3 sm:px-5">Quantity</th>
                <th className="px-4 py-3 sm:px-5">Unit</th>
                <th className="px-4 py-3 sm:px-5">Notes</th>
                <th className="px-4 py-3 text-right sm:px-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                    No items found.
                  </td>
                </tr>
              ) : (
                paged.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-800 sm:px-5">{item.name}</td>
                    <td className="px-4 py-3 text-slate-600 sm:px-5">{getCategoryDisplay(item)}</td>
                    <td className="px-4 py-3 text-slate-800 sm:px-5">{item.defaultQty}</td>
                    <td className="px-4 py-3 text-slate-600 sm:px-5">{item.unit}</td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-slate-500 sm:px-5">
                      {item.note ? `(${item.note})` : "—"}
                    </td>
                    <td className="px-4 py-3 sm:px-5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewItem(item)}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          aria-label={`View ${item.name}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEditItem?.(item)}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          aria-label={`Edit ${item.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p>
            Showing {rangeStart} to {rangeEnd} of {filtered.length} items
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-blue-400"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[2rem] text-center font-medium text-slate-700">{safePage}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewItem(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-base font-bold text-slate-800">{viewItem.name}</h3>
              <button
                onClick={() => setViewItem(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Category</dt>
                <dd className="font-medium text-slate-800">{getCategoryDisplay(viewItem)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Quantity</dt>
                <dd className="font-medium text-slate-800">
                  {viewItem.defaultQty} {viewItem.unit}
                </dd>
              </div>
              {viewItem.note && (
                <div>
                  <dt className="text-slate-500">Notes</dt>
                  <dd className="mt-1 text-slate-700">{viewItem.note}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}
    </>
  );
}
