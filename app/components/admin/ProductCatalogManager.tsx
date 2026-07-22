"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  Printer,
  FileSpreadsheet,
  ArrowLeft,
  ClipboardList,
  RotateCcw,
} from "lucide-react";
import {
  getWeeklyProducts,
  addWeeklyProduct,
  updateWeeklyProduct,
  removeWeeklyProduct,
} from "../order/weeklyProductStorage";
import type { WeeklyProduct } from "../order/products";
import ItemFormModal, { type ItemFormData } from "./weekly/ItemFormModal";
import WeekSelector from "./weekly/WeekSelector";
import {
  getJuneAugustWeeks,
  getCurrentOrNextPeriodWeek,
  ALL_WEEKS_VALUE,
} from "../order/weekUtils";
import { useAuth } from "@/app/providers/AuthProvider";
import { isCategoryAllowed } from "../order/roles";

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
  return `PRD-${Math.abs(hash).toString().slice(0, 4).padStart(4, "0")}`;
}

function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getOrderItemDate(order: WeeklyOrderRecord) {
  return formatOrderDate(order.cancelledAt || order.createdAt);
}

type CatalogRowGroup = "active" | "cancelled" | "catalog";

type CatalogRow = {
  id: string;
  product: WeeklyProduct;
  order?: WeeklyOrderRecord;
  schoolName: string;
  groupType: CatalogRowGroup;
};

