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
} from "lucide-react";
import { useState } from "react";
import { deleteOrder, updateOrder } from "../../order/orderStorage";
import { orderRoleColors, orderRoleLabels } from "../../order/roles";
import { printOrderForm } from "../printOrder";
import type { OrderRole } from "../../order/roles";
import type { OrderStatus, OrderItem, WeeklyOrderRecord } from "../../order/types";
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
          <button
            onClick={() => onAddItem(category)}
            className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-white/70 px-2 py-1 text-xs font-semibold hover:bg-white hover:shadow-sm transition-all border border-black/5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Item
          </button>
        </div>
      ))}
    </div>
  );
}

function OrderItemsTable({
  items,
  expanded,
  onToggleAll,
}: {
  items: OrderItem[];
  expanded: boolean;
  onToggleAll: () => void;
}) {
  const shown = expanded ? items : items.slice(0, PREVIEW_COUNT);

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-slate-100">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <p className="text-xs font-semibold text-slate-600">
          Order Items ({items.length})
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-4 py-2.5">Product</th>
              <th className="px-4 py-2.5">Category</th>
              <th className="px-4 py-2.5">Quantity</th>
              <th className="px-4 py-2.5">Unit</th>
              <th className="px-4 py-2.5 text-right">Price</th>
              <th className="px-4 py-2.5 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((item) => (
              <tr
                key={item.productId}
                className="border-b border-slate-50 last:border-0"
              >
                <td className="px-4 py-2.5">
                  <p className="font-medium text-slate-800">{item.name}</p>
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  {getCategoryDisplayFromItem(item)}
                </td>
                <td className="px-4 py-2.5 font-medium text-slate-800">
                  {item.qty}
                </td>
                <td className="px-4 py-2.5 text-slate-600">{item.unit}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-slate-700">
                  ₱{(item.price || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-emerald-700">
                  ₱{((item.qty || 0) * (item.price || 0)).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
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
};

function OrderAccordion({
  order,
  defaultOpen = false,
  onUpdated,
  onView,
}: OrderAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [itemsExpanded, setItemsExpanded] = useState(false);

  async function handleDelete() {
    if (confirm(`Delete order ${order.id}?`)) {
      await deleteOrder(order.id);
      onUpdated();
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 flex-wrap items-center gap-3 text-left hover:bg-slate-50/80 rounded-lg -ml-1 px-1 py-0.5"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${orderRoleColors[order.clientRole] || "bg-slate-100 text-slate-700"}`}>
                  {orderRoleLabels[order.clientRole] || order.clientRole}
                </span>
                <span className="font-semibold text-slate-800">
                  Order ID: {order.id}
                </span>
              </span>
              <span className="text-slate-500">
                Order Date: {formatOrderDate(order.createdAt)}
              </span>
              <span className="text-slate-500">Items: {order.itemCount}</span>
              <span className="font-semibold text-emerald-700">
                Total: ₱{(order.totalPrice || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyles[order.status]}`}
          >
            {order.status}
          </span>
          {open ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
          )}
        </button>

        <div className="flex items-center gap-1">
          <span className="mr-2 hidden text-xs font-medium text-slate-400 sm:inline">
            Actions
          </span>
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
            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
            aria-label="Edit order"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
            aria-label="Delete order"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 px-4 pb-4 sm:px-5">
          <OrderItemsTable
            items={order.items}
            expanded={itemsExpanded}
            onToggleAll={() => setItemsExpanded((v) => !v)}
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
  onUpdated: () => void;
  onAddOrder: () => void;
  onViewSummary: () => void;
  onViewOrder: (order: WeeklyOrderRecord) => void;
  onBack?: () => void;
  weekLabel?: string;
};

export default function OrderDetailsPanel({
  clientName,
  categories,
  orders,
  onUpdated,
  onAddOrder,
  onViewSummary,
  onViewOrder,
  onBack,
  weekLabel,
}: OrderDetailsPanelProps) {
  const [addItemCategory, setAddItemCategory] = useState<OrderRole | null>(null);

  if (!clientName) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">Select a client to view orders</p>
      </div>
    );
  }

  async function handleAddItem(productName: string, qty: number, unit: string, price: number, orderId: string) {
    if (!addItemCategory) return;
    const catOrder = orders.find((o) => o.id === orderId);
    if (!catOrder) return;

    const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "item";
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
    const totalPrice = updatedItems.reduce((sum, it) => sum + (it.qty * it.price), 0);
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
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Order
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
        {orders.length === 0 ? (
          <p className="text-center text-sm text-slate-500">
            No orders for this client.
          </p>
        ) : (
          <>
            <CategorySummary orders={orders} categories={categories} onAddItem={setAddItemCategory} />
            <div className="space-y-3">
              {orders.map((order, i) => (
                <OrderAccordion
                  key={order.id}
                  order={order}
                  defaultOpen={i === 0}
                  onUpdated={onUpdated}
                  onView={onViewOrder}
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
          orders={orders.filter(o => o.clientRole === addItemCategory)}
          onClose={() => setAddItemCategory(null)}
          onAdd={handleAddItem}
        />
      )}
    </div>
  );
}
