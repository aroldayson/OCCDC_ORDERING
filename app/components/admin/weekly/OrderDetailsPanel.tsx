"use client";

import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Eye,
  Filter,
  Pencil,
  Plus,
  Printer,
  Trash2,
  User,
  Check,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { deleteOrder, updateOrder, updateOrderStatus } from "../../order/orderStorage";
import { orderRoleColors, orderRoleLabels } from "../../order/roles";
import { printOrderForm } from "../printOrder";
import type { OrderRole } from "../../order/roles";
import type {
  OrderStatus,
  OrderItem,
  WeeklyOrderRecord,
} from "../../order/types";
import { formatOrderDate, getCategoryDisplayFromItem } from "./utils";
import AddOrderItemModal from "./AddOrderItemModal";

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-blue-100 text-blue-700",
  processing: "bg-violet-100 text-violet-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const PREVIEW_COUNT = 5;

function isOrderLocked(order: WeeklyOrderRecord) {
  return order.status === "completed" || order.status === "cancelled";
}

async function updateOrderItemQty(
  order: WeeklyOrderRecord,
  productId: string,
  newQty: number,
  onUpdated: () => void,
  isWednesday: boolean,
  isPastWeek: boolean,
) {
  if (isWednesday || isPastWeek) {
    alert(
      "Order modification is disabled for this view. Please select a current weekday if you need to make changes.",
    );
    return;
  }
  if (order.status === "completed") {
    alert("Order modification is disabled for completed orders.");
    return;
  }
  if (newQty <= 0) {
    alert(
      "Quantity must be greater than zero. If you want to remove this item, click the delete button.",
    );
    return;
  }
  const updatedItems = order.items.map((item) =>
    item.productId === productId ? { ...item, qty: newQty } : item,
  );
  const updatedTotalPrice = updatedItems.reduce(
    (sum, item) =>
      sum + (item.deleted ? 0 : (item.qty || 0) * (item.price || 0)),
    0,
  );
  const activeItemCount = updatedItems.filter((item) => !item.deleted).length;
  await updateOrder({
    ...order,
    items: updatedItems,
    itemCount: activeItemCount,
    totalPrice: updatedTotalPrice,
  });
  onUpdated();
}

async function deleteOrderItem(
  order: WeeklyOrderRecord,
  productId: string,
  onUpdated: () => void,
  isWednesday: boolean,
  isPastWeek: boolean,
) {
  if (isWednesday || isPastWeek) {
    alert(
      "Order modification is disabled for this view. Please select a current weekday if you need to make changes.",
    );
    return;
  }
  if (order.status === "completed") {
    alert("Order modification is disabled for completed orders.");
    return;
  }

  const targetItem = order.items.find((item) => item.productId === productId);
  if (!targetItem) return;
  if (targetItem.deleted) {
    alert("This item is already marked as deleted.");
    return;
  }

  const activeItemsAfterDelete = order.items.filter(
    (item) =>
      item.productId !== productId &&
      !item.deleted &&
      !item.productId.startsWith("delivery-fee-"),
  );

  const willCancelOrder = activeItemsAfterDelete.length === 0;
  const confirmMessage = willCancelOrder
    ? "Mark this item as deleted? Since this is the last active item, the order will be automatically cancelled."
    : "Mark this item as deleted? It will stay on the order record for reference.";

  if (!confirm(confirmMessage)) return;

  const deletedAt = new Date().toISOString();
  const nextItems = order.items.map((item) =>
    item.productId === productId
      ? { ...item, deleted: true as const, deletedAt }
      : item,
  );

  const updatedTotalPrice = nextItems.reduce(
    (sum, item) =>
      sum + (item.deleted ? 0 : (item.qty || 0) * (item.price || 0)),
    0,
  );
  const activeItemCount = nextItems.filter((item) => !item.deleted).length;

  await updateOrder({
    ...order,
    status: willCancelOrder ? ("cancelled" as const) : order.status,
    cancelledAt: willCancelOrder ? deletedAt : order.cancelledAt,
    items: nextItems,
    itemCount: activeItemCount,
    totalPrice: updatedTotalPrice,
  });

  onUpdated();
}

