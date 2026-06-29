import { CreditCard } from "lucide-react";

export default function AlertBanner() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
          <CreditCard className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-amber-900">2 member payments awaiting approval</p>
          <p className="mt-0.5 text-sm text-amber-700">
            Review and approve pending member payments to keep records up to date.
          </p>
        </div>
      </div>
      <button className="shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700">
        Review payments
      </button>
    </div>
  );
}
