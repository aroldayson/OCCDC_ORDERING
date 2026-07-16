"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  Printer,
  FileSpreadsheet,
  Mail,
} from "lucide-react";
import {
  getWeeklyProducts,
  addWeeklyProduct,
  updateWeeklyProduct,
  removeWeeklyProduct,
} from "../order/weeklyProductStorage";
import type { WeeklyProduct } from "../order/products";
import ItemFormModal, { type ItemFormData } from "./weekly/ItemFormModal";
import WeekSelector from "./weekly/WeekSelector";
import {
  getJuneAugustWeeks,
  getCurrentOrNextPeriodWeek,
} from "../order/weekUtils";
import { useAuth } from "@/app/providers/AuthProvider";
import { isCategoryAllowed } from "../order/roles";
import { supabase } from "@/lib/supabase";

function formatProductId(id: string) {
  const match = id.match(/-(\d+)$/);
  if (match) {
    return `PRD-${match[1].slice(-4)}`;
  }
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return `PRD-${Math.abs(hash).toString().slice(0, 4).padStart(4, "0")}`;
}

const categoryLabels: Record<string, string> = {
  vegetables: "Vegetables",
  fruits: "Fruits",
  fish: "Fish",
  egg: "Egg",
  meat: "Meat",
  groceries: "Groceries",
  rice: "Rice",
  other_order: "Other Orders",
};

