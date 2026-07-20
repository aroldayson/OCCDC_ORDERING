import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import ClientNameField from "./ClientNameField";

type OrderHeaderProps = {
  clientName: string;
  onClientNameChange: (name: string) => void;
  showDashboardLink?: boolean;
};

export default function OrderHeader({
  clientName,
  onClientNameChange,
  showDashboardLink = true,
}: OrderHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
              OC
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                OCCDO Ordering
              </p>
              <h1 className="text-lg font-bold text-slate-800">Weekly Product Order</h1>
            </div>
          </div>
          {showDashboardLink && (
            <Link
              href="/dashboard"
              className="hidden items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 sm:flex"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </Link>
          )}
        </div>

        <div className="mt-4">
          <ClientNameField clientName={clientName} onClientNameChange={onClientNameChange} />
        </div>
      </div>
    </header>
  );
}
