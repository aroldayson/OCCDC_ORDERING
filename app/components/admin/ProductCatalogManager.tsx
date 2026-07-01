"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { getWeeklyProducts, addWeeklyProduct, updateWeeklyProduct, removeWeeklyProduct } from "../order/weeklyProductStorage";
import type { WeeklyProduct } from "../order/products";
import ItemFormModal, { type ItemFormData } from "./weekly/ItemFormModal";
import WeekSelector from "./weekly/WeekSelector";
import { getWeekInfo, type WeekOffset } from "../order/weekUtils";
import { useAuth } from "@/app/providers/AuthProvider";
import { isCategoryAllowed } from "../order/roles";

const PAGE_SIZES = [10, 20, 50];

function formatProductId(id: string) {
  const match = id.match(/-(\d+)$/);
  if (match) {
    return `PRD-${match[1].slice(-4)}`;
  }
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return `PRD-${Math.abs(hash).toString().slice(0, 4).padStart(4, '0')}`;
}

const categoryLabels: Record<string, string> = {
  vegetables: "Vegetables",
  fruits: "Fruits",
  fish: "Fish",
  egg: "Egg",
  meat: "Meat",
  groceries: "Groceries",
  rice: "Rice",
  other_order: "Other Orders",
};

import { filterOrdersForWeek } from "../order/orderAccess";
import type { OrderStatus, WeeklyOrderRecord } from "../order/types";
import { printCatalog } from "./printOrder";

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-violet-50 text-violet-700 border-violet-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function ProductCatalogManager({ orders }: { orders?: WeeklyOrderRecord[] }) {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState<WeekOffset>(0);
  const [products, setProducts] = useState<WeeklyProduct[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [editingItem, setEditingItem] = useState<WeeklyProduct | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const selectedWeek = useMemo(() => getWeekInfo(weekOffset), [weekOffset]);

  const hasCompletedOrders = useMemo(() => {
    if (!orders) return false;
    const weekOrders = filterOrdersForWeek(orders, selectedWeek.weekLabel);
    return weekOrders.some((o) => o.status === "completed");
  }, [orders, selectedWeek.weekLabel]);

  const loadProducts = useCallback(() => {
    getWeeklyProducts(selectedWeek.weekLabel).then(setProducts);
  }, [selectedWeek.weekLabel]);

  useEffect(() => {
    loadProducts();
    window.addEventListener("occdc-weekly-products-updated", loadProducts);
    return () => window.removeEventListener("occdc-weekly-products-updated", loadProducts);
  }, [loadProducts]);

  const allowedProducts = useMemo(() => {
    if (!user || user.role !== "admin") return products;
    return products.filter((p) => isCategoryAllowed(p.category, user.categories));
  }, [products, user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allowedProducts;

    if (orders && q.startsWith("ord-")) {
      const matchedOrders = orders.filter((o) => o.id.toLowerCase().includes(q));
      if (matchedOrders.length > 0) {
        const clientNames = new Set(matchedOrders.map((o) => o.clientName));
        const allClientOrders = orders.filter((o) => clientNames.has(o.clientName));
        const orderProductIds = new Set(allClientOrders.flatMap((o) => o.items.map((i) => i.productId)));
        return allowedProducts.filter((p) => orderProductIds.has(p.id));
      }
    }

    return allowedProducts.filter(
      (p) =>
        formatProductId(p.id).toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (categoryLabels[p.category] ?? p.category).toLowerCase().includes(q) ||
        p.defaultQty.toString().includes(q) ||
        p.unit.toLowerCase().includes(q) ||
        p.price.toString().includes(q) ||
        p.price.toLocaleString("en-PH", { minimumFractionDigits: 2 }).includes(q)
    );
  }, [allowedProducts, search, orders]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, filtered.length);

  const handleSaveItem = async (data: ItemFormData) => {
    const qty = parseFloat(data.defaultQty);
    const priceVal = parseFloat(data.price);
    if (!data.name.trim() || isNaN(qty) || qty <= 0 || isNaN(priceVal) || priceVal < 0) return;

    const payload = {
      name: data.name.trim(),
      defaultQty: qty,
      unit: data.unit.trim(),
      category: data.category,
      price: priceVal,
    };

    if (editingItem) {
      await updateWeeklyProduct(editingItem.id, payload, selectedWeek.weekLabel);
    } else {
      await addWeeklyProduct(payload, selectedWeek.weekLabel);
    }
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm("Are you sure you want to delete this product from the weekly catalog?")) {
      await removeWeeklyProduct(id, selectedWeek.weekLabel);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <WeekSelector selectedOffset={weekOffset} onChange={setWeekOffset} />
        <button
          onClick={() => printCatalog(selectedWeek.weekLabel, filtered)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 self-start sm:self-auto shadow-sm"
        >
          <Printer className="h-4 w-4" />
          Print / Download PDF
        </button>
      </div>

      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-slate-800">Weekly Product Catalog</h2>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search products..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 sm:px-5">Orders</th>
                <th className="px-4 py-3 sm:px-5">Item</th>
                <th className="px-4 py-3 sm:px-5">Category</th>
                <th className="px-4 py-3 sm:px-5">Default Qty</th>
                <th className="px-4 py-3 sm:px-5">Unit</th>
                <th className="px-4 py-3 sm:px-5">Price</th>
                <th className="px-4 py-3 text-right sm:px-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">
                    No products found in catalog.
                  </td>
                </tr>
              ) : (
                paged.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                    <td className="px-4 py-3 sm:px-5">
                      {(() => {
                        const productOrders = orders?.filter(o => o.items.some(i => i.productId === item.id)) || [];
                        if (productOrders.length === 0) {
                          return <span className="text-xs text-slate-400 italic">No Orders</span>;
                        }
                        return (
                          <div className="flex flex-col gap-1.5">
                            {productOrders.map(o => (
                              <div key={o.id} className="inline-flex items-center gap-2">
                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${statusStyles[o.status as OrderStatus] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
                                  {o.status}
                                </span>
                                <span className="font-semibold text-slate-500 text-[11px]">ID: {o.id}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 sm:px-5">{item.name}</td>
                    <td className="px-4 py-3 text-slate-600 sm:px-5">
                      {categoryLabels[item.category] ?? item.category}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 sm:px-5">
                      {item.defaultQty}
                    </td>
                    <td className="px-4 py-3 text-slate-600 sm:px-5">{item.unit}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 sm:px-5">
                      ₱{item.price.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 sm:px-5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setModalOpen(true);
                          }}
                          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                          aria-label={`Edit ${item.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
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
            Showing {rangeStart} to {rangeEnd} of {filtered.length} products
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
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

      <ItemFormModal
        open={modalOpen}
        editing={editingItem}
        allowedCategories={user?.role === "admin" ? user.categories : undefined}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        disablePriceEdit={hasCompletedOrders}
      />
    </div>
  );
}