import { filterOrdersForWeek } from "../order/orderAccess";
import type { OrderStatus, WeeklyOrderRecord } from "../order/types";
import {
  printCatalog,
  printCatalogForSchool,
  exportCatalogExcel,
} from "./printOrder";

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-violet-50 text-violet-700 border-violet-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function ProductCatalogManager({
  orders,
}: {
  orders?: WeeklyOrderRecord[];
}) {
  const { user } = useAuth();
  const [selectedWeekLabel, setSelectedWeekLabel] = useState<string>(() => {
    const allWeeks = getJuneAugustWeeks();
    const periodWeek = getCurrentOrNextPeriodWeek();
    if (periodWeek !== null) return allWeeks[periodWeek - 1].weekLabel;
    return allWeeks[allWeeks.length - 1].weekLabel;
  });
  const [products, setProducts] = useState<WeeklyProduct[]>([]);
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<WeeklyProduct | null>(null);
  const [editingRow, setEditingRow] = useState<{
    product: WeeklyProduct;
    order?: WeeklyOrderRecord;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isEmailing, setIsEmailing] = useState(false);

  const handleEmailSOA = async (schoolName: string, weekLabel: string, weekOrders: WeeklyOrderRecord[]) => {
    if (weekOrders.length === 0) {
      alert("No active orders in this week to email.");
      return;
    }

    setIsEmailing(true);
    try {
      // 1. Resolve client profile email
      let clientEmail = "";
      try {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("email")
          .eq("school_name", schoolName)
          .eq("role", "client")
          .maybeSingle();
        if (profile?.email) {
          clientEmail = profile.email;
        }
      } catch (e) {
        console.error("Failed to query user email:", e);
      }

      // 2. Automate recipient selection: use registered login email if found, otherwise prompt
      let targetEmail = clientEmail ? clientEmail.trim() : "";
      if (!targetEmail) {
        targetEmail = prompt(
          `No registered user email found for ${schoolName}. Enter recipient email to send Statement of Account (${weekLabel}) to:`,
          ""
        ) || "";
      }
      
      if (!targetEmail || !targetEmail.trim()) {
        setIsEmailing(false);
        return;
      }

      // 3. Compile items list
      const aggregatedItems: {
        name: string;
        qty: number;
        unit: string;
        category: string;
        price: number;
        orderId?: string;
      }[] = [];

      weekOrders.forEach((o) =>
        o.items.forEach((i) => {
          if (i.deleted) return;
          aggregatedItems.push({
            name: i.name,
            qty: i.qty,
            unit: i.unit,
            category: i.category || "",
            price: i.price || 0,
            orderId: o.id,
          });
        })
      );

      aggregatedItems.sort((a, b) => {
        const orderCompare = (a.orderId || "").localeCompare(b.orderId || "");
        if (orderCompare !== 0) return orderCompare;
        return a.name.localeCompare(b.name);
      });

      const { resolveClientBySchoolName } = await import("../order/clientStorage");
      const clientRecord = await resolveClientBySchoolName(schoolName);

      const isAdmin = user?.role === "admin";

      // 4. Generate HTML Statement of Account
      const { generateClientSummaryHtml } = await import("./printOrder");
      const html = await generateClientSummaryHtml(
        schoolName,
        weekLabel,
        aggregatedItems,
        weekOrders,
        clientRecord || undefined,
        isAdmin
      );

      // 5. Send post request
      let gmailUser = localStorage.getItem("gmail_user") || "";
      let gmailPass = localStorage.getItem("gmail_pass") || "";

      const sendReq = async (u?: string, p?: string) => {
        return fetch("/api/send-soa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: targetEmail.trim(),
            subject: `Statement of Account — ${schoolName} — ${weekLabel}`,
            html,
            gmailUser: u,
            gmailPass: p,
          }),
        });
      };

      let res = await sendReq(gmailUser, gmailPass);
      let data = await res.json();

      if (res.status === 400 && data.needsCredentials) {
        const inputUser = prompt(
          "Enter your Gmail address to send from (e.g. sender@gmail.com):",
          "aroldayson3@gmail.com"
        );
        if (!inputUser || !inputUser.trim()) {
          setIsEmailing(false);
          return;
        }
        const inputPass = prompt(
          "Enter your Gmail 16-character App Password (not your regular Gmail password!).\n\n" +
          "How to generate a Gmail App Password:\n" +
          "1. Go to your Google Account (myaccount.google.com)\n" +
          "2. In Security, turn ON '2-Step Verification'\n" +
          "3. Search for 'App Passwords' in the search bar\n" +
          "4. Select App: 'Mail', Select Device: 'Other' (type 'OCCDC')\n" +
          "5. Click 'Generate' and paste the 16-character password here:"
        );
        if (!inputPass || !inputPass.trim()) {
          setIsEmailing(false);
          return;
        }

        const cleanedPass = inputPass.replace(/\s+/g, "");

        localStorage.setItem("gmail_user", inputUser.trim());
        localStorage.setItem("gmail_pass", cleanedPass);

        res = await sendReq(inputUser.trim(), cleanedPass);
        data = await res.json();
      }

      if (data.success) {
        alert(`Statement of Account successfully emailed to ${targetEmail}!`);
      } else {
        const errorMsg = data.error || "Unknown error";
        if (
          errorMsg.includes("535") ||
          errorMsg.toLowerCase().includes("login") ||
          errorMsg.toLowerCase().includes("password") ||
          errorMsg.toLowerCase().includes("credential")
        ) {
          localStorage.removeItem("gmail_user");
          localStorage.removeItem("gmail_pass");
          alert(`Failed to send email: ${errorMsg}\n\nGmail credentials have been reset. Click "Email SOA" again to register correct credentials.`);
        } else {
          alert(`Failed to send email: ${errorMsg}`);
        }
      }
    } catch (err: any) {
      console.error(err);
      alert(`An error occurred: ${err.message || err}`);
    } finally {
      setIsEmailing(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(),
  );

  const toggleCategory = (catGroupId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catGroupId)) next.delete(catGroupId);
      else next.add(catGroupId);
      return next;
    });
  };

  const handleDeleteMultiple = async () => {
    if (selectedIds.size === 0) return;
    if (
      confirm(
        `Are you sure you want to delete ${selectedIds.size} selected product(s) from the catalog?`,
      )
    ) {
      for (const id of selectedIds) {
        await removeWeeklyProduct(id, selectedWeekLabel);
      }
      setSelectedIds(new Set());
    }
  };

  const loadProducts = useCallback(() => {
    getWeeklyProducts(selectedWeekLabel).then(setProducts);
  }, [selectedWeekLabel]);

  useEffect(() => {
    loadProducts();
    window.addEventListener("occdc-weekly-products-updated", loadProducts);

    const channel = supabase
      .channel("realtime-products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "weekly_products" },
        (payload) => {
          loadProducts();

          // When a row is manually deleted from the DB (e.g. via Supabase dashboard),
          // cascade the removal to any orders that still reference that product.
          if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id?: string; week_label?: string };
            if (deleted.id && deleted.week_label) {
              import("../order/weeklyProductStorage").then(
                ({ removeWeeklyProduct }) => {
                  // removeWeeklyProduct handles the order-item cascade
                  removeWeeklyProduct(deleted.id!, deleted.week_label!);
                },
              );
            }
          }
        },
      )
      .subscribe();

    return () => {
      window.removeEventListener("occdc-weekly-products-updated", loadProducts);
      supabase.removeChannel(channel);
    };
  }, [loadProducts]);

  const allowedProducts = useMemo(() => {
    if (!user) return products;
    return products.filter((p) =>
      isCategoryAllowed(p.category, user.categories),
    );
  }, [products, user]);

  const rowItems = useMemo(() => {
    const list: {
      id: string;
      product: WeeklyProduct;
      order?: WeeklyOrderRecord;
      schoolName: string;
    }[] = [];
    const productsWithOrders = new Set<string>();

    if (orders) {
      const weekOrders = filterOrdersForWeek(orders, selectedWeekLabel);
      for (const order of weekOrders) {
        if (order.status === "cancelled") continue;
        for (const item of order.items) {
          if (item.deleted || item.productId.startsWith("delivery-fee-"))
            continue;

          let product = allowedProducts.find((p) => p.id === item.productId);
          if (!product) {
            const isAllowed = isCategoryAllowed(
              item.category || order.clientRole,
              user?.categories,
            );
            if (isAllowed) {
              product = {
                id: item.productId,
                name: item.name,
                defaultQty: item.qty,
                unit: item.unit || "pc",
                price: item.price || 0,
                category: (item.category ||
                  order.clientRole) as WeeklyProduct["category"],
              };
            }
          }

          if (product) {
            list.push({
              id: `${product.id}-${order.id}`,
              product: {
                ...product,
                defaultQty: item.qty,
                price: typeof item.price === "number" ? item.price : product.price,
              },
              order,
              schoolName: order.clientName,
            });
            productsWithOrders.add(product.id);
          }
        }
      }
    }

    for (const product of allowedProducts) {
      if (!productsWithOrders.has(product.id)) {
        list.push({
          id: `${product.id}-no-order`,
          product,
          schoolName: "Z_NO_ORDERS",
        });
      }
    }

    list.sort((a, b) => {
      const schoolDiff = a.schoolName.localeCompare(b.schoolName);
      if (schoolDiff !== 0) return schoolDiff;
      const catDiff = a.product.category.localeCompare(b.product.category);
      if (catDiff !== 0) return catDiff;
      return a.product.name.localeCompare(b.product.name);
    });
    return list;
  }, [allowedProducts, orders, selectedWeekLabel, user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rowItems;

    return rowItems.filter(
      (row) =>
        (row.schoolName !== "Z_NO_ORDERS" &&
          row.schoolName.toLowerCase().includes(q)) ||
        formatProductId(row.product.id).toLowerCase().includes(q) ||
        row.product.name.toLowerCase().includes(q) ||
        (categoryLabels[row.product.category] ?? row.product.category)
          .toLowerCase()
          .includes(q) ||
        row.product.defaultQty.toString().includes(q) ||
        row.product.unit.toLowerCase().includes(q) ||
        row.product.price.toString().includes(q) ||
        row.product.price
          .toLocaleString("en-PH", { minimumFractionDigits: 2 })
          .includes(q),
    );
  }, [rowItems, search]);

  const handleSaveItem = async (data: ItemFormData) => {
    const qty = parseFloat(data.defaultQty);
    const priceVal = parseFloat(data.price);
    if (
      !data.name.trim() ||
      isNaN(qty) ||
      qty <= 0 ||
      isNaN(priceVal) ||
      priceVal < 0
    )
      return;

    const payload = {
      name: data.name.trim(),
      defaultQty: qty,
      unit: data.unit.trim(),
      category: data.category,
      price: priceVal,
    };

    if (editingRow && editingRow.order) {
      const order = editingRow.order;
      const updatedItems = order.items.map((item) => {
        if (item.productId === editingRow.product.id && !item.deleted) {
          return {
            ...item,
            name: data.name.trim(),
            qty: qty,
            unit: data.unit.trim(),
            price: priceVal,
          };
        }
        return item;
      });

      const newTotal = updatedItems.reduce((sum, item) => {
        if (item.deleted) return sum;
        return sum + (item.qty * item.price);
      }, 0);

      const updatedOrder: WeeklyOrderRecord = {
        ...order,
        items: updatedItems,
        totalPrice: newTotal,
      };

      const { updateOrder } = await import("../order/orderStorage");
      await updateOrder(updatedOrder);

      setModalOpen(false);
      setEditingItem(null);
      setEditingRow(null);
      return;
    }

    if (editingItem) {
      await updateWeeklyProduct(editingItem.id, payload, selectedWeekLabel);
    } else {
      await addWeeklyProduct(payload, selectedWeekLabel);
    }
    setModalOpen(false);
    setEditingItem(null);
    setEditingRow(null);
  };

  const handleDeleteItem = async (productId: string, order?: WeeklyOrderRecord) => {
    if (order) {
      if (
        confirm(
          `Are you sure you want to remove this item from Order ${order.id}?`
        )
      ) {
        const updatedItems = order.items.map((item) => {
          if (item.productId === productId) {
            return { ...item, deleted: true as const };
          }
          return item;
        });

        const newTotal = updatedItems.reduce((sum, item) => {
          if (item.deleted) return sum;
          return sum + (item.qty * item.price);
        }, 0);

        const updatedOrder: WeeklyOrderRecord = {
          ...order,
          items: updatedItems,
          totalPrice: newTotal,
        };

        const { updateOrder } = await import("../order/orderStorage");
        await updateOrder(updatedOrder);
      }
    } else {
      if (
        confirm(
          "Are you sure you want to delete this product from the weekly catalog?",
        )
      ) {
        await removeWeeklyProduct(productId, selectedWeekLabel);
      }
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <WeekSelector
          selectedWeekLabel={selectedWeekLabel}
          onChange={setSelectedWeekLabel}
        />
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteMultiple}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedIds.size})
            </button>
          )}
          <button
            onClick={() => printCatalog(selectedWeekLabel, filtered)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 self-start sm:self-auto shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Print / Download PDF
          </button>
          <button
            onClick={() => exportCatalogExcel(selectedWeekLabel, filtered)}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 self-start sm:self-auto shadow-sm"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </button>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to reset/change the stored Gmail Sender address and App Password?")) {
                localStorage.removeItem("gmail_user");
                localStorage.removeItem("gmail_pass");
                alert("Gmail sender credentials have been reset. You will be prompted to register new credentials next time you email a Statement of Account.");
              }
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 shadow-sm"
            title="Reset cached Gmail Sender credentials"
          >
            Reset Gmail Credentials
          </button>
        </div>
      </div>

      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-slate-800">
            Weekly Product Catalog
          </h2>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              placeholder="Search products..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 sm:px-5 w-10">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={
                      filtered.length > 0 &&
                      filtered.every((row) => selectedIds.has(row.product.id))
                    }
                    onChange={() => {
                      const newSelected = new Set(selectedIds);
                      const allSelected =
                        filtered.length > 0 &&
                        filtered.every((row) =>
                          selectedIds.has(row.product.id),
                        );
                      if (allSelected) {
                        filtered.forEach((row) =>
                          newSelected.delete(row.product.id),
                        );
                      } else {
                        filtered.forEach((row) =>
                          newSelected.add(row.product.id),
                        );
                      }
                      setSelectedIds(newSelected);
                    }}
                  />
                </th>
                <th className="px-4 py-3 sm:px-5">Item</th>
                <th className="px-4 py-3 sm:px-5">Category</th>
                <th className="px-4 py-3 sm:px-5">Qty</th>
                <th className="px-4 py-3 sm:px-5">Unit</th>
                <th className="px-4 py-3 sm:px-5">Price</th>
                <th className="px-4 py-3 sm:px-5">Total Price</th>
                <th className="px-4 py-3 text-right sm:px-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    No products found in catalog.
                  </td>
                </tr>
              ) : (
                (() => {
                  const rows: React.ReactNode[] = [];
                  let currentGroupId: string | null = null;
                  let currentCategoryGroupId: string | null = null;

                  filtered.forEach((row) => {
                    const groupId =
                      row.schoolName === "Z_NO_ORDERS"
                        ? "no-order"
                        : `school-${row.schoolName}`;

                    const schoolOrders =
                      orders && row.schoolName !== "Z_NO_ORDERS"
                        ? filterOrdersForWeek(orders, selectedWeekLabel).filter(
                            (o) =>
                              o.clientName === row.schoolName &&
                              o.status !== "cancelled",
                          )
                        : [];

                    if (groupId !== currentGroupId) {
                      currentGroupId = groupId;
                      currentCategoryGroupId = null; // Reset category tracking for new school
                      const schoolLabel =
                        row.schoolName === "Z_NO_ORDERS"
                          ? "No Orders / Catalog Defaults"
                          : row.schoolName;
                      const isExpanded = expandedGroups.has(groupId);

                      rows.push(
                        <tr
                          key={`group-${groupId}`}
                          className="bg-slate-100/60 hover:bg-slate-100/90 transition-colors"
                        >
                          <td
                            colSpan={7}
                            className="px-4 py-3 border-y border-slate-200 cursor-pointer"
                            onClick={() => toggleGroup(groupId)}
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-slate-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-slate-500" />
                              )}
                              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                                {schoolLabel}
                              </span>
                              {schoolOrders.length > 0 && (
                                <span className="font-semibold text-slate-500 text-[10px]">
                                  {schoolOrders.length} Order
                                  {schoolOrders.length !== 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </td>
                          {row.schoolName !== "Z_NO_ORDERS" && (
                            <td className="px-3 py-2 border-y border-slate-200 text-right w-24">
                              <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const schoolRows = filtered.filter(
                                      (r) => r.schoolName === row.schoolName,
                                    );
                                    printCatalogForSchool(
                                      selectedWeekLabel,
                                      row.schoolName,
                                      schoolRows,
                                    );
                                  }}
                                  title={`Print ${schoolLabel}`}
                                  className="inline-flex items-center justify-center rounded-lg p-1.5 text-blue-600 hover:bg-blue-100 transition"
                                >
                                  <Printer className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEmailSOA(row.schoolName, selectedWeekLabel, schoolOrders);
                                  }}
                                  disabled={isEmailing}
                                  title={`Email Statement of Account for ${schoolLabel}`}
                                  className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
                                >
                                  <Mail className="h-4 w-4 text-slate-500" />
                                </button>
                              </div>
                            </td>
                          )}
                          {row.schoolName === "Z_NO_ORDERS" && (
                            <td className="border-y border-slate-200" />
                          )}
                        </tr>,
                      );
                    }

                    if (!expandedGroups.has(currentGroupId)) {
                      return; // Skip rendering rows for this group if it's not expanded
                    }

                    // Render Category Sub-header if it changes within this school
                    const catGroupId = `${currentGroupId}-${row.product.category}`;
                    const isCatCollapsed = collapsedCategories.has(catGroupId);
                    if (catGroupId !== currentCategoryGroupId) {
                      currentCategoryGroupId = catGroupId;

                      rows.push(
                        <tr
                          key={`cat-header-${catGroupId}`}
                          className="bg-slate-50/30 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors select-none"
                          onClick={() => toggleCategory(catGroupId)}
                        >
                          <td
                            colSpan={8}
                            className="pl-8 pr-4 py-2 font-bold text-[10px] text-slate-500 uppercase tracking-wider bg-slate-50/20"
                          >
                            <div className="flex items-center gap-2">
                              {isCatCollapsed ? (
                                <ChevronRight className="h-3 w-3 text-slate-400" />
                              ) : (
                                <ChevronDown className="h-3 w-3 text-slate-400" />
                              )}
                              <span>
                                {categoryLabels[row.product.category] ??
                                  row.product.category}
                              </span>
                            </div>
                          </td>
                        </tr>,
                      );
                    }

                    if (isCatCollapsed) {
                      return; // Skip rendering items under this category if collapsed
                    }

                    rows.push(
                      <tr
                        key={row.id}
                        className="border-b border-slate-50 hover:bg-slate-50/80"
                      >
                        <td className="px-4 py-3 sm:px-5">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={selectedIds.has(row.product.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedIds);
                              if (e.target.checked) {
                                newSelected.add(row.product.id);
                              } else {
                                newSelected.delete(row.product.id);
                              }
                              setSelectedIds(newSelected);
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 sm:px-5">
                          <div className="flex flex-col">
                            <span
                              className={`font-medium ${
                                !row.product.price || row.product.price === 0
                                  ? "text-red-600 underline decoration-red-500 decoration-2"
                                  : "text-slate-800"
                              }`}
                            >
                              {row.product.name}
                            </span>
                            {row.order && (
                              <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                                Order:{" "}
                                <span className="font-semibold text-slate-600">
                                  {row.order.id}
                                </span>{" "}
                                (
                                {row.order.status === "pending"
                                  ? "Pending Approval"
                                  : row.order.status}
                                )
                              </span>
                            )}
                          </div>
                          {(!row.product.price || row.product.price === 0) && (
                            <span className="ml-2 text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 uppercase tracking-wider inline-block mt-1">
                              No Price
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 sm:px-5">
                          {categoryLabels[row.product.category] ??
                            row.product.category}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800 sm:px-5">
                          {row.product.defaultQty}
                        </td>
                        <td className="px-4 py-3 text-slate-600 sm:px-5">
                          {row.product.unit}
                        </td>
                        <td
                          className={`px-4 py-3 font-semibold sm:px-5 ${
                            !row.product.price || row.product.price === 0
                              ? "text-red-500"
                              : "text-slate-800"
                          }`}
                        >
                          ₱
                          {row.product.price.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-3 font-semibold sm:px-5 text-slate-800">
                          ₱
                          {(
                            (row.product.defaultQty || 0) *
                            (row.product.price || 0)
                          ).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-3 sm:px-5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                               onClick={() => {
                                 setEditingRow({
                                   product: row.product,
                                   order: row.order,
                                 });
                                 setEditingItem(row.product);
                                 setModalOpen(true);
                               }}
                               className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                               aria-label={`Edit ${row.product.name}`}
                             >
                               <Pencil className="h-4 w-4" />
                             </button>
                             <button
                               onClick={() => handleDeleteItem(row.product.id, row.order)}
                               disabled={
                                 !row.product.price || row.product.price === 0
                               }
                               title={
                                 !row.product.price || row.product.price === 0
                                   ? "Set a price before deleting"
                                   : `Delete ${row.product.name}`
                               }
                               className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                               aria-label={`Delete ${row.product.name}`}
                             >
                               <Trash2 className="h-4 w-4" />
                             </button>
                          </div>
                        </td>
                      </tr>,
                    );
                  });
                  return rows;
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ItemFormModal
        open={modalOpen}
        editing={editingItem}
        allowedCategories={user?.categories}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
          setEditingRow(null);
        }}
        onSave={handleSaveItem}
        disablePriceEdit={false}
      />
    </div>
  );
}
