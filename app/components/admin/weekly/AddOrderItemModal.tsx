"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import type { OrderRole } from "../../order/roles";
import { orderRoleLabels } from "../../order/roles";

type AddOrderItemModalProps = {
  open: boolean;
  category: OrderRole | null;
  weekLabel?: string;
  onClose: () => void;
  onAdd: (productName: string, qty: number, unit: string, price: number) => void;
};

export default function AddOrderItemModal({
  open,
  category,
  onClose,
  onAdd,
}: AddOrderItemModalProps) {
  const [productName, setProductName] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("");
  const [size, setSize] = useState("Medium");

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (open && category) {
      setQty("");
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
  }, [open, category]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!open || !category) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalQty = parseFloat(qty);
    let finalName = productName.trim();

    if (!finalName || isNaN(finalQty) || finalQty <= 0) return;

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

    onAdd(finalName, finalQty, unit.trim(), 0);
    onClose();
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
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={category === "egg" || category === "rice"}
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. All Purpose Flour"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${
                category === "egg" || category === "rice"
                  ? "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                  : "border-slate-200 bg-white"
              }`}
            />
          </div>

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
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
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
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