function CategorySummary({
  orders,
  categories,
  selectedCategory,
  onSelectCategory,
}: {
  orders: WeeklyOrderRecord[];
  categories: OrderRole[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}) {
  const summary = categories.map((category) => {
    const items = orders.flatMap((o) =>
      o.items.filter((i) => i.category === category && !i.deleted),
    );
    const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
    const itemCount = items.length;
    return { category, itemCount, totalQty };
  });

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-5">
      {summary.map(({ category, itemCount, totalQty }) => {
        const isSelected = selectedCategory === category;
        return (
          <button
            key={category}
            type="button"
            onClick={() =>
              onSelectCategory(isSelected ? "all" : category)
            }
            className={`flex min-h-[88px] flex-col justify-between rounded-lg border-2 p-3 text-center transition ${orderRoleColors[category]} ${isSelected ? "ring-2 ring-blue-400 ring-offset-1" : "hover:opacity-90"}`}
          >
            <div>
              <p className="text-[11px] font-semibold uppercase leading-snug break-words sm:text-xs">
                {orderRoleLabels[category]}
              </p>
              <p className="mt-2 text-xl font-bold sm:text-lg">{totalQty}</p>
              <p className="text-[11px] text-slate-600 sm:text-xs">
                {itemCount} item{itemCount !== 1 ? "s" : ""}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function OrderItemsTable({
  order,
  expanded,
  onToggleAll,
  onUpdated,
  isWednesday = false,
  isPastWeek = false,
}: {
  order: WeeklyOrderRecord;
  expanded: boolean;
  onToggleAll: () => void;
  onUpdated: () => void;
  isWednesday?: boolean;
  isPastWeek?: boolean;
}) {
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(0);

  const items = order.items;
  const shown = expanded ? items : items.slice(0, PREVIEW_COUNT);

  async function handleUpdateQty(productId: string, newQty: number) {
    await updateOrderItemQty(
      order,
      productId,
      newQty,
      onUpdated,
      isWednesday,
      isPastWeek,
    );
  }

  async function handleDeleteItem(productId: string) {
    await deleteOrderItem(
      order,
      productId,
      onUpdated,
      isWednesday,
      isPastWeek,
    );
  }

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-slate-100">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <p className="text-xs font-semibold text-slate-600">
          Order Items ({items.length})
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-4 py-2.5">Product</th>
              <th className="px-4 py-2.5">Category</th>
              <th className="px-4 py-2.5">Quantity</th>
              <th className="px-4 py-2.5">Unit</th>
              <th className="px-4 py-2.5 text-right">Price</th>
              <th className="px-4 py-2.5 text-right">Subtotal</th>
              <th className="px-4 py-2.5 text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((item) => {
              const isEditing = editingProductId === item.productId;
              const isDeleted = item.deleted === true;
              const isUnpriced =
                !isDeleted && (!item.price || item.price === 0);
              return (
                <tr
                  key={item.productId}
                  className={`border-b border-slate-50 last:border-0 ${isDeleted ? "bg-red-50/40 ring-1 ring-inset ring-red-200" : ""}`}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <p
                        className={`font-medium ${isDeleted
                            ? "text-red-600 line-through decoration-red-500 decoration-2"
                            : isUnpriced
                              ? "text-blue-600 underline decoration-blue-500 decoration-2"
                              : "text-slate-800"
                          }`}
                      >
                        {item.name}
                      </p>
                      {isDeleted && (
                        <span className="text-[9px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded border border-red-600 uppercase tracking-wider">
                          Deleted
                        </span>
                      )}
                      {isUnpriced && (
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                          No Price
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {getCategoryDisplayFromItem(item)}
                  </td>
                  <td
                    className={`px-4 py-2.5 font-medium ${isDeleted || isUnpriced ? "text-slate-400" : "text-slate-800"}`}
                  >
                    {isEditing ? (
                      <input
                        type="number"
                        value={editQty}
                        onChange={(e) =>
                          setEditQty(parseFloat(e.target.value) || 0)
                        }
                        step="any"
                        min="0.01"
                        className="w-20 rounded border border-slate-300 px-1.5 py-0.5 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                      />
                    ) : (
                      item.qty
                    )}
                  </td>
                  <td
                    className={`px-4 py-2.5 ${isDeleted || isUnpriced ? "text-slate-400" : "text-slate-600"}`}
                  >
                    {item.unit}
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right font-semibold ${isDeleted ? "text-red-400 line-through" : isUnpriced ? "text-blue-500" : "text-slate-700"}`}
                  >
                    ₱
                    {(item.price || 0).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right font-bold ${isDeleted ? "text-red-400 line-through" : isUnpriced ? "text-slate-400" : "text-emerald-700"}`}
                  >
                    ₱
                    {((item.qty || 0) * (item.price || 0)).toLocaleString(
                      "en-PH",
                      { minimumFractionDigits: 2 },
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {isEditing ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            handleUpdateQty(item.productId, editQty);
                            setEditingProductId(null);
                          }}
                          className="rounded p-1 text-emerald-600 hover:bg-emerald-50 transition"
                          title="Save quantity"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingProductId(null)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 transition"
                          title="Cancel editing"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (isWednesday || isDeleted || isOrderLocked(order)) return;
                            setEditingProductId(item.productId);
                            setEditQty(item.qty);
                          }}
                          disabled={isWednesday || isDeleted || isOrderLocked(order)}
                          aria-disabled={isWednesday || isDeleted || isOrderLocked(order)}
                          className={`rounded p-1 text-blue-600 transition ${isWednesday || isDeleted || isOrderLocked(order) ? "cursor-not-allowed opacity-40" : "hover:bg-blue-50"}`}
                          title={
                            isDeleted
                              ? "Item deleted"
                              : isWednesday
                                ? "Disabled on Wednesday"
                                : "Edit quantity"
                          }
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (isWednesday || isDeleted || isOrderLocked(order)) return;
                            handleDeleteItem(item.productId);
                          }}
                          disabled={isWednesday || isDeleted || isOrderLocked(order)}
                          aria-disabled={isWednesday || isDeleted || isOrderLocked(order)}
                          className={`rounded p-1 text-red-500 transition ${isWednesday || isDeleted || isOrderLocked(order) ? "cursor-not-allowed opacity-40" : "hover:bg-red-50"}`}
                          title={
                            isDeleted
                              ? "Item already deleted"
                              : isWednesday
                                ? "Disabled on Wednesday"
                                : "Mark item as deleted"
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {items.length > PREVIEW_COUNT && (
        <div className="border-t border-slate-100 px-4 py-2.5 text-center">
          <button
            onClick={onToggleAll}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {expanded ? "Show Less" : `Show All (${items.length})`}
          </button>
        </div>
      )}
    </div>
  );
}

type FlatOrderItem = {
  order: WeeklyOrderRecord;
  item: OrderItem;
};

type OrderSummaryContext = {
  week: string;
  school?: string;
  category?: string;
  orderId?: string;
};

function OrderItemRow({
  order,
  item,
  onUpdated,
  isWednesday,
  isPastWeek,
  onGoToOrderSummary,
  defaultOpen = false,
  isHighlighted = false,
}: {
  order: WeeklyOrderRecord;
  item: OrderItem;
  onUpdated: () => void;
  isWednesday: boolean;
  isPastWeek: boolean;
  onGoToOrderSummary?: (context: OrderSummaryContext) => void;
  defaultOpen?: boolean;
  isHighlighted?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [editing, setEditing] = useState(false);
  const [editQty, setEditQty] = useState(item.qty);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  const isDeleted = item.deleted === true;
  const isUnpriced = !isDeleted && (!item.price || item.price === 0);
  const subtotal = (item.qty || 0) * (item.price || 0);

  return (
    <div
      data-process-order-id={order.id}
      className={`overflow-hidden rounded-xl border bg-white ${
        isHighlighted
          ? "border-amber-300 bg-amber-50/90 ring-2 ring-inset ring-amber-300 shadow-xs"
          : isDeleted
            ? "border-2 border-red-300 bg-red-50/40 ring-2 ring-inset ring-red-200"
            : "border-slate-200"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full min-w-0 items-center gap-2 px-3 py-3 text-left sm:gap-3 sm:px-4"
      >
        <span
          className={`min-w-0 flex-1 truncate text-sm font-semibold ${isDeleted ? "text-red-600 line-through" : isUnpriced ? "text-blue-600" : "text-slate-800"}`}
        >
          {item.name}
        </span>
        {isDeleted && (
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-white bg-red-500 px-1.5 py-0.5 rounded border border-red-600">
            Deleted
          </span>
        )}
        <span className="hidden shrink-0 text-xs text-slate-400 sm:inline">
          {item.qty} {item.unit}
        </span>
        <span className="shrink-0 text-[11px] text-slate-400 tabular-nums">
          {formatOrderDate(order.createdAt)}
        </span>
        <span
          className={`shrink-0 text-sm font-bold tabular-nums ${isDeleted ? "text-red-400 line-through" : isUnpriced ? "text-amber-600" : "text-emerald-700"}`}
        >
          ₱
          {subtotal.toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
        <span className="hidden shrink-0 text-[10px] font-medium text-slate-400 sm:inline">
          {order.id}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-slate-100 px-3 py-3 sm:px-4">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusStyles[order.status]}`}>
              {order.status}
            </span>
            <span>{order.id}</span>
            <span>·</span>
            <span>{formatOrderDate(order.createdAt)}</span>
            <span>·</span>
            <span>
              {item.qty} {item.unit}
            </span>
            <span>·</span>
            <span>
              ₱
              {(item.price || 0).toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}{" "}
              / {item.unit}
            </span>
            {isUnpriced && (
              <>
                <span>·</span>
                <span className="font-semibold text-amber-600">No price</span>
              </>
            )}
          </div>

          {editing ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                value={editQty}
                onChange={(e) => setEditQty(parseFloat(e.target.value) || 0)}
                step="any"
                min="0.01"
                className="w-24 rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              />
              <span className="text-xs text-slate-500">{item.unit}</span>
              <button
                type="button"
                onClick={async () => {
                  await updateOrderItemQty(
                    order,
                    item.productId,
                    editQty,
                    onUpdated,
                    isWednesday,
                    isPastWeek,
                  );
                  setEditing(false);
                }}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setEditQty(item.qty);
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {onGoToOrderSummary && (
                <button
                  type="button"
                  onClick={() =>
                    onGoToOrderSummary({
                      week: order.weekLabel,
                      school: order.clientName,
                      category: order.clientRole,
                      orderId: order.id,
                    })
                  }
                  className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                  title="View in Order Summary"
                  aria-label={`View ${order.id} in Order Summary`}
                >
                  <ClipboardList className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (isWednesday || isDeleted || isOrderLocked(order)) return;
                  setEditQty(item.qty);
                  setEditing(true);
                }}
                disabled={isWednesday || isDeleted || isPastWeek || isOrderLocked(order)}
                className={`rounded-lg p-2 text-blue-600 ${isWednesday || isDeleted || isPastWeek || isOrderLocked(order) ? "cursor-not-allowed opacity-40" : "hover:bg-blue-50"}`}
                aria-label="Edit quantity"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  deleteOrderItem(
                    order,
                    item.productId,
                    onUpdated,
                    isWednesday,
                    isPastWeek,
                  )
                }
                disabled={isWednesday || isDeleted || isPastWeek || isOrderLocked(order)}
                className={`rounded-lg p-2 text-red-500 ${isWednesday || isDeleted || isPastWeek || isOrderLocked(order) ? "cursor-not-allowed opacity-40" : "hover:bg-red-50"}`}
                aria-label={isDeleted ? "Item already deleted" : "Mark item as deleted"}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryOrderItemsList({
  items,
  onUpdated,
  isWednesday,
  isPastWeek,
  weekLabel,
  categoryLabel,
  onGoToOrderSummary,
  focusOrderId,
}: {
  items: FlatOrderItem[];
  onUpdated: () => void;
  isWednesday: boolean;
  isPastWeek: boolean;
  weekLabel?: string;
  categoryLabel: string;
  onGoToOrderSummary?: (context: OrderSummaryContext) => void;
  focusOrderId?: string;
}) {
  const totalQty = items.reduce((sum, { item }) => sum + (item.deleted ? 0 : item.qty), 0);
  const totalPrice = items.reduce(
    (sum, { item }) => sum + (item.deleted ? 0 : (item.qty || 0) * (item.price || 0)),
    0,
  );

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        No items in {categoryLabel} for {weekLabel ?? "this week"}.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <span>
          {items.length} item{items.length !== 1 ? "s" : ""} · {totalQty} total qty
        </span>
        <span className="font-bold text-emerald-700">
          ₱
          {totalPrice.toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
      {items.map(({ order, item }) => (
        <OrderItemRow
          key={`${order.id}-${item.productId}`}
          order={order}
          item={item}
          onUpdated={onUpdated}
          isWednesday={isWednesday}
          isPastWeek={isPastWeek}
          onGoToOrderSummary={onGoToOrderSummary}
          defaultOpen={focusOrderId === order.id}
          isHighlighted={focusOrderId === order.id}
        />
      ))}
    </div>
  );
}

type OrderAccordionProps = {
  order: WeeklyOrderRecord;
  defaultOpen?: boolean;
  isHighlighted?: boolean;
  onUpdated: () => void;
  onView: (order: WeeklyOrderRecord) => void;
  onGoToOrderSummary?: (context: OrderSummaryContext) => void;
  isWednesday?: boolean;
  isPastWeek?: boolean;
};

function OrderAccordion({
  order,
  defaultOpen = false,
  isHighlighted = false,
  onUpdated,
  onView,
  onGoToOrderSummary,
  isWednesday = false,
  isPastWeek = false,
}: OrderAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [itemsExpanded, setItemsExpanded] = useState(false);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  async function handleDelete() {
    if (isWednesday) {
      alert(
        "Weekly processing pause is active. Order deletions are disabled on Wednesday.",
      );
      return;
    }

    if (order.status === "cancelled") {
      if (confirm(`Permanently delete cancelled order ${order.id}?`)) {
        await deleteOrder(order.id);
        onUpdated();
      }
      return;
    }

    if (
      confirm(
        `Cancel order ${order.id}? The status will change to Cancelled and it will appear in Pricing Update.`,
      )
    ) {
      await updateOrderStatus(order.id, "cancelled");
      onUpdated();
    }
  }

  const hasUnpriced = order.items.some((i) => !i.price || i.price === 0);
  const priceClass = hasUnpriced ? "text-amber-600" : "text-emerald-700";

  return (
    <div
      data-process-order-id={order.id}
      className={`overflow-hidden rounded-xl border bg-white ${
        isHighlighted
          ? "border-amber-300 bg-amber-50/90 ring-2 ring-inset ring-amber-300 shadow-xs"
          : order.status === "cancelled"
            ? "border-2 border-red-300 bg-red-50/40 ring-2 ring-inset ring-red-200"
            : "border-slate-200"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full min-w-0 items-center gap-2 px-3 py-3 text-left sm:gap-3 sm:px-4 sm:py-3.5"
      >
        <span
          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${orderRoleColors[order.clientRole] || "bg-slate-100 text-slate-700"}`}
        >
          {orderRoleLabels[order.clientRole] || order.clientRole}
        </span>
        <span
          className={`min-w-0 shrink truncate text-sm font-semibold sm:max-w-none ${order.status === "cancelled" ? "text-red-600 line-through" : "text-slate-800"}`}
        >
          {order.id}
        </span>
        <span className="hidden shrink-0 text-slate-300 sm:inline">·</span>
        <span
          className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize sm:inline-flex ${statusStyles[order.status]}`}
        >
          {order.status}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs text-slate-500 sm:hidden">
          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
        </span>
        <span className={`shrink-0 text-sm font-bold tabular-nums ${priceClass}`}>
          ₱
          {(order.totalPrice || 0).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
        {hasUnpriced && (
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-amber-400"
            title="Waiting for supplier pricing"
          />
        )}
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 sm:px-4">
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize sm:hidden ${statusStyles[order.status]}`}>
                {order.status}
              </span>
              <span>{formatOrderDate(order.createdAt)}</span>
              <span>·</span>
              <span>
                {order.items.length} item{order.items.length !== 1 ? "s" : ""}
              </span>
              {hasUnpriced && (
                <>
                  <span>·</span>
                  <span className="font-semibold text-amber-600">Waiting for pricing</span>
                </>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {onGoToOrderSummary && (
                <button
                  type="button"
                  onClick={() =>
                    onGoToOrderSummary({
                      week: order.weekLabel,
                      school: order.clientName,
                      category: order.clientRole,
                      orderId: order.id,
                    })
                  }
                  className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                  title="View in Order Summary"
                  aria-label={`View ${order.id} in Order Summary`}
                >
                  <ClipboardList className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onView(order)}
                className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                aria-label="View order"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => printOrderForm(order)}
                className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                aria-label="Print order"
              >
                <Printer className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onView(order)}
                disabled={isWednesday || isPastWeek || isOrderLocked(order)}
                aria-disabled={isWednesday || isPastWeek || isOrderLocked(order)}
                className={`rounded-lg p-2 text-blue-600 ${isWednesday || isPastWeek || isOrderLocked(order) ? "cursor-not-allowed opacity-60" : "hover:bg-blue-50"}`}
                aria-label="Edit order"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isWednesday || isPastWeek || isOrderLocked(order)}
                aria-disabled={isWednesday || isPastWeek || isOrderLocked(order)}
                className={`rounded-lg p-2 text-red-500 ${isWednesday || isPastWeek || isOrderLocked(order) ? "cursor-not-allowed opacity-60" : "hover:bg-red-50"}`}
                aria-label={order.status === "cancelled" ? "Delete cancelled order" : "Cancel order"}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="px-3 pb-4 pt-2 sm:px-4">
            <OrderItemsTable
              order={order}
              expanded={itemsExpanded}
              onToggleAll={() => setItemsExpanded((v) => !v)}
              onUpdated={onUpdated}
              isWednesday={isWednesday}
              isPastWeek={isPastWeek}
            />
          </div>
        </div>
      )}
    </div>
  );
}

type OrderDetailsPanelProps = {
  clientName: string | null;
  categories: OrderRole[];
  orders: WeeklyOrderRecord[];
  categoryFilter: string;
  onUpdated: () => void;
  onAddOrder: () => void;
  onViewSummary: () => void;
  onViewOrder: (order: WeeklyOrderRecord) => void;
  onGoToOrderSummary?: (context: OrderSummaryContext) => void;
  onBack?: () => void;
  weekLabel?: string;
  isWednesday?: boolean;
  isPastWeek?: boolean;
  focusOrderId?: string;
};

export default function OrderDetailsPanel({
  clientName,
  categories,
  orders,
  categoryFilter,
  onUpdated,
  onAddOrder,
  onViewSummary,
  onViewOrder,
  onGoToOrderSummary,
  onBack,
  weekLabel,
  isWednesday = false,
  isPastWeek = false,
  focusOrderId,
}: OrderDetailsPanelProps) {
  const [addItemCategory, setAddItemCategory] = useState<OrderRole | null>(
    null,
  );
  const [panelCategory, setPanelCategory] = useState<string>(
    categoryFilter !== "all" ? categoryFilter : "all",
  );

  useEffect(() => {
    if (categoryFilter !== "all") {
      setPanelCategory(categoryFilter);
    }
  }, [categoryFilter]);

  useEffect(() => {
    if (!focusOrderId) return;
    const focusOrder = orders.find((o) => o.id === focusOrderId);
    if (focusOrder) {
      setPanelCategory(focusOrder.clientRole);
    }
    requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(
          `[data-process-order-id="${CSS.escape(focusOrderId)}"]`,
        )
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [focusOrderId, orders]);

  const categoryOptions = useMemo(() => {
    const seen = new Set<OrderRole>();
    for (const order of orders) {
      if (order.clientRole) seen.add(order.clientRole);
    }
    return categories.filter((cat) => seen.has(cat));
  }, [orders, categories]);

  const filteredCategoryItems = useMemo(() => {
    if (panelCategory === "all") return [];
    return orders
      .filter((o) => o.clientRole === panelCategory)
      .flatMap((order) =>
        order.items.map((item) => ({ order, item })),
      )
      .sort((a, b) => {
        const nameCompare = a.item.name.localeCompare(b.item.name);
        if (nameCompare !== 0) return nameCompare;
        return a.order.id.localeCompare(b.order.id);
      });
  }, [orders, panelCategory]);

  const displayOrders = useMemo(() => {
    if (panelCategory === "all") return orders;
    return orders.filter((o) => o.clientRole === panelCategory);
  }, [orders, panelCategory]);

  if (!clientName) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">Select a client to view orders</p>
      </div>
    );
  }

  async function handleAddItem(
    productName: string,
    qty: number,
    unit: string,
    price: number,
    orderId: string,
  ) {
    if (!addItemCategory) return;
    const catOrder = orders.find((o) => o.id === orderId);
    if (!catOrder) return;

    const slug =
      productName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "item";
    const productId = `${addItemCategory}-${slug}-${Date.now()}`;

    const newItem: OrderItem = {
      productId,
      name: productName,
      qty,
      unit,
      price,
      category: addItemCategory,
    };

    const updatedItems = [...catOrder.items, newItem];
    const totalPrice = updatedItems.reduce(
      (sum, it) => sum + it.qty * it.price,
      0,
    );
    const updatedOrder = {
      ...catOrder,
      items: updatedItems,
      itemCount: updatedItems.length,
      totalPrice,
    };

    await updateOrder(updatedOrder);
    onUpdated();
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex shrink-0 flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
              aria-label="Back to schools list"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 break-words leading-snug">{clientName}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${orderRoleColors[cat]}`}
                >
                  {orderRoleLabels[cat]}
                </span>
              ))}
              <span className="text-xs text-slate-500">
                {orders.length} order{orders.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <button
            onClick={onViewSummary}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:py-1.5"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="truncate">View Summary</span>
          </button>
          <button
            onClick={onAddOrder}
            disabled={isWednesday || isPastWeek}
            aria-disabled={isWednesday || isPastWeek}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white sm:py-1.5 ${isWednesday || isPastWeek ? "bg-slate-400 cursor-not-allowed opacity-70" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            <Plus className="h-4 w-4" />
            Add Order
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
        {(isWednesday || isPastWeek) && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {isWednesday
              ? "Wednesday processing pause: order edits and deletions are disabled until the next business day."
              : "Past week view only: order edits and deletions are disabled for previous weeks."}
          </div>
        )}
        {orders.length === 0 ? (
          <p className="text-center text-sm text-slate-500">
            No orders for this client.
          </p>
        ) : (
          <>
            <CategorySummary
              orders={orders}
              categories={categories}
              selectedCategory={panelCategory}
              onSelectCategory={setPanelCategory}
            />

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
              <Filter className="h-4 w-4 shrink-0 text-slate-400" />
              <label htmlFor="panel-category-filter" className="sr-only">
                Filter by category
              </label>
              <select
                id="panel-category-filter"
                value={panelCategory}
                onChange={(e) => setPanelCategory(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none"
              >
                <option value="all">All categories — by order</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {orderRoleLabels[cat]} — per item
                  </option>
                ))}
              </select>
            </div>

            {panelCategory !== "all" ? (
              <CategoryOrderItemsList
                items={filteredCategoryItems}
                onUpdated={onUpdated}
                isWednesday={isWednesday}
                isPastWeek={isPastWeek}
                weekLabel={weekLabel}
                categoryLabel={orderRoleLabels[panelCategory as OrderRole] ?? panelCategory}
                onGoToOrderSummary={onGoToOrderSummary}
                focusOrderId={focusOrderId}
              />
            ) : (
              <div className="space-y-3">
                {displayOrders.map((order) => (
                  <OrderAccordion
                    key={order.id + "-" + categoryFilter}
                    order={order}
                    defaultOpen={
                      focusOrderId === order.id ||
                      (categoryFilter !== "all" &&
                        order.clientRole === categoryFilter)
                    }
                    isHighlighted={focusOrderId === order.id}
                    onUpdated={onUpdated}
                    onView={onViewOrder}
                    onGoToOrderSummary={onGoToOrderSummary}
                    isWednesday={isWednesday}
                    isPastWeek={isPastWeek}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {addItemCategory !== null && (
        <AddOrderItemModal
          key={addItemCategory}
          open={addItemCategory !== null}
          category={addItemCategory}
          weekLabel={weekLabel}
          orders={orders.filter((o) => o.clientRole === addItemCategory)}
          onClose={() => setAddItemCategory(null)}
          onAdd={handleAddItem}
        />
      )}
    </div>
  );
}
