"use client";

import { useEffect, useRef, useState } from "react";
import { X, Printer, Truck, User, Phone, PenLine, Trash2 } from "lucide-react";
import type { WeeklyOrderRecord } from "../order/types";
import { resolveClientBySchoolName, updateClientContactDetails, type ClientRecord } from "../order/clientStorage";
import { printDeliveryReceipt } from "./printOrder";
import { updateOrderStatus } from "../order/orderStorage";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/providers/AuthProvider";

interface PrintReceiptModalProps {
  order: WeeklyOrderRecord;
  onClose: () => void;
}

export default function PrintReceiptModal({ order, onClose }: PrintReceiptModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clientRecord, setClientRecord] = useState<ClientRecord | null>(null);
  const [coopProfile, setCoopProfile] = useState<{ short_name: string } | null>(null);
  const [copyType, setCopyType] = useState<"ocgempc" | "school" | "deliverer" | "all">("ocgempc");
  const [contactPerson, setContactPerson] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [saving, setSaving] = useState(false);

  // E-signature canvas state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [dateReceived, setDateReceived] = useState<string | null>(null);

  useEffect(() => {
    async function loadClientData() {
      try {
        const client = await resolveClientBySchoolName(order.clientName);
        setClientRecord(client);
        setContactPerson(client.contact_person || "");
        setContactNumber(client.contact_number || "");

        try {
          const targetCoopId = user?.coop_id || client.coop_id || "coop-1";
          const { data: coop } = await supabase
            .from("coop_profile")
            .select("short_name")
            .eq("id", targetCoopId)
            .maybeSingle();

          if (coop) {
            setCoopProfile(coop);
          }
        } catch (coopErr) {
          console.error("Failed to load coop details for client profile:", coopErr);
        }

        try {
          const { data: receiptRec } = await supabase
            .from("delivery_receipt_records")
            .select("signature_data, contact_person, contact_number, date_received")
            .eq("order_id", order.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (receiptRec) {
            setContactPerson(receiptRec.contact_person || "");
            setContactNumber(receiptRec.contact_number || "");
            setDateReceived(receiptRec.date_received || null);
            if (receiptRec.signature_data) {
              // Draw saved signature onto canvas after it mounts
              const dataUrl = receiptRec.signature_data as string;
              const img = new Image();
              img.onload = () => {
                const canvas = canvasRef.current;
                const ctx = canvas?.getContext("2d");
                if (ctx && canvas) {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  setHasSignature(true);
                }
              };
              img.src = dataUrl;
            }
          } else {
            // No saving in database yet for this order -> reset inputs to empty!
            setContactPerson("");
            setContactNumber("");
            setHasSignature(false);
            setDateReceived(null);
          }
        } catch (sigErr) {
          console.error("Failed to load saved signature:", sigErr);
        }

      } catch (err) {
        console.error("Failed to load client details for print selection:", err);
      } finally {
        setLoading(false);
      }
    }
    loadClientData();
  }, [order.clientName, order.id, user?.coop_id]);

  // Canvas drawing helpers
  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    isDrawingRef.current = true;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1e1b4b";
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const getSignatureDataUrl = (): string | undefined => {
    if (!hasSignature) return undefined;
    return canvasRef.current?.toDataURL("image/png");
  };

  const saveReceiptRecord = async (signatureData?: string) => {
    try {
      const { data: existing } = await supabase
        .from("delivery_receipt_records")
        .select("id, date_received")
        .eq("order_id", order.id)
        .maybeSingle();

      const currentDate = new Date().toISOString();
      const resolvedDateReceived = signatureData ? (existing?.date_received || currentDate) : null;

      if (existing) {
        const { error } = await supabase
          .from("delivery_receipt_records")
          .update({
            client_name: order.clientName,
            copy_type: copyType,
            contact_person: contactPerson.trim() || null,
            contact_number: contactNumber.trim() || null,
            printed_by: user?.email || null,
            coop_id: user?.coop_id || null,
            signature_data: signatureData || null,
            updated_at: currentDate,
            date_received: resolvedDateReceived,
          })
          .eq("id", existing.id);

        if (error) throw error;
        setDateReceived(resolvedDateReceived);
      } else {
        const { error } = await supabase
          .from("delivery_receipt_records")
          .insert({
            order_id: order.id,
            client_name: order.clientName,
            copy_type: copyType,
            contact_person: contactPerson.trim() || null,
            contact_number: contactNumber.trim() || null,
            printed_by: user?.email || null,
            coop_id: user?.coop_id || null,
            signature_data: signatureData || null,
            date_received: resolvedDateReceived,
          });

        if (error) throw error;
        setDateReceived(resolvedDateReceived);
      }
    } catch (e) {
      console.error("Failed to save delivery receipt record to database:", e);
      throw e;
    }
  };

  const handleSaveDetails = async () => {
    if (!contactPerson.trim()) {
      alert("Please enter the contact person.");
      return;
    }
    const cleanedNum = contactNumber.trim();
    if (!cleanedNum) {
      alert("Please enter the contact number.");
      return;
    }
    if (cleanedNum.length !== 11) {
      alert("Contact number must be exactly 11 digits.");
      return;
    }
    if (!hasSignature) {
      alert("Please provide a signature.");
      return;
    }
    setSaving(true);
    try {
      if (saveToProfile && clientRecord && user?.role !== "client") {
        await updateClientContactDetails(order.clientName, contactPerson.trim(), contactNumber.trim());
      }
      const sigDataUrl = getSignatureDataUrl();
      await saveReceiptRecord(sigDataUrl);
      if (hasSignature) {
        await updateOrderStatus(order.id, "completed");
      }
      alert("Delivery receipt details saved successfully!");
      onClose();
    } catch (e) {
      console.error("Save details error:", e);
      alert("Failed to save delivery receipt details.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = async () => {
    if (!contactPerson.trim()) {
      alert("Please enter the contact person.");
      return;
    }
    const cleanedNum = contactNumber.trim();
    if (!cleanedNum) {
      alert("Please enter the contact number.");
      return;
    }
    if (cleanedNum.length !== 11) {
      alert("Contact number must be exactly 11 digits.");
      return;
    }
    if (!hasSignature) {
      alert("Please provide a signature.");
      return;
    }
    setPrinting(true);
    try {
      if (saveToProfile && clientRecord && user?.role !== "client") {
        await updateClientContactDetails(order.clientName, contactPerson.trim(), contactNumber.trim());
      }

      const updatedClient: ClientRecord = {
        ...(clientRecord || { id: `school-${Date.now()}`, name: order.clientName }),
        contact_person: contactPerson.trim() || undefined,
        contact_number: contactNumber.trim() || undefined,
      };

      const isAdmin = user?.role === "admin";
      const signatureDataUrl = getSignatureDataUrl();

      try {
        await saveReceiptRecord(signatureDataUrl);
      } catch (dbErr) {
        console.warn("Continuing print job despite DB save failure", dbErr);
      }
      if (hasSignature) {
        try {
          await updateOrderStatus(order.id, "completed");
        } catch (statusErr) {
          console.warn("Failed to update status on print:", statusErr);
        }
      }
      const currentDate = new Date().toISOString();
      const resolvedDateReceived = signatureDataUrl ? (dateReceived || currentDate) : undefined;

      await printDeliveryReceipt(
        order,
        undefined,
        updatedClient,
        copyType,
        contactPerson.trim(),
        contactNumber.trim(),
        isAdmin ? user?.coop_id : undefined,
        isAdmin ? user?.school_name : undefined,
        isAdmin ? user?.school_address : undefined,
        signatureDataUrl,
        resolvedDateReceived
      );
      onClose();
    } catch (e) {
      console.error("Print error:", e);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-violet-600" />
            <h3 className="text-base font-bold text-slate-800">Print Delivery Receipt</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-600 border-t-transparent"></div>
              <span className="text-xs text-slate-500 font-medium">Loading school profile...</span>
            </div>
          ) : (
            <>
              {/* Copy selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Copy to Print
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["ocgempc", "school", "deliverer", "all"] as const).map((type) => {
                    const labels: Record<string, string> = {
                      ocgempc: `${user?.school_name || coopProfile?.short_name || "OCGEMPC"} Copy`,
                      school: "School Copy",
                      deliverer: "Deliverer Copy",
                      all: "All (3 Copies)",
                    };
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setCopyType(type)}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold capitalize transition-all text-center ${copyType === type
                          ? "border-violet-600 bg-violet-50 text-violet-700 ring-2 ring-violet-100"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                      >
                        {labels[type]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contact Person - only shown to admin/suppliers */}
              {user?.role !== "client" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Contact Person
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="Enter name (e.g. JUAN DELA CRUZ)"
                      className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />
                  </div>
                </div>
              )}

              {/* Contact Number - only shown to admin/suppliers */}
              {user?.role !== "client" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Contact Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      maxLength={11}
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="Enter phone (e.g. 9395595423)"
                      className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />
                  </div>
                </div>
              )}

              {/* Save option - only shown to admin/suppliers */}
              {user?.role !== "client" && (
                <label className="flex items-center gap-2 cursor-pointer select-none py-1">
                  <input
                    type="checkbox"
                    checked={saveToProfile}
                    onChange={(e) => setSaveToProfile(e.target.checked)}
                    className="accent-violet-600 h-4 w-4 rounded"
                  />
                  <span className="text-xs text-slate-600 font-semibold">
                    Save contact details to school profile
                  </span>
                </label>
              )}

              {/* E-Signature Pad */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <PenLine className="h-3 w-3" />
                    E-Signature (Received by)
                  </label>
                  {hasSignature && (
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition font-semibold"
                    >
                      <Trash2 className="h-3 w-3" />
                      Clear
                    </button>
                  )}
                </div>
                <div className="relative rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden hover:border-violet-300 transition">
                  <canvas
                    ref={canvasRef}
                    width={420}
                    height={120}
                    className="w-full h-28 touch-none cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-1">
                      <PenLine className="h-5 w-5 text-slate-300" />
                      <span className="text-xs text-slate-400 font-medium">Sign here</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Draw your signature above. It will appear on the printed receipt.</p>
                {dateReceived && (
                  <p className="text-[11px] text-slate-500 font-semibold mt-1.5 flex items-center gap-1">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Date Signed:</span>
                    {new Date(dateReceived).toLocaleDateString("en-PH", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4 bg-slate-50">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveDetails}
            disabled={loading || saving || printing}
            className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 px-4 py-2 active:scale-95 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Details"}
          </button>
          <button
            onClick={handlePrint}
            disabled={loading || printing || saving}
            className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 active:scale-95 transition shadow-md shadow-violet-100 disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            {printing ? "Generating..." : "Print"}
          </button>
        </div>
      </div>
    </div>
  );
}
