import { useState, useEffect } from "react";
import { X, Printer, Trash2, Calendar, Pencil, Camera, Truck } from "lucide-react";
import { updateOrderStatus, updateOrderDeliveryDate } from "../order/orderStorage";
import { getDeliveryProof, saveDeliveryProof, deleteDeliveryProof } from "../order/deliveryProofStorage";
import { printOrderForm } from "./printOrder";
import { useAuth } from "@/app/providers/AuthProvider";
import { supabase } from "@/lib/supabase";
import type { WeeklyOrderRecord, OrderStatus } from "../order/types";
import { getFridayFromWeekLabel, formatDeliveryDate, toDateInputValue } from "../order/weekUtils";

const statusOptions: OrderStatus[] = [
  "pending",
  "accepted",
  "processing",
  "completed",
  "cancelled",
];

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-violet-50 text-violet-700 border-violet-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type OrderDetailPanelProps = {
  order: WeeklyOrderRecord | null;
  onClose: () => void;
  onStatusChange: () => void;
  onPrintDeliveryReceipt: (order: WeeklyOrderRecord) => void;
};

export default function OrderDetailPanel({
  order,
  onClose,
  onStatusChange,
  onPrintDeliveryReceipt,
}: OrderDetailPanelProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [clientRecord, setClientRecord] = useState<any>(null);
  const [isEditingDelivery, setIsEditingDelivery] = useState(false);
  const [tempDeliveryPrice, setTempDeliveryPrice] = useState("0");

  // Delivery date state — uses stored deliveryDate or falls back to Friday of weekLabel
  const [isEditingDeliveryDate, setIsEditingDeliveryDate] = useState(false);
  const [tempDeliveryDate, setTempDeliveryDate] = useState("");
  const [proofImageData, setProofImageData] = useState<string | null>(null);
  const [loadingProof, setLoadingProof] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [hasReceiptData, setHasReceiptData] = useState(false);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  useEffect(() => {
    let active = true;
    if (order?.id) {
      setLoadingProof(true);
      getDeliveryProof(order.id).then((data) => {
        if (active) {
          setProofImageData(data);
          setLoadingProof(false);
        }
      });

      setLoadingReceipt(true);
      supabase
        .from("delivery_receipt_records")
        .select("id")
        .eq("order_id", order.id)
        .limit(1)
        .then(({ data, error }) => {
          if (active) {
            setHasReceiptData(!error && data && data.length > 0);
            setLoadingReceipt(false);
          }
        });
    } else {
      setProofImageData(null);
      setHasReceiptData(false);
    }

    const handleProofUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ orderId: string }>;
      if (customEvent.detail.orderId === order?.id) {
        getDeliveryProof(order.id).then((data) => {
          if (active) {
            setProofImageData(data);
          }
        });
      }
    };

    window.addEventListener("occdo-delivery-proof-updated", handleProofUpdate);
    return () => {
      active = false;
      window.removeEventListener("occdo-delivery-proof-updated", handleProofUpdate);
    };
  }, [order?.id]);

  async function handleProofUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!order || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (!file.type.startsWith("image/")) {
      alert("Please select or capture an image file.");
      return;
    }

    setUploadingProof(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        await saveDeliveryProof(order.id, base64String);
      } catch (err) {
        alert("Failed to save proof of delivery.");
      } finally {
        setUploadingProof(false);
      }
    };
    reader.onerror = () => {
      alert("Failed to read image file.");
      setUploadingProof(false);
    };
    reader.readAsDataURL(file);
  }

  async function handleProofDelete() {
    if (!order) return;
    if (!confirm("Are you sure you want to remove the proof of delivery?")) return;

    try {
      await deleteDeliveryProof(order.id);
    } catch (err) {
      alert("Failed to remove proof of delivery.");
    }
  }

  useEffect(() => {
    if (order) {
      const stored = order.deliveryDate;
      if (stored) {
        setTempDeliveryDate(stored);
      } else {
        const friday = getFridayFromWeekLabel(order.weekLabel, order.createdAt);
        setTempDeliveryDate(friday ? toDateInputValue(friday) : "");
      }
    }
  }, [order?.id, order?.weekLabel, order?.deliveryDate, order?.createdAt]);

  useEffect(() => {
    if (order?.clientName) {
      import("../order/clientStorage").then(({ resolveClientBySchoolName }) => {
        resolveClientBySchoolName(order.clientName).then((record) => {
          setClientRecord(record);
          setTempDeliveryPrice((record.delivery_price || 0).toString());
        });
      });
    }
  }, [order?.clientName]);

  if (!order) return null;

  async function handleStatusChange(status: OrderStatus) {
    if (!isAdmin) return;
    await updateOrderStatus(order!.id, status);
    onStatusChange();
  }

  async function handleSaveDeliveryDate() {
    if (!order) return;
    await updateOrderDeliveryDate(order.id, tempDeliveryDate || null);
    setIsEditingDeliveryDate(false);
    onStatusChange(); // refresh parent
  }

  async function handleSaveDeliveryPrice() {
    if (!clientRecord) return;
    const price = parseFloat(tempDeliveryPrice) || 0;
    import("../order/clientStorage").then(
      async ({ updateClientDeliveryPrice }) => {
        await updateClientDeliveryPrice(clientRecord.id, price);
        setClientRecord({ ...clientRecord, delivery_price: price });
        setIsEditingDelivery(false);
      },
    );
  }

  const grouped = order.items.reduce<Record<string, typeof order.items>>(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {},
  );

  const canClientPrintDR = hasReceiptData;
  const isCancelled = order.status === "cancelled";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-3 sm:p-5">
        <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:mb-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-400 whitespace-nowrap">
              {order.id}
            </p>
            <h3 className="mt-0.5 text-base font-bold text-slate-800 sm:text-lg truncate">
              {order.clientName}
            </h3>
            <p className="mt-1 text-xs text-slate-500 truncate">
              Order Date: {formatDate(order.createdAt)} · Items:{" "}
              {order.itemCount}
            </p>
            {clientRecord && isAdmin && (
              <div className="mt-2 flex flex-wrap items-start gap-x-2 gap-y-1 text-xs">
                <span className="font-medium text-slate-600 shrink-0">
                  Delivery Price:
                </span>
                {isEditingDelivery ? (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-slate-400">₱</span>
                    <input
                      type="number"
                      value={tempDeliveryPrice}
                      onChange={(e) => setTempDeliveryPrice(e.target.value)}
                      className="w-20 rounded border border-slate-300 px-2 py-0.5 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleSaveDeliveryPrice}
                        className="rounded bg-blue-600 px-2 py-1 font-semibold text-white hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingDelivery(false);
                          setTempDeliveryPrice(
                            (clientRecord.delivery_price || 0).toString(),
                          );
                        }}
                        className="rounded bg-slate-100 px-2 py-1 text-slate-600 hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-700 font-semibold">
                      ₱{(clientRecord.delivery_price || 0).toFixed(2)}
                    </span>
                    {!isCancelled && (
                      <button
                        onClick={() => setIsEditingDelivery(true)}
                        className="text-blue-600 hover:text-blue-700 underline text-[10px]"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Delivery Date — everyone sees it, only admin can edit */}
            <div className="mt-2 flex flex-wrap items-start gap-x-2 gap-y-1 text-xs">
              <div className="flex items-center gap-1.5 shrink-0">
                <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span className="font-medium text-slate-600">Target Deliver:</span>
              </div>
              {isAdmin && isEditingDeliveryDate ? (
                <div className="flex flex-wrap items-center gap-1">
                  <input
                    type="date"
                    value={tempDeliveryDate}
                    onChange={(e) => setTempDeliveryDate(e.target.value)}
                    className="rounded border border-slate-300 px-2 py-0.5 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleSaveDeliveryDate}
                      className="rounded bg-blue-600 px-2 py-1 font-semibold text-white hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingDeliveryDate(false);
                        const stored = order.deliveryDate;
                        if (stored) {
                          setTempDeliveryDate(stored);
                        } else {
                          const friday = getFridayFromWeekLabel(order.weekLabel, order.createdAt);
                          setTempDeliveryDate(friday ? toDateInputValue(friday) : "");
                        }
                      }}
                      className="rounded bg-slate-100 px-2 py-1 text-slate-600 hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-blue-700">
                    {tempDeliveryDate
                      ? formatDeliveryDate(new Date(tempDeliveryDate + "T12:00:00"))
                      : "Not set"}
                  </span>
                  {isAdmin && !isCancelled && (
                    <button
                      onClick={() => setIsEditingDeliveryDate(true)}
                      className="text-blue-600 hover:text-blue-700 underline text-[10px] flex items-center gap-0.5"
                    >
                      <Pencil className="h-2.5 w-2.5" />
                      Edit
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-1 shrink-0 sm:gap-2">
            <button
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 sm:p-1.5"
              aria-label="Close detail"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span
              className={`inline-block rounded-full border px-2.5 py-1 text-xs font-semibold capitalize sm:px-3 ${statusStyles[order.status]}`}
            >
              {order.status}
            </span>
          </div>
          <div className="flex gap-1 items-center text-xs font-medium text-slate-500 sm:gap-2">
            <span className="hidden sm:inline">Actions</span>
            <button
              onClick={async () => await printOrderForm(order, undefined, clientRecord)}
              className="rounded p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition sm:p-1.5"
              title="Print order"
            >
              <Printer className="h-4 w-4 sm:h-4 sm:w-4" />
            </button>
            {(isAdmin || canClientPrintDR) && (
              <button
                onClick={() => {
                  if (!isCancelled) onPrintDeliveryReceipt(order);
                }}
                disabled={isCancelled}
                className={`rounded p-1 sm:p-1.5 flex items-center gap-1 transition ${
                  isCancelled
                    ? "cursor-not-allowed text-slate-300 opacity-50"
                    : "text-slate-400 hover:bg-violet-50 hover:text-violet-600"
                }`}
                title={
                  isCancelled
                    ? "Delivery receipt unavailable for cancelled orders"
                    : "Print Delivery Receipt"
                }
              >
                <Truck className="h-4 w-4 sm:h-4 sm:w-4" />
                <span className="text-[10px] hidden md:inline">Delivery Receipt</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-slate-100 p-3 sm:p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {isAdmin ? "Change Status" : "Order Status"}
        </p>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((s) => (
            <button
              key={s}
              disabled={!isAdmin}
              onClick={() => handleStatusChange(s)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize transition-all ${order.status === s
                ? statusStyles[s]
                : isAdmin
                  ? "border-slate-200 text-slate-500 hover:border-slate-300"
                  : "border-slate-100 text-slate-300 opacity-40"
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/30 p-3 flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Grand Total:
          </span>
          <span className="text-base font-extrabold text-emerald-700">
            ₱
            {(order.totalPrice || 0).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        {/* Proof of Delivery Section */}
        <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Proof of Delivery:
            </span>
            {isAdmin && proofImageData && !isCancelled && (
              <button
                onClick={handleProofDelete}
                className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1 transition"
                title="Delete proof"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
          </div>

          {loadingProof ? (
            <div className="flex items-center justify-center py-4 text-xs text-slate-400">
              Loading proof...
            </div>
          ) : proofImageData ? (
            <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proofImageData}
                alt="Proof of Delivery"
                className="w-full h-auto max-h-48 object-cover cursor-pointer hover:opacity-95 transition"
                onClick={() => {
                  const newWindow = window.open();
                  if (newWindow) {
                    newWindow.document.write(`<img src="${proofImageData}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                  }
                }}
              />
              <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-sm text-[10px] text-white px-2 py-0.5 rounded font-semibold pointer-events-none">
                Click to expand
              </div>
            </div>
          ) : (
            <div className="text-center py-5 border border-dashed border-slate-200 rounded-lg bg-white">
              <p className="text-xs text-slate-400 mb-3">
                {isCancelled
                  ? "Proof of delivery is not available for cancelled orders"
                  : "No proof of delivery uploaded yet"}
              </p>
              {isAdmin && !isCancelled && (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    id="proof-upload-input"
                    className="hidden"
                    onChange={handleProofUpload}
                    disabled={uploadingProof}
                  />
                  <label
                    htmlFor="proof-upload-input"
                    className={`inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 cursor-pointer hover:bg-blue-100 transition ${uploadingProof ? "opacity-60 pointer-events-none" : ""
                      }`}
                  >
                    <Camera className="h-3.5 w-3.5" />
                    {uploadingProof ? "Uploading..." : "Capture / Upload Proof"}
                  </label>
                </div>
              )}
            </div>
          )}
        </div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {order.itemCount} Products — {order.weekLabel}
        </p>
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="mb-4">
            <p className="mb-2 text-xs font-bold capitalize text-slate-500">
              {category}
            </p>
            <ul className="space-y-2">
              {items.map((item) => {
                const isDeleted = item.deleted === true;
                const isUnpriced =
                  !isDeleted && (!item.price || item.price === 0);
                return (
                  <li
                    key={item.productId}
                    className={`flex items-start justify-between gap-2 rounded-xl px-3 py-2.5 ${isDeleted ? "bg-red-50/40" : "bg-slate-50"}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm font-medium ${isDeleted
                            ? "text-red-600 line-through decoration-red-500 decoration-2"
                            : isUnpriced
                              ? "text-blue-600 underline decoration-blue-500 decoration-2"
                              : "text-slate-800"
                            }`}
                        >
                          {item.name}
                        </p>
                        {isDeleted && (
                          <span className="text-[9px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded border border-red-600 uppercase tracking-wider">
                            Deleted
                          </span>
                        )}
                        {isUnpriced && (
                          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                            No Price
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs font-semibold ${isDeleted ? "text-red-400 line-through" : isUnpriced ? "text-blue-400" : "text-slate-500"}`}
                      >
                        ₱
                        {(item.price || 0).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        / {item.unit}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-sm font-bold block ${isDeleted ? "text-red-400 line-through" : isUnpriced ? "text-slate-500" : "text-blue-700"}`}
                      >
                        {item.qty} {item.unit}
                      </span>
                      <span
                        className={`text-xs font-bold ${isDeleted ? "text-red-400 line-through" : isUnpriced ? "text-slate-400" : "text-emerald-700"}`}
                      >
                        ₱
                        {((item.qty || 0) * (item.price || 0)).toLocaleString(
                          "en-PH",
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
