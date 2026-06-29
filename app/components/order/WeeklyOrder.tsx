"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCcw, Printer } from "lucide-react";
import { weekLabel, type WeeklyProduct } from "./products";
import { buildOrderItems, createOrderId, saveOrder } from "./orderStorage";
import { getWeeklyProducts, addWeeklyProduct } from "./weeklyProductStorage";
import { getClients, resolveClientBySchoolName } from "./clientStorage";
import type { ClientRecord } from "./clientStorage";
import { orderRoleLabels, orderRoles } from "./roles";
import type { OrderRole } from "./roles";
import type { OrderState } from "./types";
import OrderHeader from "./OrderHeader";
import ClientSelectField from "./ClientSelectField";
import ClientNameField from "./ClientNameField";
import ProductRow from "./ProductRow";
import OrderSuccessBanner from "./OrderSuccessBanner";
import SubmitBar from "./SubmitBar";
import { printOrderForm } from "../admin/printOrder";
import type { WeeklyOrderRecord } from "./types";

function buildInitialState(products: WeeklyProduct[]): OrderState {
  return Object.fromEntries(
    products.map((p) => [p.id, { selected: false, qty: p.defaultQty }]),
  );
}

type WeeklyOrderProps = {
  embedded?: boolean;
  defaultClientName?: string;
  fixedClientName?: string;
  weekLabel?: string;
  onOrderSubmitted?: () => void;
};

