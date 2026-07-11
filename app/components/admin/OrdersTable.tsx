import { useState, useMemo, Fragment } from "react";
import { Eye, Printer, Truck, ChevronDown, ChevronRight, Download } from "lucide-react";
import type { WeeklyOrderRecord, OrderStatus } from "../order/types";
import { printOrderForm, downloadSingleOrderExcel } from "./printOrder";
import { orderRoleColors, orderRoleLabels } from "../order/roles";
import { getFridayFromWeekLabel } from "../order/weekUtils";
import { useAuth } from "@/app/providers/AuthProvider";

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  accepted: "bg-blue-50 text-blue-700 ring-blue-200",
  processing: "bg-violet-50 text-violet-700 ring-violet-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDeliveryDateValue(order: WeeklyOrderRecord) {
  const dateStr = order.deliveryDate;
  let date: Date | null = null;
  if (dateStr) {
    date = new Date(dateStr + "T12:00:00");
  } else {
    date = getFridayFromWeekLabel(order.weekLabel, order.createdAt);
  }

  if (!date) return "Not set";

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type OrdersTableProps = {
  orders: WeeklyOrderRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  compact?: boolean;
  onPrintDeliveryReceipt: (order: WeeklyOrderRecord) => void;
};

export default function OrdersTable({
  orders,
  selectedId,
  onSelect,
  compact,
  onPrintDeliveryReceipt,
}: OrdersTableProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [expandedSchools, setExpandedSchools] = useState<Record<string, boolean>>({});
  const [downloadOptionsOrder, setDownloadOptionsOrder] = useState<WeeklyOrderRecord | null>(null);
  const [docType, setDocType] = useState<"po" | "dr">("po");
  const [formatType, setFormatType] = useState<"pdf" | "html" | "excel">("pdf");

  const handleExecuteDownload = async () => {
    if (!downloadOptionsOrder) return;
    const targetOrder = downloadOptionsOrder;
    setDownloadOptionsOrder(null);

    if (docType === "po") {
      if (formatType === "pdf") {
        printOrderForm(targetOrder);
      } else if (formatType === "html") {
        const { downloadSingleOrderHtml } = await import("./printOrder");
        await downloadSingleOrderHtml(targetOrder);
      } else {
        downloadSingleOrderExcel(targetOrder);
      }
    } else {
      if (formatType === "pdf") {
        onPrintDeliveryReceipt(targetOrder);
      } else if (formatType === "html") {
        const { downloadDeliveryReceiptHtml } = await import("./printOrder");
        await downloadDeliveryReceiptHtml(targetOrder);
      } else {
        const { downloadDeliveryReceiptExcel } = await import("./printOrder");
        await downloadDeliveryReceiptExcel(targetOrder);
      }
    }
  };

  const toggleSchool = (schoolName: string) => {
    setExpandedSchools((prev) => ({
      ...prev,
      [schoolName]: !prev[schoolName],
    }));
  };

  // Group orders by clientName
  const groupedOrders = useMemo(() => {
    const groups: Record<string, WeeklyOrderRecord[]> = {};
    orders.forEach((order) => {
      if (!groups[order.clientName]) {
        groups[order.clientName] = [];
      }
      groups[order.clientName].push(order);
    });
    return groups;
  }, [orders]);

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate-500">
          No orders yet. Clients can place orders from the home page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Mobile cards grouped per school */}
      <div
        className={`min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 ${compact ? "" : "lg:hidden"}`}
      >
        {Object.entries(groupedOrders).map(([schoolName, schoolOrders]) => {
          const isExpanded = !!expandedSchools[schoolName];
          const orderCount = schoolOrders.length;

          return (
            <div key={`mobile-school-${schoolName}`} className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
              <div
                onClick={() => toggleSchool(schoolName)}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50 border-b border-slate-100 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </span>
                  <span className="font-bold text-slate-800 text-xs line-clamp-1">
                    {schoolName}
                  </span>
                </div>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 shrink-0">
                  {orderCount} Order{orderCount > 1 ? "s" : ""}
                </span>
              </div>

              {isExpanded && (
                <div className="p-2 space-y-2 bg-slate-50/20">
                  {schoolOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => onSelect(order.id)}
                      className={`w-full rounded-xl border p-3.5 cursor-pointer transition-all ${selectedId === order.id
                        ? "border-blue-300 bg-blue-50 shadow-sm"
                        : "border-slate-100 bg-white hover:border-slate-200"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-500">{order.id}</span>
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${orderRoleColors[order.clientRole] ||
                                "bg-slate-100 text-slate-700"
                                }`}
                            >
                              {orderRoleLabels[order.clientRole] || order.clientRole}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0 items-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setDownloadOptionsOrder(order);
                              setDocType("po");
                              setFormatType("pdf");
                            }}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                            title="Print / Download Options"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusStyles[order.status]}`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          {order.itemCount} items · {order.weekLabel}
                        </span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop table grouped per school */}
      <div
        className={`hidden min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm ${compact ? "lg:hidden" : "lg:flex"
          }`}
      >
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400 shadow-[0_1px_0_0_rgb(241_245_249)]">
                <th className="px-3 py-3 sm:px-5">Order ID</th>
                <th className="px-3 py-3 sm:px-5">Category</th>
                <th className="px-3 py-3 sm:px-5">Client</th>
                <th className="hidden px-3 py-3 sm:px-5 md:table-cell">Week</th>
                <th className="hidden px-3 py-3 sm:px-5 lg:table-cell">
                  Items
                </th>
                <th className="px-3 py-3 sm:px-5">Status</th>
                <th className="hidden px-3 py-3 sm:px-5 sm:table-cell">Order Date</th>
                <th className="hidden px-3 py-3 sm:px-5 sm:table-cell">Target Deliver</th>
                <th className="px-3 py-3 sm:px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedOrders).map(([schoolName, schoolOrders]) => {
                const isExpanded = !!expandedSchools[schoolName];
                const totalItems = schoolOrders.reduce((sum, o) => sum + (o.itemCount || 0), 0);
                const orderCount = schoolOrders.length;

                return (
                  <Fragment key={`group-${schoolName}`}>
                    {/* School Header Row */}
                    <tr
                      onClick={() => toggleSchool(schoolName)}
                      className="bg-slate-50/50 hover:bg-slate-50 border-b border-slate-100 cursor-pointer select-none transition-colors"
                    >
                      <td colSpan={9} className="px-3 py-3.5 sm:px-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">
                              {isExpanded ? (
                                <ChevronDown className="h-4.5 w-4.5" />
                              ) : (
                                <ChevronRight className="h-4.5 w-4.5" />
                              )}
                            </span>
                            <span className="font-bold text-slate-800 text-sm">
                              {schoolName}
                            </span>
                            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600 border border-blue-100">
                              {orderCount} Order{orderCount > 1 ? "s" : ""}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 font-medium">
                            Total items: {totalItems}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Order Rows */}
                    {isExpanded &&
                      schoolOrders.map((order) => (
                        <tr
                          key={order.id}
                          onClick={() => onSelect(order.id)}
                          className={`cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50 ${selectedId === order.id ? "bg-blue-50" : ""
                            }`}
                        >
                          <td className="pl-8 pr-3 py-3.5 font-medium text-slate-600 sm:pl-10 whitespace-nowrap">
                            {order.id}
                          </td>
                          <td className="px-3 py-3.5 sm:px-5">
                            <span
                              className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${orderRoleColors[order.clientRole] ||
                                "bg-slate-100 text-slate-700"
                                }`}
                            >
                              {orderRoleLabels[order.clientRole] || order.clientRole}
                            </span>
                          </td>
                          <td className="px-3 py-3.5 font-medium text-slate-800 sm:px-5">
                            <div className="min-w-0">
                              <p className="truncate text-slate-500 text-xs">{order.clientName}</p>
                            </div>
                          </td>
                          <td className="hidden px-3 py-3.5 text-slate-500 sm:px-5 md:table-cell">
                            <p className="truncate">{order.weekLabel}</p>
                          </td>
                          <td className="hidden px-3 py-3.5 text-slate-600 sm:px-5 lg:table-cell">
                            {order.itemCount}
                          </td>
                          <td className="px-3 py-3.5 sm:px-5">
                            <span
                              className={`inline-block rounded-full px-2 py-1 text-xs font-medium capitalize sm:px-2.5 sm:py-1 ${statusStyles[order.status]}`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="hidden px-3 py-3.5 text-xs text-slate-400 sm:px-5 sm:table-cell">
                            <p className="truncate">{formatDate(order.createdAt)}</p>
                          </td>
                          <td className="hidden px-3 py-3.5 text-xs text-slate-500 sm:px-5 sm:table-cell">
                            <p className="truncate">{formatDeliveryDateValue(order)}</p>
                          </td>
                          <td className="px-3 py-3.5 sm:px-5 text-right">
                            <div className="flex justify-end gap-1 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => onSelect(order.id)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                                title="View order"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDownloadOptionsOrder(order);
                                  setDocType("po");
                                  setFormatType("pdf");
                                }}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                                title="Print / Download Options"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {downloadOptionsOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => {
          if (e.target === e.currentTarget) setDownloadOptionsOrder(null);
        }}>
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-800 mb-4">Print / Download Options</h3>
            <div className="space-y-4">
              {/* Document selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Document Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDocType("po")}
                    className={`rounded-xl border p-3 text-xs font-bold transition flex flex-col items-center gap-1 ${
                      docType === "po"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <span>Purchase Order</span>
                    <span className="text-[10px] opacity-75 font-normal">Purchase Request</span>
                  </button>
                  <button
                    disabled={!isAdmin && !downloadOptionsOrder.hasReceiptRecord}
                    onClick={() => setDocType("dr")}
                    className={`rounded-xl border p-3 text-xs font-bold transition flex flex-col items-center gap-1 ${
                      docType === "dr"
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : !isAdmin && !downloadOptionsOrder.hasReceiptRecord
                        ? "border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50/50"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                    title={!isAdmin && !downloadOptionsOrder.hasReceiptRecord ? "Delivery Receipt has not been saved yet" : ""}
                  >
                    <span>Delivery Receipt</span>
                    <span className="text-[10px] opacity-75 font-normal">Signed Receipt</span>
                  </button>
                </div>
              </div>

              {/* Format selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Format</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setFormatType("pdf")}
                    className={`rounded-xl border p-2 text-xs font-bold transition flex flex-col items-center gap-1 ${
                      formatType === "pdf"
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <span>PDF / Print</span>
                    <span className="text-[9px] opacity-75 font-normal">Print Window</span>
                  </button>
                  <button
                    onClick={() => setFormatType("html")}
                    className={`rounded-xl border p-2 text-xs font-bold transition flex flex-col items-center gap-1 ${
                      formatType === "html"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <span>Download PDF/HTML</span>
                    <span className="text-[9px] opacity-75 font-normal">Offline Page</span>
                  </button>
                  <button
                    onClick={() => setFormatType("excel")}
                    className={`rounded-xl border p-2 text-xs font-bold transition flex flex-col items-center gap-1 ${
                      formatType === "excel"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <span>Excel</span>
                    <span className="text-[9px] opacity-75 font-normal">Spreadsheet</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDownloadOptionsOrder(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDownload}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
