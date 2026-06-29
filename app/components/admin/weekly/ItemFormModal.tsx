"use client";

import { X } from "lucide-react";
import { orderRoleLabels, orderRoles } from "../../order/roles";
import type { WeeklyProduct } from "../../order/products";

const units = ["kg", "g", "dozen", "packs", "225g", "pcs", "liters", "reams"];

export type ItemFormData = {
  name: string;
  category: WeeklyProduct["category"];
  defaultQty: string;
  unit: string;
  note: string;
};

type ItemFormModalProps = {
  open: boolean;
  editing: WeeklyProduct | null;
  onClose: () => void;
  onSave: (data: ItemFormData) => void;
};

export default function ItemFormModal({ open, editing, onClose, onSave }: ItemFormModalProps) {
  if (!open) return null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSave({
      name: String(fd.get("name") ?? ""),
      category: String(fd.get("category") ?? "pantry") as WeeklyProduct["category"],
      defaultQty: String(fd.get("defaultQty") ?? ""),
      unit: String(fd.get("unit") ?? "kg"),
      note: String(fd.get("note") ?? ""),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-bold text-slate-800">Add / Update Item</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form key={editing?.id ?? "new"} onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              required
              defaultValue={editing?.name ?? ""}
              placeholder="e.g. Ground Beef"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                required
                defaultValue={editing?.category ?? "pantry"}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                {orderRoles.map((cat) => (
                  <option key={cat} value={cat}>
                    {orderRoleLabels[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                name="defaultQty"
                type="number"
                min="0"
                step="any"
                required
                defaultValue={editing?.defaultQty ?? ""}
                placeholder="e.g. 5"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Unit <span className="text-red-500">*</span>
            </label>
            <select
              name="unit"
              required
              defaultValue={editing?.unit ?? "kg"}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Notes</label>
            <textarea
              name="note"
              rows={3}
              defaultValue={editing?.note ?? ""}
              placeholder="Optional notes..."
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
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
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
