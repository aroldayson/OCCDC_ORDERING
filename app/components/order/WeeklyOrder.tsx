"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCcw, Printer } from "lucide-react";
import { weekLabel, type WeeklyProduct } from "./products";
import { buildOrderItems, createOrderId, saveOrder, getOrders } from "./orderStorage";
import { getWeeklyProducts, addWeeklyProduct } from "./weeklyProductStorage";
import { filterOrdersForSchool, filterOrdersForWeek } from "./orderAccess";
import { getClients, resolveClientBySchoolName } from "./clientStorage";
import type { ClientRecord } from "./clientStorage";
import { orderRoleLabels, orderRoles } from "./roles";
import type { OrderRole } from "./roles";
import type { OrderState } from "./types";
import OrderHeader from "./OrderHeader";


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
  fixedCategory?: OrderRole;
};

export default function WeeklyOrder({
  embedded = false,
  defaultClientName = "",
  fixedClientName,
  weekLabel: weekLabelProp,
  onOrderSubmitted,
  fixedCategory,
}: WeeklyOrderProps) {
  const activeWeekLabel = weekLabelProp ?? weekLabel;

  const [allProducts, setAllProducts] = useState<WeeklyProduct[]>([]);
  const [order, setOrder] = useState<OrderState>({});
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(
    null,
  );
  const [, setSelectedClientId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<OrderRole | "">(
    fixedCategory ?? ""
  );

  const [prevFixedCategory, setPrevFixedCategory] = useState<OrderRole | undefined>(fixedCategory);
  if (fixedCategory !== prevFixedCategory) {
    setPrevFixedCategory(fixedCategory);
    setSelectedCategory(fixedCategory ?? "");
  }
  const [clientName, setClientName] = useState(defaultClientName);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [lastOrders, setLastOrders] = useState<WeeklyOrderRecord[]>([]);
  const [validationError, setValidationError] = useState("");

  const products = useMemo(() => {
    if (!selectedCategory) return [];
    return allProducts.filter((p) => p.category === selectedCategory);
  }, [allProducts, selectedCategory]);

  const selectedItems = useMemo(
    () => allProducts.filter((p) => order[p.id]?.selected),
    [allProducts, order],
  );

  const syncProducts = useCallback(() => {
    getWeeklyProducts(activeWeekLabel).then(setAllProducts);
  }, [activeWeekLabel]);

  useEffect(() => {
    syncProducts();
    window.addEventListener("occdc-weekly-products-updated", syncProducts);
    return () =>
      window.removeEventListener("occdc-weekly-products-updated", syncProducts);
  }, [syncProducts]);

  useEffect(() => {
    if (allProducts.length === 0) return;
    if (Object.keys(order).length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrder(buildInitialState(allProducts));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allProducts]);

  useEffect(() => {
    const clientName = fixedClientName || defaultClientName;
    if (!clientName) return;

    async function initClient() {
      let client;
      if (fixedClientName) {
        client = await resolveClientBySchoolName(fixedClientName);
      } else {
        const clients = await getClients();
        client = clients.find((c) => c.name === defaultClientName);
      }

      if (client) {
        setSelectedClient(client);
        setSelectedClientId(client.id);
        setClientName(client.name);
      }
    }
    
    initClient();
  }, [defaultClientName, fixedClientName]);

  const [prevSelectedClient, setPrevSelectedClient] = useState(selectedClient);
  if (selectedClient !== prevSelectedClient) {
    setPrevSelectedClient(selectedClient);
    setSubmitted(false);
    setLastOrders([]);
    setEditingId(null);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    setLastOrders([]);
  }

  async function handleSubmit() {
    if (selectedItems.length === 0 || !selectedClient)
      return;

    const allOrders = await getOrders();
    const existingSchoolOrders = filterOrdersForSchool(allOrders, selectedClient.name);
    const currentWeekOrders = filterOrdersForWeek(existingSchoolOrders, activeWeekLabel);
    const isAdditionalOrder = currentWeekOrders.length > 0;
    let hasAppliedDeliveryFee = false;

    const itemsByCategory: Record<string, typeof selectedItems> = {};
    selectedItems.forEach((item) => {
      const cat = item.category;
      if (!itemsByCategory[cat]) itemsByCategory[cat] = [];
      itemsByCategory[cat].push(item);
    });

    const categoriesWithOrders = Object.keys(itemsByCategory);
    const createdOrders: WeeklyOrderRecord[] = [];

    for (const cat of categoriesWithOrders) {
      const catItems = itemsByCategory[cat];
      const quantities = Object.fromEntries(
        catItems.map((p) => [p.id, order[p.id].qty]),
      );

      const items = buildOrderItems(catItems, quantities);

      if (isAdditionalOrder && !hasAppliedDeliveryFee) {
        items.push({
          productId: `delivery-fee-${Date.now()}`,
          name: "Delivery Fee (Additional Order)",
          qty: 1,
          unit: "trip",
          price: 50,
          category: cat
        });
        hasAppliedDeliveryFee = true;
      }

      const totalPrice = items.reduce((sum, item) => sum + (item.qty * item.price), 0);

      const orderId = createOrderId();
      const orderRecord: WeeklyOrderRecord = {
        id: orderId,
        clientName: selectedClient.name,
        clientRole: cat as OrderRole,
        weekLabel: activeWeekLabel,
        status: "pending",
        itemCount: items.length,
        createdAt: new Date().toISOString(),
        items,
        totalPrice,
      };

      await saveOrder(orderRecord);
      createdOrders.push(orderRecord);
    }

    setLastOrders(createdOrders);
    setSubmitted(true);
    onOrderSubmitted?.();

    setOrder(buildInitialState(allProducts));
  }

  const categoryLabel = selectedCategory
    ? orderRoleLabels[selectedCategory]
    : "";

  const readyToOrder = !!selectedClient && !!selectedCategory;

  const grandTotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const qty = order[item.id]?.qty ?? 0;
      return sum + (qty * item.price);
    }, 0);
  }, [selectedItems, order]);

  const leftPanel = (
    <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
      {!fixedCategory && (
        <div className="mb-5 sm:mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Select Category
          </p>
          <div className="flex flex-wrap gap-2">
            {orderRoles.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedCategory(role)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  selectedCategory === role
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {orderRoleLabels[role]}
              </button>
            ))}
          </div>
        </div>
      )}

      {readyToOrder && (
        <div className="mb-5 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Add custom item to {categoryLabel}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <input
              value={newItemName}
              onChange={(e) => {
                setNewItemName(e.target.value);
                setValidationError("");
              }}
              placeholder="Item name"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none sm:col-span-1"
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
            <input
              value={newItemPrice}
              onChange={(e) => {
                setNewItemPrice(e.target.value);
                setValidationError("");
              }}
              placeholder="Price (₱)"
              type="number"
              min="0"
              step="0.01"
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
          {validationError && (
            <p className="mt-2 text-xs text-red-600">{validationError}</p>
          )}
          <button
            type="button"
            disabled={
              !selectedCategory ||
              !newItemName.trim() ||
              !newItemQty.trim() ||
              !newItemPrice.trim() ||
              !newItemUnit.trim()
            }
            onClick={() => {
              const qty = parseFloat(newItemQty);
              const priceVal = parseFloat(newItemPrice);
              if (!selectedCategory) {
                setValidationError("Select a category first");
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
              if (isNaN(priceVal) || priceVal < 0) {
                setValidationError("Price must be 0 or greater");
                return;
              }
              if (!newItemUnit.trim()) {
                setValidationError("Please select a unit");
                return;
              }
              const handleAddCustom = async () => {
                const entry = await addWeeklyProduct({
                  name: newItemName.trim(),
                  defaultQty: qty,
                  unit: newItemUnit.trim() || "pc",
                  price: priceVal,
                  category: selectedCategory,
                }, activeWeekLabel);
                setOrder((prev) => ({
                  ...prev,
                  [entry.id]: { selected: true, qty: entry.defaultQty },
                }));
                const updatedList = await getWeeklyProducts(activeWeekLabel);
                setAllProducts(updatedList);
              };
              handleAddCustom();
              setNewItemName("");
              setNewItemQty("");
              setNewItemPrice("");
              setNewItemUnit("");
              setValidationError("");
            }}
            className="mt-3 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add Item
          </button>
        </div>
      )}
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
          {lastOrders.map((ord) => (
            <button
              key={ord.id}
              onClick={() => printOrderForm(ord)}
              className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition"
            >
              <Printer className="h-4 w-4" />
              Print {orderRoleLabels[ord.clientRole]} Order ({ord.id})
            </button>
          ))}
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

      {submitted && lastOrders.length > 0 && (
        <p className="mb-4 text-center text-sm text-slate-500">
          Order ID:{" "}
          <span className="font-semibold text-slate-700">
            {lastOrders.map((o) => o.id).join(", ")}
          </span>
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
          <div className="space-y-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">Grand Total:</span>
                <span className="text-xl font-extrabold text-emerald-700">
                  ₱{grandTotal.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              onClick={resetToDefault}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 sm:py-3"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to default quantities
            </button>
          </div>
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
