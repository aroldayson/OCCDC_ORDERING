"use client";

import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Eye,
  Pencil,
  Plus,
  Printer,
  Trash2,
  User,
  Check,
  X,
} from "lucide-react";
import { useState } from "react";
import { deleteOrder, updateOrder } from "../../order/orderStorage";
import { removeWeeklyProduct } from "../../order/weeklyProductStorage";
// import { removeWeeklyProduct } from "../../order/weeklyProductStorage";
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

function CategorySummary({
  orders,
  categories,
  onAddItem,
}: {
  orders: WeeklyOrderRecord[];
  categories: OrderRole[];
  onAddItem: (category: OrderRole) => void;
}) {
  const summary = categories.map((category) => {
    const items = orders.flatMap((o) =>
      o.items.filter((i) => i.category === category),
    );
    const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
    const itemCount = items.length;
    return { category, itemCount, totalQty };
  });

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5">
      {summary.map(({ category, itemCount, totalQty }) => (
        <div
          key={category}
          className={`flex flex-col justify-between rounded-lg border-2 p-3 text-center ${orderRoleColors[category]}`}
        >
          <div>
            <p className="text-xs font-semibold uppercase">
              {orderRoleLabels[category]}
            </p>
            <p className="mt-2 text-lg font-bold">{totalQty}</p>
            <p className="text-xs text-slate-600">
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      ))}
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
    if (isWednesday || isPastWeek) {
      alert(
        "Order modification is disabled for this view. Please select a current weekday if you need to make changes.",
      );
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
      (sum, item) => sum + (item.qty || 0) * (item.price || 0),
      0,
    );
    const updatedOrder = {
      ...order,
      items: updatedItems,
      itemCount: updatedItems.length,
      totalPrice: updatedTotalPrice,
    };
    await updateOrder(updatedOrder);
    onUpdated();
  }

  async function handleDeleteItem(productId: string) {
    if (isWednesday || isPastWeek) {
      alert(
        "Order modification is disabled for this view. Please select a current weekday if you need to make changes.",
      );
      return;
    }
    const remainingItems = order.items.filter(
      (item) => item.productId !== productId,
    );
    const activeItems = remainingItems.filter(
      (item) => !item.deleted && !item.productId.startsWith("delivery-fee-"),
    );

    const willCancelOrder = activeItems.length === 0;
    const confirmMessage = willCancelOrder
      ? "Are you sure you want to remove this item from the order? Since this is the last item, the order will be automatically cancelled."
      : "Are you sure you want to remove this item from the order?";

    if (!confirm(confirmMessage)) {
      return;
    }

    const updatedTotalPrice = remainingItems.reduce(
      (sum, item) => sum + (item.qty || 0) * (item.price || 0),
      0,
    );

    const updatedOrder = {
      ...order,
      status: willCancelOrder ? "cancelled" : order.status,
      items: remainingItems,
      itemCount: remainingItems.length,
      totalPrice: updatedTotalPrice,
    };
    await updateOrder(updatedOrder);

    // Also delete the product from weekly_products table in Supabase
    // (skip delivery fee items which are not in weekly_products)
    if (!productId.startsWith("delivery-fee-")) {
      await removeWeeklyProduct(productId, order.weekLabel);
    }

    onUpdated();
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
                  className={`border-b border-slate-50 last:border-0 ${isDeleted ? "bg-red-50/30" : ""}`}
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
                            if (isWednesday || isDeleted) return;
                            setEditingProductId(item.productId);
                            setEditQty(item.qty);
                          }}
                          disabled={isWednesday || isDeleted}
                          aria-disabled={isWednesday || isDeleted}
                          className={`rounded p-1 text-blue-600 transition ${isWednesday || isDeleted ? "cursor-not-allowed opacity-40" : "hover:bg-blue-50"}`}
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
                            if (isWednesday || isDeleted) return;
                            handleDeleteItem(item.productId);
                          }}
                          disabled={isWednesday || isDeleted}
                          aria-disabled={isWednesday || isDeleted}
                          className={`rounded p-1 text-red-500 transition ${isWednesday || isDeleted ? "cursor-not-allowed opacity-40" : "hover:bg-red-50"}`}
                          title={
                            isDeleted
                              ? "Item already deleted"
                              : isWednesday
                                ? "Disabled on Wednesday"
                                : "Delete item"
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

type OrderAccordionProps = {
  order: WeeklyOrderRecord;
  defaultOpen?: boolean;
  onUpdated: () => void;
  onView: (order: WeeklyOrderRecord) => void;
  isWednesday?: boolean;
  isPastWeek?: boolean;
};

function OrderAccordion({
  order,
  defaultOpen = false,
  onUpdated,
  onView,
  isWednesday = false,
  isPastWeek = false,
}: OrderAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [itemsExpanded, setItemsExpanded] = useState(false);

  async function handleDelete() {
    if (isWednesday) {
      alert(
        "Weekly processing pause is active. Order deletions are disabled on Wednesday.",
      );
      return;
    }
    if (confirm(`Delete order ${order.id}?`)) {
      // Remove each product in this order from weekly_products as well
      for (const item of order.items) {
        if (!item.deleted && !item.productId.startsWith("delivery-fee-")) {
          await removeWeeklyProduct(item.productId, order.weekLabel);
        }
      }
      await deleteOrder(order.id);
      onUpdated();
    }
  }

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white ${order.status === "cancelled"
          ? "border-red-200 bg-red-50/20"
          : "border-slate-200"
        }`}
    >
      <div className="px-4 py-3 sm:px-5">
        {/* Row 1: Category badge + Order ID + status + chevron + actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <span
              className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${orderRoleColors[order.clientRole] || "bg-slate-100 text-slate-700"}`}
            >
              {orderRoleLabels[order.clientRole] || order.clientRole}
            </span>
            <span
              className={`truncate text-sm font-semibold ${order.status === "cancelled" ? "text-red-600 line-through" : "text-slate-800"}`}
            >
              Order ID: {order.id}
            </span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusStyles[order.status]}`}
            >
              {order.status}
            </span>
            {open ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
            )}
          </button>

          {/* Action buttons — always on the right */}
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => onView(order)}
              className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
              aria-label="View order"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => printOrderForm(order)}
              className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
              aria-label="Print order"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onView(order)}
              disabled={isWednesday || isPastWeek}
              aria-disabled={isWednesday || isPastWeek}
              className={`rounded-lg p-1.5 text-blue-600 ${isWednesday || isPastWeek ? "cursor-not-allowed opacity-60" : "hover:bg-blue-50"}`}
              aria-label="Edit order"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isWednesday || isPastWeek}
              aria-disabled={isWednesday || isPastWeek}
              className={`rounded-lg p-1.5 text-red-500 ${isWednesday || isPastWeek ? "cursor-not-allowed opacity-60" : "hover:bg-red-50"}`}
              aria-label="Delete order"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Row 2: Date · Items · Total · waiting badge */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>{formatOrderDate(order.createdAt)}</span>
          <span>·</span>
          <span>
            {order.items.length} item{order.items.length !== 1 ? "s" : ""}
          </span>
          <span>·</span>
          <span
            className={`font-semibold ${order.items.some((i) => !i.price || i.price === 0) ? "text-amber-600" : "text-emerald-700"}`}
          >
            ₱
            {(order.totalPrice || 0).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          {order.items.some((i) => !i.price || i.price === 0) && (
            <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              ⏳ Waiting for supplier pricing
            </span>
          )}
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 px-4 pb-4 sm:px-5">
          <OrderItemsTable
            order={order}
            expanded={itemsExpanded}
            onToggleAll={() => setItemsExpanded((v) => !v)}
            onUpdated={onUpdated}
            isWednesday={isWednesday}
            isPastWeek={isPastWeek}
          />
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
  onBack?: () => void;
  weekLabel?: string;
  isWednesday?: boolean;
  isPastWeek?: boolean;
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
  onBack,
  weekLabel,
  isWednesday = false,
  isPastWeek = false,
}: OrderDetailsPanelProps) {
  const [addItemCategory, setAddItemCategory] = useState<OrderRole | null>(
    null,
  );

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
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
              aria-label="Back to schools list"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold text-slate-800">{clientName}</p>
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
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onViewSummary}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <BarChart3 className="h-4 w-4" />
            View Summary
          </button>
          <button
            onClick={onAddOrder}
            disabled={isWednesday || isPastWeek}
            aria-disabled={isWednesday || isPastWeek}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white ${isWednesday || isPastWeek ? "bg-slate-400 cursor-not-allowed opacity-70" : "bg-blue-600 hover:bg-blue-700"}`}
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
              onAddItem={setAddItemCategory}
            />
            <div className="space-y-3">
              {orders.map((order) => (
                <OrderAccordion
                  key={order.id + "-" + categoryFilter}
                  order={order}
                  defaultOpen={
                    categoryFilter !== "all" &&
                    order.clientRole === categoryFilter
                  }
                  onUpdated={onUpdated}
                  onView={onViewOrder}
                  isWednesday={isWednesday}
                  isPastWeek={isPastWeek}
                />
              ))}
            </div>
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
