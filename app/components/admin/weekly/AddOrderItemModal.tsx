"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { OrderRole } from "../../order/roles";
import { orderRoleLabels } from "../../order/roles";
import { getWeeklyProducts } from "../../order/weeklyProductStorage";
import type { WeeklyProduct } from "../../order/products";
import type { WeeklyOrderRecord } from "../../order/types";
import { formatOrderDate } from "./utils";

type AddOrderItemModalProps = {
  open: boolean;
  category: OrderRole | null;
  weekLabel?: string;
  orders?: WeeklyOrderRecord[];
  onClose: () => void;
  onAdd: (productName: string, qty: number, unit: string, price: number, orderId: string) => void;
};

export default function AddOrderItemModal({
  open,
  category,
  weekLabel,
  orders = [],
  onClose,
  onAdd,
}: AddOrderItemModalProps) {
  const [productName, setProductName] = useState("");
  const [qty, setQty] = useState("");
  const [size, setSize] = useState("Medium");
  const [selectedOrderId, setSelectedOrderId] = useState("");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open && category) {
      setQty("");
      if (orders.length > 0) {
        setSelectedOrderId(orders[0].id);
      }
      if (
        category === "vegetables" ||
        category === "meat" ||
        category === "fruits" ||
        category === "fish"
      ) {
        setUnit("kg");
        setProductName("");
        setSize("");
      } else if (category === "rice") {
        setUnit("sack");
        setProductName("Rice");
        setSize("");
      } else if (category === "egg") {
        setUnit("tray/30");
        setProductName("Egg");
        setSize("Medium");
      } else {
        setUnit("kg");
        setProductName("");
        setSize("");
      }
    }
  }, [open, category, orders]);
  /* eslint-enable react-hooks/set-state-in-effect */
  const [unit, setUnit] = useState("kg");
  const [price, setPrice] = useState("");
  const [catalogProducts, setCatalogProducts] = useState<WeeklyProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("custom");

  useEffect(() => {
    if (open && category) {
      getWeeklyProducts(weekLabel).then((prods) => {
        setCatalogProducts(prods.filter((p) => p.category === category));
      });
      // Reset form
      setProductName("");
      setQty("");
      setUnit("kg");
      setPrice("");
      setSelectedProductId("custom");
    }
  }, [open, category, weekLabel]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!open || !category) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalQty = parseFloat(qty);
    let finalName = productName.trim();

    if (!finalName || isNaN(finalQty) || finalQty <= 0 || !selectedOrderId) return;

    if (category === "egg") {
      const sizeSuffix = `(${size.trim()})`;
      if (finalName.toLowerCase().includes("egg")) {
        if (!finalName.includes(sizeSuffix)) {
          finalName = `${finalName} ${sizeSuffix}`;
        }
      } else {
        finalName = `${finalName} Egg ${sizeSuffix}`;
      }
    }

    onAdd(finalName, finalQty, unit.trim(), 0, selectedOrderId);
    onClose();
  };

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedProductId(val);
    if (val === "custom") {
      setQty("");
      if (
        category === "vegetables" ||
        category === "meat" ||
        category === "fruits" ||
        category === "fish"
      ) {
        setUnit("kg");
        setProductName("");
      } else if (category === "rice") {
        setUnit("sack");
        setProductName("Rice");
      } else if (category === "egg") {
        setUnit("tray/30");
        setProductName("Egg");
      } else {
        setUnit("kg");
        setProductName("");
      }
    } else {
      const p = catalogProducts.find((prod) => prod.id === val);
      if (p) {
        setProductName(p.name);
        setUnit(p.unit);
        setQty(p.defaultQty.toString());
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-bold text-slate-800">
            Add Item to {orderRoleLabels[category]}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {orders && orders.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Select Order <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none"
              >
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    Order {o.id} ({formatOrderDate(o.createdAt)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Select Product <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={category === "egg" || category === "rice"}
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. All Purpose Flour"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none ${
                category === "egg" || category === "rice"
                  ? "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                  : "border-slate-200 bg-white"
              }`}
            />
          </div>

          {selectedProductId === "custom" && category !== "egg" && category !== "rice" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. All Purpose Flour"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}

          {selectedProductId === "custom" && (category === "egg" || category === "rice") && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Product Name
              </label>
              <input
                type="text"
                disabled
                value={productName}
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed outline-none"
              />
            </div>
          )}

          <div className={`grid gap-3 ${category === "egg" ? "grid-cols-3" : "grid-cols-2"}`}>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="e.g. 10"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none"
              />
              <p className="mt-1 text-[10.5px] font-medium text-amber-600">
                Note: For half kilo, input 0.5
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Unit <span className="text-red-500">*</span>
              </label>
              {category === "rice" ? (
                <select
                  disabled
                  value={unit}
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500 outline-none cursor-not-allowed"
                >
                  <option value="sack">sack</option>
                </select>
              ) : category === "vegetables" ||
                category === "meat" ||
                category === "fruits" ||
                category === "fish" ? (
                <select
                  disabled
                  value={unit}
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500 outline-none cursor-not-allowed"
                >
                  <option value="kg">kg</option>
                </select>
              ) : category === "egg" ? (
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none"
                >
                  <option value="tray/12">tray/12</option>
                  <option value="tray/30">tray/30</option>
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. kg, pcs"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none"
                />
              )}
            </div>

            {category === "egg" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Size <span className="text-red-500">*</span>
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none"
                >
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
