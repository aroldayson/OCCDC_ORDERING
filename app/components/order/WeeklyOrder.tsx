"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCcw, Printer, CalendarOff } from "lucide-react";
import { weekLabel, type WeeklyProduct } from "./products";
import {
  buildOrderItems,
  createOrderId,
  saveOrder,
  getOrders,
} from "./orderStorage";
import {
  getWeeklyProducts,
  addWeeklyProduct,
  ensureProductsForWeek,
} from "./weeklyProductStorage";
import { getItemCatalog, type ItemCatalogEntry } from "./itemCatalogStorage";
import { filterOrdersForSchool, filterOrdersForWeek } from "./orderAccess";
import { getClients, resolveClientBySchoolName } from "./clientStorage";
import type { ClientRecord } from "./clientStorage";
import { orderRoleLabels, orderRoles } from "./roles";
import type { OrderRole } from "./roles";
import type { OrderState } from "./types";
import OrderHeader from "./OrderHeader";
// import { useAuth } from "@/app/providers/AuthProvider";

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
  // const { user } = useAuth();
  // const isAdmin = user?.role === "admin";
  const activeWeekLabel = weekLabelProp ?? weekLabel;

  // const [isWednesday, setIsWednesday] = useState(false);

  // /* eslint-disable react-hooks/set-state-in-effect */
  // useEffect(() => {
  //   setIsWednesday(new Date().getDay() === 3);
  // }, []);
  // /* eslint-enable react-hooks/set-state-in-effect */

  // Temporarily disabled Wednesday block while adding features
  const isOrderingDisabled = false;

  const [allProducts, setAllProducts] = useState<WeeklyProduct[]>([]);
  const [catalogItems, setCatalogItems] = useState<ItemCatalogEntry[]>([]);
  const [order, setOrder] = useState<OrderState>({});
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(
    null,
  );
  const [, setSelectedClientId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<OrderRole | "">(
    fixedCategory ?? "",
  );

  const [prevFixedCategory, setPrevFixedCategory] = useState<
    OrderRole | undefined
  >(fixedCategory);
  if (fixedCategory !== prevFixedCategory) {
    setPrevFixedCategory(fixedCategory);
    setSelectedCategory(fixedCategory ?? "");
  }
  const [clientName, setClientName] = useState(defaultClientName);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemCustomName, setNewItemCustomName] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("");
  const [newItemSize, setNewItemSize] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [lastOrders, setLastOrders] = useState<WeeklyOrderRecord[]>([]);
  const [validationError, setValidationError] = useState("");
  // Tracks custom items added locally — only written to Supabase on Submit
  const [localCustomProducts, setLocalCustomProducts] = useState<
    WeeklyProduct[]
  >([]);

  const products = useMemo(() => {
    if (!selectedCategory) return [];
    return allProducts.filter((p) => p.category === selectedCategory);
  }, [allProducts, selectedCategory]);

  const selectedItems = useMemo(
    () => allProducts.filter((p) => order[p.id]?.selected),
    [allProducts, order],
  );

  const syncProducts = useCallback(() => {
    getWeeklyProducts(activeWeekLabel).then((fetched) => {
      // Only show products that have a price set — items deleted from pricing don't appear
      const filtered = fetched.filter((p) => p.price > 0);
      // Merge in any local custom products (price=0, not yet submitted)
      setAllProducts((prev) => {
        const localCustom = prev.filter(
          (p) => !filtered.some((f) => f.id === p.id),
        );
        return [...filtered, ...localCustom];
      });
    });
  }, [activeWeekLabel]);

  useEffect(() => {
    syncProducts();
    window.addEventListener("occdc-weekly-products-updated", syncProducts);
    return () =>
      window.removeEventListener("occdc-weekly-products-updated", syncProducts);
  }, [syncProducts]);

  // Refresh catalog items whenever the category changes
  useEffect(() => {
    if (!selectedCategory) {
      setCatalogItems([]);
      return;
    }
    getItemCatalog(selectedCategory).then(setCatalogItems);
  }, [selectedCategory]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (
      selectedCategory === "vegetables" ||
      selectedCategory === "meat" ||
      selectedCategory === "fruits" ||
      selectedCategory === "fish"
    ) {
      setNewItemUnit("kg");
      setNewItemSize("");
      setNewItemName("");
      setNewItemCustomName("");
    } else if (selectedCategory === "rice") {
      setNewItemUnit("sack");
      setNewItemSize("");
      setNewItemName("Rice");
      setNewItemCustomName("");
    } else if (selectedCategory === "egg") {
      setNewItemUnit("tray/30");
      setNewItemSize("Medium");
      setNewItemName("Egg");
      setNewItemCustomName("");
    } else {
      setNewItemUnit("");
      setNewItemSize("");
      setNewItemName("");
      setNewItemCustomName("");
    }
    setValidationError("");
  }, [selectedCategory]);
  /* eslint-enable react-hooks/set-state-in-effect */

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

  function handleDeleteLocalProduct(productId: string) {
    setLocalCustomProducts((prev) => prev.filter((p) => p.id !== productId));
    setAllProducts((prev) => prev.filter((p) => p.id !== productId));
    setOrder((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  }

  function resetToDefault() {
    setOrder(buildInitialState(allProducts));
    setEditingId(null);
    setSubmitted(false);
    setLastOrders([]);
    setLocalCustomProducts([]);
  }

  async function handleSubmit() {
    if (isOrderingDisabled) {
      alert("Ordering is closed today (Wednesday).");
      return;
    }
    if (selectedItems.length === 0 || !selectedClient) return;

    // Check for duplicate items in the order
    const itemsByCategory: Record<string, typeof selectedItems> = {};
    selectedItems.forEach((item) => {
      const cat = item.category;
      if (!itemsByCategory[cat]) itemsByCategory[cat] = [];
      itemsByCategory[cat].push(item);
    });

    const duplicateItems: string[] = [];
    Object.entries(itemsByCategory).forEach(([cat, items]) => {
      const itemCounts: Record<string, number> = {};
      items.forEach((item) => {
        itemCounts[item.id] = (itemCounts[item.id] || 0) + 1;
      });
      Object.entries(itemCounts).forEach(([itemId, count]) => {
        if (count > 1) {
          const itemName = items.find((i) => i.id === itemId)?.name || itemId;
          duplicateItems.push(`• ${itemName} (${count} times)`);
        }
      });
    });

    if (duplicateItems.length > 0) {
      const duplicateList = duplicateItems.join("\n");
      const proceedWithDuplicates = window.confirm(
        `⚠️ WARNING: Duplicate Items Detected!\n\nYou have ordered the following items multiple times:\n\n${duplicateList}\n\nDo you want to proceed with this order?\n\nClick "OK" to submit or "Cancel" to go back.`
      );

      if (!proceedWithDuplicates) {
        return; // User cancelled the order
      }
    }

    const allOrders = await getOrders();
    const existingSchoolOrders = filterOrdersForSchool(
      allOrders,
      selectedClient.name,
    );
    const currentWeekOrders = filterOrdersForWeek(
      existingSchoolOrders,
      activeWeekLabel,
    );
    const isAdditionalOrder = currentWeekOrders.length > 0;
    let hasAppliedDeliveryFee = false;

    const categoriesWithOrders = Object.keys(itemsByCategory);
    const createdOrders: WeeklyOrderRecord[] = [];

    for (const cat of categoriesWithOrders) {
      // Duplicate check — skip if a non-cancelled order already exists
      // for this school + category + week
      const duplicateExists = currentWeekOrders.some(
        (o) => o.clientRole === cat && o.status !== "cancelled",
      );
      if (duplicateExists) {
        alert(
          `You already have a ${orderRoleLabels[cat as OrderRole] ?? cat} order for this week (${activeWeekLabel}). Please edit the existing order instead of submitting a new one.`,
        );
        continue;
      }

      const catItems = itemsByCategory[cat];
      const quantities = Object.fromEntries(
        catItems.map((p) => [p.id, order[p.id].qty]),
      );

      const items = buildOrderItems(catItems, quantities);

      const deliveryPrice = selectedClient.delivery_price || 0;
      if (deliveryPrice > 0 && !hasAppliedDeliveryFee) {
        items.push({
          productId: `delivery-fee-${Date.now()}`,
          name: "Delivery Fee",
          qty: 1,
          unit: "trip",
          price: deliveryPrice,
          category: cat,
        });
        hasAppliedDeliveryFee = true;
      }

      const totalPrice = items.reduce(
        (sum, item) => sum + item.qty * item.price,
        0,
      );

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

      // Ensure all ordered items exist in weekly_products for this week
      // so the admin can see and price them in the Pricing Update view.
      await ensureProductsForWeek(
        items.filter((it) => !it.productId.startsWith("delivery-fee-")),
        activeWeekLabel,
      );

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
    const itemsTotal = selectedItems.reduce((sum, item) => {
      const qty = order[item.id]?.qty ?? 0;
      return sum + qty * item.price;
    }, 0);
    const deliveryFee = selectedClient?.delivery_price || 0;
    return itemsTotal > 0 ? itemsTotal + deliveryFee : 0;
  }, [selectedItems, order, selectedClient]);

  const leftPanel = (
    <div className="flex min-w-0 flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 self-start">
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
          <div className="mt-3 space-y-2">
            {/* Row 1: Item Name */}
            <div>
              {selectedCategory === "egg" || selectedCategory === "rice" ? (
                <input
                  value={newItemName}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 outline-none cursor-not-allowed"
                />
              ) : (
                <>
                  <select
                    value={newItemName}
                    onChange={(e) => {
                      setNewItemName(e.target.value);
                      setNewItemCustomName("");
                      setValidationError("");
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select item</option>
                    {catalogItems.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                    <option value="__custom__">+ Type custom name…</option>
                  </select>
                  {newItemName === "__custom__" && (
                    <input
                      value={newItemCustomName}
                      onChange={(e) => {
                        setNewItemCustomName(e.target.value);
                        setValidationError("");
                      }}
                      placeholder="Enter item name"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  )}
                </>
              )}
            </div>

            {/* Row 2: Qty, Unit, and (optional) Size */}
            <div
              className={`grid gap-2 ${selectedCategory === "egg" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
            >
              <div>
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
              </div>
              <div>
                {/* Conditional Unit Selector */}
                {selectedCategory === "rice" ? (
                  <select
                    value={newItemUnit}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 outline-none cursor-not-allowed"
                  >
                    <option value="sack">sack</option>
                  </select>
                ) : selectedCategory === "vegetables" ||
                  selectedCategory === "meat" ||
                  selectedCategory === "fruits" ||
                  selectedCategory === "fish" ? (
                  <select
                    value={newItemUnit}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 outline-none cursor-not-allowed"
                  >
                    <option value="kg">kg</option>
                  </select>
                ) : selectedCategory === "egg" ? (
                  <select
                    value={newItemUnit}
                    onChange={(e) => {
                      setNewItemUnit(e.target.value);
                      setValidationError("");
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                  >
                    <option value="tray/12">tray/12</option>
                    <option value="tray/30">tray/30</option>
                  </select>
                ) : (
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
                )}
              </div>
              {selectedCategory === "egg" && (
                <div>
                  <select
                    value={newItemSize}
                    onChange={(e) => {
                      setNewItemSize(e.target.value);
                      setValidationError("");
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                  >
                    <option value="">Select size</option>
                    <option value="Small">Small</option>
                    <option value="Medium">Medium</option>
                  </select>
                </div>
              )}
            </div>
          </div>
          {validationError && (
            <p className="mt-2 text-xs text-red-600">{validationError}</p>
          )}
          <button
            type="button"
            disabled={
              !selectedCategory ||
              !newItemName.trim() ||
              (newItemName === "__custom__" && !newItemCustomName.trim()) ||
              !newItemQty.trim() ||
              !newItemUnit.trim() ||
              (selectedCategory === "egg" && !newItemSize.trim())
            }
            onClick={() => {
              const qty = parseFloat(newItemQty);
              if (!selectedCategory) {
                setValidationError("Select a category first");
                return;
              }
              if (
                !newItemName.trim() ||
                (newItemName === "__custom__" && !newItemCustomName.trim())
              ) {
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
              if (selectedCategory === "egg" && !newItemSize.trim()) {
                setValidationError("Please select an egg size");
                return;
              }

              // Resolve the final display name the same way handleAddCustom does,
              // so the duplicate check matches what would actually be added.
              const resolvedName = (() => {
                let name = (
                  newItemName === "__custom__" ? newItemCustomName : newItemName
                ).trim();
                if (selectedCategory === "egg") {
                  const sizeSuffix = `(${newItemSize.trim()})`;
                  if (name.toLowerCase().includes("egg")) {
                    if (!name.includes(sizeSuffix))
                      name = `${name} ${sizeSuffix}`;
                  } else {
                    name = `${name} Egg ${sizeSuffix}`;
                  }
                }
                return name;
              })();

              const isDuplicate = allProducts.some(
                (p) =>
                  p.name.trim().toLowerCase() === resolvedName.toLowerCase() &&
                  p.category === selectedCategory,
              );
              if (isDuplicate) {
                setValidationError(`"${resolvedName}" is already in the list.`);
                return;
              }
              const handleAddCustom = async () => {
                let finalName = (
                  newItemName === "__custom__" ? newItemCustomName : newItemName
                ).trim();
                if (selectedCategory === "egg") {
                  const sizeSuffix = `(${newItemSize.trim()})`;
                  if (finalName.toLowerCase().includes("egg")) {
                    if (!finalName.includes(sizeSuffix)) {
                      finalName = `${finalName} ${sizeSuffix}`;
                    }
                  } else {
                    finalName = `${finalName} Egg ${sizeSuffix}`;
                  }
                }

                // Build a local-only product entry — NOT saved to Supabase yet
                const slug =
                  finalName
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "") || "item";
                const id = `${slug}-${Date.now()}`;

                const newProduct: WeeklyProduct = {
                  id,
                  name: finalName,
                  defaultQty: qty,
                  unit: newItemUnit.trim() || "pc",
                  price: 0,
                  category: selectedCategory,
                };

                // Add to local state only — Supabase write happens on Submit
                setLocalCustomProducts((prev) => [...prev, newProduct]);
                setAllProducts((prev) => [...prev, newProduct]);
                setOrder((prev) => ({
                  ...prev,
                  [id]: { selected: true, qty: newProduct.defaultQty },
                }));
              };
              handleAddCustom();
              setNewItemName(
                selectedCategory === "egg"
                  ? "Egg"
                  : selectedCategory === "rice"
                    ? "Rice"
                    : "",
              );
              setNewItemCustomName("");
              setNewItemQty("");
              setNewItemUnit(
                selectedCategory === "vegetables" ||
                  selectedCategory === "meat" ||
                  selectedCategory === "fruits" ||
                  selectedCategory === "fish"
                  ? "kg"
                  : selectedCategory === "rice"
                    ? "sack"
                    : selectedCategory === "egg"
                      ? "tray/30"
                      : "",
              );
              setNewItemSize(selectedCategory === "egg" ? "Medium" : "");
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

  const noticeCard = (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex gap-3">
        <span className="text-xl shrink-0" role="img" aria-label="megaphone">
          📢
        </span>
        <div>
          <h4 className="text-sm font-bold text-slate-800">
            Important Order Notice
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Please note that we are closed for ordering every Wednesday as our
            suppliers compile our weekly shipments. Final pricing for all orders
            will be updated and sent out every Thursday. Thank you for planning
            ahead with us!
          </p>
        </div>
      </div>
    </div>
  );

  const leftColumnContent = (
    <div className="flex flex-col gap-6 w-full lg:w-[380px] shrink-0 lg:sticky lg:top-4 lg:self-start">
      {leftPanel}
      {noticeCard}
    </div>
  );

  const rightPanel = (
    <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 min-h-0 max-h-[85vh] lg:max-h-full overflow-hidden">
      {/* Top: order period / success banner — shrinks to content */}
      <div className="shrink-0 space-y-4">
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
              embedded ? "" : "mb-2"
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
          <p className="text-center text-sm text-slate-500">
            Order ID:{" "}
            <span className="font-semibold text-slate-700">
              {lastOrders.map((o) => o.id).join(", ")}
            </span>
          </p>
        )}
      </div>

      {/* Middle: scrollable items list + grand total */}
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto space-y-4 py-1 pr-1">
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
                  onDelete={
                    localCustomProducts.some((p) => p.id === product.id)
                      ? () => handleDeleteLocalProduct(product.id)
                      : undefined
                  }
                />
              ))}
            </div>
          </section>
        )}

        {!submitted && selectedItems.length > 0 && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">
                  Grand Total:
                </span>
                <span className="text-xl font-extrabold text-emerald-700">
                  ₱
                  {grandTotal.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
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

      {/* Bottom: submit bar — always visible */}
      <div className="shrink-0 pt-3">
        <SubmitBar
          selectedCount={selectedItems.length}
          totalCount={products.length}
          disabled={selectedItems.length === 0 || submitted || !readyToOrder}
          onSubmit={handleSubmit}
          embedded={embedded}
        />
      </div>
    </div>
  );

  if (isOrderingDisabled) {
    const closedCard = (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm max-w-lg mx-auto mt-10 space-y-5">
        <div className="rounded-full bg-amber-50 p-4 text-amber-600">
          <CalendarOff className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Ordering is Closed Today
          </h2>
          <p className="mt-2 text-sm text-slate-500 max-w-sm">
            Ordering is disabled every Tuesday for system maintenance and weekly
            order processing. Please place your orders on other days of the
            week.
          </p>
        </div>
      </div>
    );

    if (embedded) {
      return <div className="mx-auto w-full max-w-6xl p-4">{closedCard}</div>;
    }

    return (
      <div className="min-h-dvh bg-slate-50 pb-28">
        <OrderHeader
          clientName={clientName}
          onClientNameChange={setClientName}
        />
        <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
          {closedCard}
        </main>
      </div>
    );
  }

  const content = (
    <div className="w-full">
      {embedded ? (
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)] lg:h-full lg:min-h-0">
          {leftColumnContent}
          {rightPanel}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {leftColumnContent}
          {rightPanel}
        </div>
      )}
    </div>
  );

  if (embedded) {
    return <div className="mx-auto w-full max-w-6xl">{content}</div>;
  }

  return (
    <div className="min-h-dvh bg-slate-50 pb-28">
      <OrderHeader clientName={clientName} onClientNameChange={setClientName} />
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">{content}</main>
    </div>
  );
}
