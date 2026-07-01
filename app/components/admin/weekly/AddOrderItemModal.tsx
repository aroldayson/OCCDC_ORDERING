"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { OrderRole } from "../../order/roles";
import { orderRoleLabels } from "../../order/roles";
import { getWeeklyProducts } from "../../order/weeklyProductStorage";
import type { WeeklyProduct } from "../../order/products";

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
  weekLabel,
  onClose,
  onAdd,
}: AddOrderItemModalProps) {
  const [productName, setProductName] = useState("");
  const [qty, setQty] = useState("");
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

  if (!open || !category) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalQty = parseFloat(qty);
    const finalPrice = parseFloat(price || "0");
    const finalName = productName.trim();

    if (!finalName || isNaN(finalQty) || finalQty <= 0 || isNaN(finalPrice) || finalPrice < 0) return;

    onAdd(finalName, finalQty, unit.trim(), finalPrice);
    onClose();
  };

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedProductId(val);
    if (val === "custom") {
      setProductName("");
      setPrice("");
      setUnit("kg");
      setQty("");
    } else {
      const p = catalogProducts.find((prod) => prod.id === val);
      if (p) {
        setProductName(p.name);
        setPrice(p.price.toString());
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
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Select Product <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProductId}
              onChange={handleProductSelect}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 mb-3"
            >
              <option value="custom">-- Custom Product --</option>
              {catalogProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (₱{p.price}/{p.unit})
                </option>
              ))}
            </select>

            {selectedProductId === "custom" && (
              <>
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
              </>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
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
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="col-span-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Price (₱) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="₱150.00"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="col-span-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Unit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. kg, pcs"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
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
