import { Check, Pencil, X } from "lucide-react";
import type { WeeklyProduct } from "./products";
import type { OrderLine } from "./types";

type ProductRowProps = {
  product: WeeklyProduct;
  line: OrderLine;
  editing: boolean;
  editQty: string;
  setEditQty: (v: string) => void;
  onToggle: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
};

export default function ProductRow({
  product,
  line,
  editing,
  editQty,
  setEditQty,
  onToggle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
}: ProductRowProps) {
  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        line.selected
          ? "border-blue-200 bg-white shadow-sm"
          : "border-slate-100 bg-slate-50/60 opacity-70"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
            line.selected
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-300 bg-white"
          }`}
          aria-label={`${line.selected ? "Remove" : "Add"} ${product.name}`}
        >
          {line.selected && <Check className="h-3 w-3" strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-800">{product.name}</p>
              {product.note && (
                <p className="mt-0.5 text-xs text-slate-500">{product.note}</p>
              )}
            </div>

            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                  className="w-20 rounded-lg border border-blue-300 px-2 py-1 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-400"
                  autoFocus
                />
                <span className="text-sm text-slate-500">{product.unit}</span>
                <button
                  onClick={onSaveEdit}
                  className="rounded-lg bg-blue-600 p-1.5 text-white hover:bg-blue-700"
                  aria-label="Save quantity"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={onCancelEdit}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Cancel edit"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-sm font-bold text-blue-700">
                  {line.qty} {product.unit}
                </span>
                {line.selected && (
                  <button
                    onClick={onStartEdit}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600"
                    aria-label={`Edit ${product.name} quantity`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