const groupTypeSortOrder: Record<CatalogRowGroup, number> = {
  active: 0,
  cancelled: 1,
  catalog: 2,
};

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
import type { OrderItem, OrderStatus, WeeklyOrderRecord } from "../order/types";
import {
  printCatalog,
  printCatalogForSchool,
  exportCatalogExcel,
} from "./printOrder";

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-violet-50 text-violet-700 border-violet-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function ProductCatalogManager({
  orders,
  onBackToOrders,
}: {
  orders?: WeeklyOrderRecord[];
  onBackToOrders?: (context: {
    week: string;
    school?: string;
    category?: string;
    orderId?: string;
  }) => void;
}) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const weekFromUrl = searchParams?.get("week");
  const schoolFromUrl = searchParams?.get("school");
  const categoryFromUrl = searchParams?.get("category");
  const orderIdFromUrl = searchParams?.get("orderId");
  const lastPricingFocusKeyRef = useRef<string | null>(null);

  const [selectedWeekLabel, setSelectedWeekLabel] = useState<string>(() => {
    if (weekFromUrl) return weekFromUrl;
    const allWeeks = getJuneAugustWeeks();
    const periodWeek = getCurrentOrNextPeriodWeek();
    if (periodWeek !== null) return allWeeks[periodWeek - 1].weekLabel;
    return allWeeks[allWeeks.length - 1].weekLabel;
  });

  useEffect(() => {
    if (weekFromUrl) setSelectedWeekLabel(weekFromUrl);
  }, [weekFromUrl]);
  const [products, setProducts] = useState<WeeklyProduct[]>([]);
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<WeeklyProduct | null>(null);
  const [editingRow, setEditingRow] = useState<{
    product: WeeklyProduct;
    order?: WeeklyOrderRecord;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(),
  );

  const toggleCategory = (catGroupId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catGroupId)) next.delete(catGroupId);
      else next.add(catGroupId);
      return next;
    });
  };

  const handleDeleteMultiple = async () => {
    if (selectedIds.size === 0) return;
    if (
      confirm(
        `Are you sure you want to delete ${selectedIds.size} selected product(s) from the catalog?`,
      )
    ) {
      for (const id of selectedIds) {
        await removeWeeklyProduct(id, selectedWeekLabel);
      }
      setSelectedIds(new Set());
    }
  };

  const loadProducts = useCallback(() => {
    if (selectedWeekLabel === ALL_WEEKS_VALUE) {
      const periodWeek = getCurrentOrNextPeriodWeek();
      const fallbackLabel =
        periodWeek !== null
          ? getJuneAugustWeeks()[periodWeek - 1]?.weekLabel
          : getJuneAugustWeeks()[0]?.weekLabel;
      if (fallbackLabel) {
        getWeeklyProducts(fallbackLabel).then(setProducts);
      } else {
        setProducts([]);
      }
      return;
    }
    getWeeklyProducts(selectedWeekLabel).then(setProducts);
  }, [selectedWeekLabel]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const allowedProducts = useMemo(() => {
    if (!user) return products;
    return products.filter((p) =>
      isCategoryAllowed(p.category, user.categories),
    );
  }, [products, user]);

  const rowItems = useMemo(() => {
    const list: CatalogRow[] = [];

    const appendOrderItems = (
      order: WeeklyOrderRecord,
      groupType: CatalogRowGroup,
    ) => {
      let added = 0;
      for (const item of order.items) {
        if (item.productId.startsWith("delivery-fee-")) continue;
        if (groupType !== "cancelled" && item.deleted) continue;

        let product = allowedProducts.find((p) => p.id === item.productId);
        if (!product) {
          const isAllowed = isCategoryAllowed(
            item.category || order.clientRole,
            user?.categories,
          );
          if (isAllowed) {
            product = {
              id: item.productId,
              name: item.name,
              defaultQty: item.qty,
              unit: item.unit || "pc",
              price: item.price || 0,
              category: (item.category ||
                order.clientRole) as WeeklyProduct["category"],
            };
          }
        }

        if (product) {
          list.push({
            id: `${product.id}-${order.id}${groupType === "cancelled" ? "-cancelled" : ""}`,
            product: {
              ...product,
              defaultQty: item.qty,
              price:
                typeof item.price === "number" ? item.price : product.price,
            },
            order,
            schoolName: order.clientName,
            groupType,
          });
          added++;
        }
      }
      return added;
    };

    if (orders) {
      const weekOrders = filterOrdersForWeek(orders, selectedWeekLabel);
      for (const order of weekOrders) {
        if (order.status === "cancelled") continue;
        appendOrderItems(order, "active");
      }
      for (const order of weekOrders) {
        if (order.status !== "cancelled") continue;
        const added = appendOrderItems(order, "cancelled");
        if (added === 0) {
          list.push({
            id: `cancelled-empty-${order.id}`,
            product: {
              id: `cancelled-${order.id}`,
              name: "Order cancelled (no items on record)",
              defaultQty: 0,
              unit: "—",
              price: 0,
              category: order.clientRole,
            },
            order,
            schoolName: order.clientName,
            groupType: "cancelled",
          });
        }
      }
      for (const order of weekOrders) {
        if (order.status === "cancelled") continue;
        for (const item of order.items) {
          if (!item.deleted || item.productId.startsWith("delivery-fee-")) continue;

          let product = allowedProducts.find((p) => p.id === item.productId);
          if (!product) {
            const isAllowed = isCategoryAllowed(
              item.category || order.clientRole,
              user?.categories,
            );
            if (isAllowed) {
              product = {
                id: item.productId,
                name: item.name,
                defaultQty: item.qty,
                unit: item.unit || "pc",
                price: item.price || 0,
                category: (item.category ||
                  order.clientRole) as WeeklyProduct["category"],
              };
            }
          }

          if (product) {
            list.push({
              id: `${product.id}-${order.id}-cancelled-item`,
              product: {
                ...product,
                defaultQty: item.qty,
                price:
                  typeof item.price === "number" ? item.price : product.price,
              },
              order,
              schoolName: order.clientName,
              groupType: "cancelled",
            });
          }
        }
      }
    }

    list.sort((a, b) => {
      const typeDiff =
        groupTypeSortOrder[a.groupType] - groupTypeSortOrder[b.groupType];
      if (typeDiff !== 0) return typeDiff;
      const schoolDiff = a.schoolName.localeCompare(b.schoolName);
      if (schoolDiff !== 0) return schoolDiff;
      const catDiff = a.product.category.localeCompare(b.product.category);
      if (catDiff !== 0) return catDiff;
      return a.product.name.localeCompare(b.product.name);
    });
    return list;
  }, [allowedProducts, orders, selectedWeekLabel, user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rowItems;

    return rowItems.filter(
      (row) =>
        (row.groupType !== "catalog" &&
          row.schoolName.toLowerCase().includes(q)) ||
        (row.groupType === "cancelled" && "cancelled orders".includes(q)) ||
        row.order?.id.toLowerCase().includes(q) ||
        (row.order &&
          getOrderItemDate(row.order).toLowerCase().includes(q)) ||
        formatProductId(row.product.id).toLowerCase().includes(q) ||
        row.product.name.toLowerCase().includes(q) ||
        (categoryLabels[row.product.category] ?? row.product.category)
          .toLowerCase()
          .includes(q) ||
        row.product.defaultQty.toString().includes(q) ||
        row.product.unit.toLowerCase().includes(q) ||
        row.product.price.toString().includes(q) ||
        row.product.price
          .toLocaleString("en-PH", { minimumFractionDigits: 2 })
          .includes(q),
    );
  }, [rowItems, search]);

  useEffect(() => {
    if (!schoolFromUrl) return;

    const focusKey = `${selectedWeekLabel}|${schoolFromUrl}|${categoryFromUrl ?? ""}|${orderIdFromUrl ?? ""}`;
    if (lastPricingFocusKeyRef.current === focusKey) return;

    const groupId = `school-${schoolFromUrl}`;
    const activeRows = filtered.filter(
      (row) => row.schoolName === schoolFromUrl && row.groupType === "active",
    );
    const cancelledRows = filtered.filter(
      (row) => row.schoolName === schoolFromUrl && row.groupType === "cancelled",
    );
    const schoolRows = activeRows.length > 0 ? activeRows : cancelledRows;
    if (schoolRows.length === 0) return;

    lastPricingFocusKeyRef.current = focusKey;
    const focusGroupId =
      activeRows.length > 0 ? groupId : `cancelled-${schoolFromUrl}`;
    setExpandedGroups(new Set([focusGroupId]));

    if (categoryFromUrl) {
      const targetCatGroupId = `${focusGroupId}-${categoryFromUrl}`;
      const collapsed = new Set<string>();
      for (const row of schoolRows) {
        const catGroupId = `${focusGroupId}-${row.product.category}`;
        if (catGroupId !== targetCatGroupId) {
          collapsed.add(catGroupId);
        }
      }
      setCollapsedCategories(collapsed);
    }

    requestAnimationFrame(() => {
      const orderRow = orderIdFromUrl
        ? document.querySelector<HTMLElement>(
            `[data-pricing-order-id="${CSS.escape(orderIdFromUrl)}"]`,
          )
        : null;
      if (orderRow) {
        orderRow.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (categoryFromUrl) {
        const targetCatGroupId = `${focusGroupId}-${categoryFromUrl}`;
        document
          .getElementById(`pricing-cat-${encodeURIComponent(targetCatGroupId)}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }, [schoolFromUrl, categoryFromUrl, orderIdFromUrl, selectedWeekLabel, filtered]);

  const handleSaveItem = async (data: ItemFormData) => {
    const qty = parseFloat(data.defaultQty);
    const priceVal = parseFloat(data.price);
    if (
      !data.name.trim() ||
      isNaN(qty) ||
      qty <= 0 ||
      isNaN(priceVal) ||
      priceVal < 0
    )
      return;

    const payload = {
      name: data.name.trim(),
      defaultQty: qty,
      unit: data.unit.trim(),
      category: data.category,
      price: priceVal,
    };

    if (editingRow && editingRow.order) {
      const order = editingRow.order;
      const updatedItems = order.items.map((item) => {
        if (item.productId === editingRow.product.id && !item.deleted) {
          return {
            ...item,
            name: data.name.trim(),
            qty: qty,
            unit: data.unit.trim(),
            price: priceVal,
          };
        }
        return item;
      });

      const newTotal = updatedItems.reduce((sum, item) => {
        if (item.deleted) return sum;
        return sum + (item.qty * item.price);
      }, 0);

      const updatedOrder: WeeklyOrderRecord = {
        ...order,
        items: updatedItems,
        totalPrice: newTotal,
      };

      const { updateOrder } = await import("../order/orderStorage");
      await updateOrder(updatedOrder);

      setModalOpen(false);
      setEditingItem(null);
      setEditingRow(null);
      return;
    }

    if (editingItem) {
      await updateWeeklyProduct(editingItem.id, payload, selectedWeekLabel);
    } else {
      await addWeeklyProduct(payload, selectedWeekLabel);
    }
    setModalOpen(false);
    setEditingItem(null);
    setEditingRow(null);
  };

  const handleDeleteItem = async (productId: string, order?: WeeklyOrderRecord) => {
    if (order) {
      if (order.status === "cancelled") {
        const targetItem = order.items.find((item) => item.productId === productId);
        if (!targetItem || targetItem.deleted) return;

        if (
          !confirm(
            `Mark "${targetItem.name}" as deleted on cancelled order ${order.id}?`,
          )
        ) {
          return;
        }

        const deletedAt = new Date().toISOString();
        const updatedItems = order.items.map((item) =>
          item.productId === productId
            ? { ...item, deleted: true as const, deletedAt }
            : item,
        );

        const activeItems = updatedItems.filter(
          (item) =>
            !item.deleted && !item.productId.startsWith("delivery-fee-"),
        );

        if (activeItems.length === 0) {
          const { deleteOrder } = await import("../order/orderStorage");
          await deleteOrder(order.id);
          return;
        }

        const updatedOrder: WeeklyOrderRecord = {
          ...order,
          items: updatedItems,
          itemCount: activeItems.length,
          totalPrice: updatedItems.reduce(
            (sum, item) =>
              sum + (item.deleted ? 0 : (item.qty || 0) * (item.price || 0)),
            0,
          ),
        };

        const { updateOrder } = await import("../order/orderStorage");
        await updateOrder(updatedOrder);
        return;
      }

      const updatedItems = order.items.map((item) => {
        if (item.productId === productId) {
          return {
            ...item,
            deleted: true as const,
            deletedAt: new Date().toISOString(),
          };
        }
        return item;
      });

      const activeItems = updatedItems.filter(
        (item) =>
          !item.deleted && !item.productId.startsWith("delivery-fee-"),
      );
      const willCancelOrder = activeItems.length === 0;

      if (
        !confirm(
          willCancelOrder
            ? `Move this item to Cancelled Orders? This is the last active item — Order ${order.id} will be cancelled.`
            : `Move this item to Cancelled Orders?`,
        )
      ) {
        return;
      }

      const newTotal = updatedItems.reduce((sum, item) => {
        if (item.deleted) return sum;
        return sum + (item.qty || 0) * (item.price || 0);
      }, 0);

      const updatedOrder: WeeklyOrderRecord = {
        ...order,
        status: willCancelOrder ? "cancelled" : order.status,
        cancelledAt: willCancelOrder
          ? new Date().toISOString()
          : order.cancelledAt,
        items: updatedItems,
        itemCount: activeItems.length,
        totalPrice: newTotal,
      };

      const { updateOrder } = await import("../order/orderStorage");
      await updateOrder(updatedOrder);

      setExpandedGroups((prev) => {
        const next = new Set(prev);
        next.add(`cancelled-${order.clientName}`);
        return next;
      });
    } else {
      if (
        confirm(
          "Are you sure you want to delete this product from the weekly catalog?",
        )
      ) {
        await removeWeeklyProduct(productId, selectedWeekLabel);
      }
    }
  };

  const handleRestoreItem = async (
    productId: string,
    order: WeeklyOrderRecord,
  ) => {
    const targetItem = order.items.find((item) => item.productId === productId);
    if (!targetItem) return;

    if (
      !confirm(
        `Restore "${targetItem.name}" to active orders for ${order.clientName}?`,
      )
    ) {
      return;
    }

    const updatedItems: OrderItem[] = order.items.map((item) => {
      if (item.productId !== productId) return item;
      return {
        productId: item.productId,
        name: item.name,
        qty: item.qty,
        unit: item.unit,
        price: item.price,
        category: item.category,
      };
    });

    const activeItems = updatedItems.filter(
      (item) =>
        !item.deleted && !item.productId.startsWith("delivery-fee-"),
    );

    if (activeItems.length === 0) {
      alert("This order has no active items to restore.");
      return;
    }

    const newTotal = updatedItems.reduce((sum, item) => {
      if (item.deleted) return sum;
      return sum + (item.qty || 0) * (item.price || 0);
    }, 0);

    const reactivateOrder =
      order.status === "cancelled" && activeItems.length > 0;

    const updatedOrder: WeeklyOrderRecord = {
      ...order,
      status: reactivateOrder ? "pending" : order.status,
      cancelledAt: reactivateOrder ? undefined : order.cancelledAt,
      items: updatedItems,
      itemCount: updatedItems.length,
      totalPrice: newTotal,
    };

    const { updateOrder } = await import("../order/orderStorage");
    await updateOrder(updatedOrder);

    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.add(`school-${order.clientName}`);
      next.delete(`cancelled-${order.clientName}`);
      return next;
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {onBackToOrders && (
            <button
              type="button"
              onClick={() =>
                onBackToOrders({
                  week: selectedWeekLabel,
                  school: schoolFromUrl ?? undefined,
                  category: categoryFromUrl ?? undefined,
                  orderId: orderIdFromUrl ?? undefined,
                })
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Order Summary
            </button>
          )}
          <WeekSelector
            selectedWeekLabel={selectedWeekLabel}
            onChange={setSelectedWeekLabel}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteMultiple}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedIds.size})
            </button>
          )}
          <button
            onClick={() => printCatalog(selectedWeekLabel, filtered)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 self-start sm:self-auto shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Print / Download PDF
          </button>
          <button
            onClick={() => exportCatalogExcel(selectedWeekLabel, filtered)}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 self-start sm:self-auto shadow-sm"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </button>
        </div>
      </div>

      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-slate-800">
            Weekly Product Catalog
          </h2>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              placeholder="Search products..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 sm:px-5 w-10">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={
                      filtered.length > 0 &&
                      filtered.every((row) => selectedIds.has(row.product.id))
                    }
                    onChange={() => {
                      const newSelected = new Set(selectedIds);
                      const allSelected =
                        filtered.length > 0 &&
                        filtered.every((row) =>
                          selectedIds.has(row.product.id),
                        );
                      if (allSelected) {
                        filtered.forEach((row) =>
                          newSelected.delete(row.product.id),
                        );
                      } else {
                        filtered.forEach((row) =>
                          newSelected.add(row.product.id),
                        );
                      }
                      setSelectedIds(newSelected);
                    }}
                  />
                </th>
                <th className="px-4 py-3 sm:px-5">Item</th>
                <th className="px-4 py-3 sm:px-5">School Name</th>
                <th className="px-4 py-3 sm:px-5">Date Order Item</th>
                <th className="px-4 py-3 sm:px-5">Category</th>
                <th className="px-4 py-3 sm:px-5">Qty</th>
                <th className="px-4 py-3 sm:px-5">Unit</th>
                <th className="px-4 py-3 sm:px-5">Price</th>
                <th className="px-4 py-3 sm:px-5">Total Price</th>
                <th className="px-4 py-3 text-right sm:px-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    No order items found for this week.
                  </td>
                </tr>
              ) : (
                (() => {
                  const rows: React.ReactNode[] = [];
                  let currentGroupId: string | null = null;
                  let currentCategoryGroupId: string | null = null;
                  let currentSection: CatalogRowGroup | null = null;

                  filtered.forEach((row) => {
                    const groupId =
                      row.groupType === "catalog"
                        ? "catalog-defaults"
                        : row.groupType === "cancelled"
                          ? `cancelled-${row.schoolName}`
                          : `school-${row.schoolName}`;

                    if (row.groupType === "cancelled" && currentSection !== "cancelled") {
                      currentSection = "cancelled";
                      currentGroupId = null;
                      currentCategoryGroupId = null;
                      rows.push(
                        <tr
                          key="cancelled-section-header"
                          className="bg-red-50/80 border-y border-red-100"
                        >
                          <td
                            colSpan={10}
                            className="px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-red-700"
                          >
                            Cancelled Orders
                          </td>
                        </tr>,
                      );
                    } else if (
                      row.groupType === "catalog" &&
                      currentSection !== "catalog"
                    ) {
                      currentSection = "catalog";
                      currentGroupId = null;
                      currentCategoryGroupId = null;
                    } else if (row.groupType === "active") {
                      currentSection = "active";
                    }

                    const schoolOrders =
                      orders && row.groupType === "active"
                        ? filterOrdersForWeek(orders, selectedWeekLabel).filter(
                            (o) =>
                              o.clientName === row.schoolName &&
                              o.status !== "cancelled",
                          )
                        : [];

                    const cancelledSchoolOrders =
                      orders && row.groupType === "cancelled"
                        ? filterOrdersForWeek(orders, selectedWeekLabel).filter(
                            (o) =>
                              o.clientName === row.schoolName &&
                              o.status === "cancelled",
                          )
                        : [];

                    if (groupId !== currentGroupId) {
                      currentGroupId = groupId;
                      currentCategoryGroupId = null;
                      const schoolLabel =
                        row.groupType === "catalog"
                          ? "Catalog Defaults"
                          : row.schoolName;
                      const isExpanded = expandedGroups.has(groupId);
                      const headerClassName =
                        row.groupType === "cancelled"
                          ? "bg-red-50/50 hover:bg-red-50/80 transition-colors"
                          : "bg-slate-100/60 hover:bg-slate-100/90 transition-colors";

                      rows.push(
                        <tr key={`group-${groupId}`} className={headerClassName}>
                          <td
                            colSpan={9}
                            className="px-4 py-3 border-y border-slate-200 cursor-pointer"
                            onClick={() => toggleGroup(groupId)}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
                              )}
                              <span
                                className={`text-xs font-bold uppercase tracking-wide truncate ${
                                  row.groupType === "cancelled"
                                    ? "text-red-700"
                                    : "text-slate-700"
                                }`}
                              >
                                {schoolLabel}
                              </span>
                              {schoolOrders.length > 0 && (
                                <span className="font-semibold text-slate-500 text-[10px] shrink-0">
                                  {schoolOrders.length} Order
                                  {schoolOrders.length !== 1 ? "s" : ""}
                                </span>
                              )}
                              {cancelledSchoolOrders.length > 0 && (
                                <span className="font-semibold text-red-600 text-[10px] shrink-0">
                                  {cancelledSchoolOrders.length} Cancelled Order
                                  {cancelledSchoolOrders.length !== 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </td>
                          {row.groupType === "active" ? (
                            <td className="px-3 py-2 border-y border-slate-200 text-right w-16">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const schoolRows = filtered.filter(
                                    (r) =>
                                      r.groupType === "active" &&
                                      r.schoolName === row.schoolName,
                                  );
                                  printCatalogForSchool(
                                    selectedWeekLabel,
                                    row.schoolName,
                                    schoolRows,
                                  );
                                }}
                                title={`Print ${schoolLabel}`}
                                className="inline-flex items-center justify-center rounded-lg p-1.5 text-blue-600 hover:bg-blue-100 transition"
                              >
                                <Printer className="h-4 w-4" />
                              </button>
                            </td>
                          ) : (
                            <td className="border-y border-slate-200" />
                          )}
                        </tr>,
                      );
                    }

                    if (!expandedGroups.has(currentGroupId)) {
                      return;
                    }

                    // Render Category Sub-header if it changes within this school
                    const catGroupId = `${currentGroupId}-${row.product.category}`;
                    const isCatCollapsed = collapsedCategories.has(catGroupId);
                    if (catGroupId !== currentCategoryGroupId) {
                      currentCategoryGroupId = catGroupId;

                      rows.push(
                        <tr
                          key={`cat-header-${catGroupId}`}
                          id={`pricing-cat-${encodeURIComponent(catGroupId)}`}
                          className="bg-slate-50/30 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors select-none"
                          onClick={() => toggleCategory(catGroupId)}
                        >
                          <td
                            colSpan={10}
                            className="pl-8 pr-4 py-2 font-bold text-[10px] text-slate-500 uppercase tracking-wider bg-slate-50/20"
                          >
                            <div className="flex items-center gap-2">
                              {isCatCollapsed ? (
                                <ChevronRight className="h-3 w-3 text-slate-400" />
                              ) : (
                                <ChevronDown className="h-3 w-3 text-slate-400" />
                              )}
                              <span>
                                {categoryLabels[row.product.category] ??
                                  row.product.category}
                              </span>
                            </div>
                          </td>
                        </tr>,
                      );
                    }

                    if (isCatCollapsed) {
                      return; // Skip rendering items under this category if collapsed
                    }

                    const isOrderHighlighted =
                      !!orderIdFromUrl && row.order?.id === orderIdFromUrl;

                    rows.push(
                      <tr
                        key={row.id}
                        data-pricing-order-id={
                          isOrderHighlighted ? row.order!.id : undefined
                        }
                        className={`border-b border-slate-50 transition-colors ${
                          isOrderHighlighted
                            ? "bg-amber-50/90 ring-2 ring-inset ring-amber-300 hover:bg-amber-50"
                            : "hover:bg-slate-50/80"
                        }`}
                      >
                        <td className="px-4 py-3 sm:px-5">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={selectedIds.has(row.product.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedIds);
                              if (e.target.checked) {
                                newSelected.add(row.product.id);
                              } else {
                                newSelected.delete(row.product.id);
                              }
                              setSelectedIds(newSelected);
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 sm:px-5">
                          <div className="flex flex-col">
                            <span
                              className={`font-medium ${
                                !row.product.price || row.product.price === 0
                                  ? "text-red-600 underline decoration-red-500 decoration-2"
                                  : "text-slate-800"
                              }`}
                            >
                              {row.product.name}
                            </span>
                            {row.order && (
                              <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                                Order:{" "}
                                <span className="font-semibold text-slate-600">
                                  {row.order.id}
                                </span>
                                {row.groupType === "cancelled" ? (
                                  <>
                                    {" "}
                                    · {getOrderItemDate(row.order)} ·{" "}
                                    <span className="text-red-600">Cancelled</span>
                                  </>
                                ) : (
                                  <>
                                    {" "}
                                    (
                                    {row.order.status === "pending"
                                      ? "Pending Approval"
                                      : row.order.status}
                                    )
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                          {(!row.product.price || row.product.price === 0) && (
                            <span className="ml-2 text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 uppercase tracking-wider inline-block mt-1">
                              No Price
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 sm:px-5">
                          {row.groupType === "catalog" ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            <span className="font-medium text-slate-700">
                              {row.schoolName}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 sm:px-5 whitespace-nowrap">
                          {row.order ? (
                            <span>{getOrderItemDate(row.order)}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 sm:px-5">
                          {categoryLabels[row.product.category] ??
                            row.product.category}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800 sm:px-5">
                          {row.product.defaultQty}
                        </td>
                        <td className="px-4 py-3 text-slate-600 sm:px-5">
                          {row.product.unit}
                        </td>
                        <td
                          className={`px-4 py-3 font-semibold sm:px-5 ${
                            !row.product.price || row.product.price === 0
                              ? "text-red-500"
                              : "text-slate-800"
                          }`}
                        >
                          ₱
                          {row.product.price.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-3 font-semibold sm:px-5 text-slate-800">
                          ₱
                          {(
                            (row.product.defaultQty || 0) *
                            (row.product.price || 0)
                          ).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-3 sm:px-5">
                          <div className="flex items-center justify-end gap-1">
                            {row.order && onBackToOrders && (
                              <button
                                type="button"
                                onClick={() =>
                                  onBackToOrders({
                                    week: row.order!.weekLabel,
                                    school: row.order!.clientName,
                                    category: row.order!.clientRole,
                                    orderId: row.order!.id,
                                  })
                                }
                                className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                                title="Back to Order Summary"
                                aria-label={`Back to order ${row.order.id}`}
                              >
                                <ClipboardList className="h-4 w-4" />
                              </button>
                            )}
                            {row.groupType === "cancelled" && row.order && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRestoreItem(row.product.id, row.order!)
                                }
                                className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                                title={`Restore ${row.product.name} to active orders`}
                                aria-label={`Restore ${row.product.name}`}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                            )}
                            {row.groupType !== "cancelled" && (
                              <button
                                onClick={() => {
                                  setEditingRow({
                                    product: row.product,
                                    order: row.order,
                                  });
                                  setEditingItem(row.product);
                                  setModalOpen(true);
                                }}
                                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                                aria-label={`Edit ${row.product.name}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {row.groupType !== "cancelled" && (
                              <button
                                onClick={() =>
                                  handleDeleteItem(row.product.id, row.order)
                                }
                                disabled={
                                  !row.order &&
                                  (!row.product.price || row.product.price === 0)
                                }
                                title={
                                  row.order
                                    ? `Move ${row.product.name} to Cancelled Orders`
                                    : !row.product.price || row.product.price === 0
                                      ? "Set a price before deleting"
                                      : `Delete ${row.product.name}`
                                }
                                className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                aria-label={
                                  row.order
                                    ? `Move ${row.product.name} to Cancelled Orders`
                                    : `Delete ${row.product.name}`
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>,
                    );
                  });
                  return rows;
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ItemFormModal
        open={modalOpen}
        editing={editingItem}
        allowedCategories={user?.categories}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
          setEditingRow(null);
        }}
        onSave={handleSaveItem}
        disablePriceEdit={false}
      />
    </div>
  );
}
