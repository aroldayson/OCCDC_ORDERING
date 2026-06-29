"use client";

import { X } from "lucide-react";
import type { WeeklyProduct } from "../../order/products";
import { getCategoryDisplay } from "./utils";

type ItemViewListModalProps = {
  open: boolean;
  items: WeeklyProduct[];
  onClose: () => void;
};

export default function ItemViewListModal({ open, items, onClose }: ItemViewListModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-bold text-slate-800">Weekly Items ({items.length})</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {getCategoryDisplay(item)} · {item.defaultQty} {item.unit}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
