import { Check } from "lucide-react";
import { weekLabel } from "./products";

type OrderSuccessBannerProps = {
  itemCount: number;
  onPlaceAnother: () => void;
};

export default function OrderSuccessBanner({ itemCount, onPlaceAnother }: OrderSuccessBannerProps) {
  return (
    <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-bold text-emerald-800">Order Submitted!</h2>
      <p className="mt-1 text-sm text-emerald-700">
        {itemCount} items for {weekLabel} have been sent.
      </p>
      <button
        onClick={onPlaceAnother}
        className="mt-4 text-sm font-semibold text-emerald-700 underline hover:text-emerald-900"
      >
        Place another order
      </button>
    </div>
  );
}