export default function WeeklyOrder({
  embedded = false,
  defaultClientName = "",
  fixedClientName,
  weekLabel: weekLabelProp,
  onOrderSubmitted,
}: WeeklyOrderProps) {
  const [allProducts, setAllProducts] = useState<WeeklyProduct[]>(() =>
    typeof window !== "undefined" ? getWeeklyProducts() : [],
  );
  // Maintain a global order state across all categories so selections
  // persist when the user steps through multiple category pages.
  const [order, setOrder] = useState<OrderState>({});
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(
    null,
  );
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<OrderRole | "">("");
  const [clientName, setClientName] = useState(defaultClientName);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<WeeklyOrderRecord | null>(null);
  const [validationError, setValidationError] = useState("");
  const activeWeekLabel = weekLabelProp ?? weekLabel;

  const products = useMemo(() => {
    if (!selectedCategory) return [];
    return allProducts.filter((p) => p.category === selectedCategory);
  }, [allProducts, selectedCategory]);

  // All selected items across categories (used for submission summary)
  const selectedItems = useMemo(
    () => allProducts.filter((p) => order[p.id]?.selected),
    [allProducts, order],
  );

  const syncProducts = useCallback(() => {
    const list = getWeeklyProducts();
    setAllProducts(list);
  }, []);

  useEffect(() => {
    syncProducts();
    window.addEventListener("occdc-weekly-products-updated", syncProducts);
    return () =>
      window.removeEventListener("occdc-weekly-products-updated", syncProducts);
  }, [syncProducts]);

  // Initialize global order state once products are loaded.
  useEffect(() => {
    if (allProducts.length === 0) return;
    // If order is empty, populate defaults for all products so selections
    // persist across category steps.
    if (Object.keys(order).length === 0) {
      setOrder(buildInitialState(allProducts));
    }
  }, [allProducts]);

  useEffect(() => {
    const clientName = fixedClientName || defaultClientName;
    if (!clientName) return;

    const client = fixedClientName
      ? resolveClientBySchoolName(fixedClientName)
      : getClients().find((c) => c.name === defaultClientName);

    if (client) {
      setSelectedClient(client);
      setSelectedClientId(client.id);
      setClientName(client.name);
    }
  }, [defaultClientName, fixedClientName]);

  useEffect(() => {
    // When client changes, clear submission state but keep selections.
    setSubmitted(false);
    setLastOrderId(null);
    setEditingId(null);
    setNotes("");
  }, [selectedClient]);

  function handleClientChange(client: ClientRecord | null) {
    setSelectedClient(client);
    setSelectedClientId(client?.id ?? "");
    if (client) setClientName(client.name);
    if (!client) setSelectedCategory("");
  }

  function startEdit(product: WeeklyProduct) {
    setEditingId(product.id);
    setEditQty(String(order[product.id]?.qty ?? product.defaultQty));
  }

  function saveEdit(productId: string) {
    const parsed = parseFloat(editQty);
    if (!isNaN(parsed) && parsed >= 0) {
      setOrder((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], qty: parsed },
      }));
    }
    setEditingId(null);
    setEditQty("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditQty("");
  }

  function resetToDefault() {
    setOrder(buildInitialState(allProducts));
    setEditingId(null);
    setSubmitted(false);
    setLastOrderId(null);
    setLastOrder(null);
    setNotes("");
  }

  function handleSubmit() {
    if (selectedItems.length === 0 || !selectedClient || !selectedCategory)
      return;

    const quantities = Object.fromEntries(
      selectedItems.map((p) => [p.id, order[p.id].qty]),
    );
    const orderId = createOrderId();
    const orderRecord: WeeklyOrderRecord = {
      id: orderId,
      clientName: selectedClient.name,
      clientRole: selectedCategory as OrderRole,
      weekLabel: activeWeekLabel,
      status: "pending",
      itemCount: selectedItems.length,
      createdAt: new Date().toISOString(),
      items: buildOrderItems(selectedItems, quantities),
      notes: notes.trim() || undefined,
    };

    saveOrder(orderRecord);

    setLastOrderId(orderId);
    setLastOrder(orderRecord);
    setSubmitted(true);
    onOrderSubmitted?.();

    if (!embedded) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const categoryLabel = selectedCategory
    ? orderRoleLabels[selectedCategory]
    : "";
  const readyToOrder = selectedClient && selectedCategory;

  const leftPanel = (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <ClientSelectField
          selectedClientId={selectedClientId}
          onClientChange={handleClientChange}
          lockedClientName={fixedClientName}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Order Category
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {orderRoles.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedCategory(role)}
              className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                selectedCategory === role
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {orderRoleLabels[role]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Add order item
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px_120px]">
          <input
            value={newItemName}
            onChange={(e) => {
              setNewItemName(e.target.value);
              setValidationError("");
            }}
            placeholder="Item name"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
          />
          <input
            value={newItemQty}
            onChange={(e) => {
              setNewItemQty(e.target.value);
              setValidationError("");
            }}
            placeholder="Qty"
            type="number"
            min="0"
            step="0.1"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
          />
          <select
            value={newItemUnit}
            onChange={(e) => {
              setNewItemUnit(e.target.value);
              setValidationError("");
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
          >
            <option value="">Select unit</option>
            <option value="kg">kg</option>
            <option value="sack">sack</option>
            <option value="pcs">pcs</option>
            <option value="pc">pc</option>
            <option value="liter">liter</option>
            <option value="bottle">bottle</option>
            <option value="tray">tray</option>
            <option value="gallon">gallon</option>
            <option value="pack">pack</option>
            <option value="tub">tub</option>
            <option value="roll">roll</option>
            <option value="can">can</option>
            <option value="box">box</option>
            <option value="unit">unit</option>
          </select>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
          rows={2}
        />
        {validationError && (
          <p className="mt-2 text-xs text-red-600">{validationError}</p>
        )}
        <button
          type="button"
          disabled={
            !selectedCategory ||
            !newItemName.trim() ||
            !newItemQty ||
            !newItemUnit
          }
          onClick={() => {
            const qty = parseFloat(newItemQty || "0");
            if (!selectedCategory) {
              setValidationError("Please select a category");
              return;
            }
            if (!newItemName.trim()) {
              setValidationError("Item name is required");
              return;
            }
            if (isNaN(qty) || qty <= 0) {
              setValidationError("Quantity must be greater than 0");
              return;
            }
            if (!newItemUnit.trim()) {
              setValidationError("Please select a unit");
              return;
            }
            const entry = addWeeklyProduct({
              name: newItemName.trim(),
              defaultQty: qty,
              unit: newItemUnit.trim() || "pc",
              category: selectedCategory,
            });
            setOrder((prev) => ({
              ...prev,
              [entry.id]: { selected: true, qty: entry.defaultQty },
            }));
            setAllProducts(getWeeklyProducts());
            setNewItemName("");
            setNewItemQty("");
            setNewItemUnit("");
            setValidationError("");
          }}
          className="mt-3 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add Item
        </button>
      </div>
    </div>
  );

  const rightPanel = (
    <div className="space-y-4">
      {submitted ? (
        <div className="space-y-3">
          <OrderSuccessBanner
            itemCount={selectedItems.length}
            onPlaceAnother={resetToDefault}
          />
          {lastOrder && (
            <button
              onClick={() => printOrderForm(lastOrder)}
              className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition"
            >
              <Printer className="h-4 w-4" />
              Print Order Form
            </button>
          )}
        </div>
      ) : (
        <div
          className={`shrink-0 rounded-2xl border border-blue-100 bg-blue-50 p-3 sm:p-4 ${
            embedded ? "" : "mb-6"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">
            Order Period
          </p>
          <p className="mt-1 text-lg font-bold text-blue-900 sm:text-xl">
            {activeWeekLabel}
          </p>
          {readyToOrder ? (
            <p className="mt-1 text-sm text-blue-700">
              Ordering as <strong>{selectedClient?.name}</strong> —{" "}
              {categoryLabel} items only
            </p>
          ) : (
            <p className="mt-1 text-sm text-blue-700">
              Select a school and order category to see available items.
            </p>
          )}
        </div>
      )}

      {submitted && lastOrderId && (
        <p className="mb-4 text-center text-sm text-slate-500">
          Order ID:{" "}
          <span className="font-semibold text-slate-700">{lastOrderId}</span>
        </p>
      )}

      <div
        className={
          embedded
            ? "min-h-0 flex-1 space-y-4 overflow-y-auto py-3 pr-1"
            : "contents"
        }
      >
        {selectedItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            {!readyToOrder
              ? "Pumili muna ng school at category para mag-add ng items."
              : "Mag-add ng items para makita dito."}
          </div>
        ) : (
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500 sm:mb-3">
              Selected Items
            </h2>
            <div className="space-y-2 sm:space-y-3">
              {selectedItems.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  line={
                    order[product.id] ?? {
                      selected: false,
                      qty: product.defaultQty,
                    }
                  }
                  editing={editingId === product.id}
                  editQty={editQty}
                  setEditQty={setEditQty}
                  onToggle={() =>
                    setOrder((prev) => ({
                      ...prev,
                      [product.id]: {
                        ...(prev[product.id] ?? {
                          selected: false,
                          qty: product.defaultQty,
                        }),
                        selected: !(prev[product.id]?.selected ?? false),
                      },
                    }))
                  }
                  onStartEdit={() => startEdit(product)}
                  onSaveEdit={() => saveEdit(product.id)}
                  onCancelEdit={cancelEdit}
                />
              ))}
            </div>
          </section>
        )}

        {!submitted && selectedItems.length > 0 && (
          <button
            onClick={resetToDefault}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 sm:py-3"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to default quantities
          </button>
        )}
      </div>

      <SubmitBar
        selectedCount={selectedItems.length}
        totalCount={products.length}
        disabled={selectedItems.length === 0 || submitted || !readyToOrder}
        onSubmit={handleSubmit}
        embedded={embedded}
      />
    </div>
  );

  const content = embedded ? (
    <div className="grid gap-6 lg:grid-cols-[minmax(360px,420px)_minmax(0,1fr)]">
      {leftPanel}
      {rightPanel}
    </div>
  ) : (
    <div className="space-y-4">
      {leftPanel}
      {rightPanel}
    </div>
  );

  if (embedded) {
    return (
      <div className="mx-auto h-full min-h-0 w-full max-w-6xl overflow-hidden">
        {content}
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50 pb-28">
      <OrderHeader clientName={clientName} onClientNameChange={setClientName} />
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">{content}</main>
    </div>
  );
}
