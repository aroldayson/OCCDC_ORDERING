import type { WeeklyProduct } from "../../order/products";
import { orderRoleLabels, orderRoles } from "../../order/roles";
import type { OrderRole } from "../../order/roles";
import type { OrderItem, WeeklyOrderRecord } from "../../order/types";

export const weekDateRange = "June 29 – July 3, 2026";

export function getCategoryDisplay(product: WeeklyProduct): string {
  if (product.id === "fish") return "Seafood";
  return orderRoleLabels[product.category] ?? product.category;
}

export function getCategoryDisplayFromItem(item: OrderItem): string {
  if (item.productId === "fish") return "Seafood";
  return orderRoleLabels[item.category as OrderRole] ?? item.category;
}

export function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type ClientGroup = {
  id: string;
  name: string;
  orderCount: number;
  orders: WeeklyOrderRecord[];
  categories: OrderRole[];
};

function uniqueCategories(orders: WeeklyOrderRecord[]): OrderRole[] {
  const seen = new Set<OrderRole>();
  for (const order of orders) {
    if (order.clientRole) seen.add(order.clientRole);
  }
  return orderRoles.filter((role) => seen.has(role));
}

export function buildClientGroups(orders: WeeklyOrderRecord[], registered: { id: string; name: string }[]): ClientGroup[] {
  const orderByClient = new Map<string, WeeklyOrderRecord[]>();

  for (const order of orders) {
    const list = orderByClient.get(order.clientName) ?? [];
    list.push(order);
    orderByClient.set(order.clientName, list);
  }

  const seen = new Set<string>();
  const groups: ClientGroup[] = [];

  for (const client of registered) {
    seen.add(client.name);
    const clientOrders = (orderByClient.get(client.name) ?? []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    groups.push({
      id: client.id,
      name: client.name,
      orderCount: clientOrders.length,
      orders: clientOrders,
      categories: uniqueCategories(clientOrders),
    });
  }

  for (const [name, clientOrders] of orderByClient) {
    if (seen.has(name)) continue;
    const sorted = clientOrders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    groups.push({
      id: name,
      name,
      orderCount: sorted.length,
      orders: sorted,
      categories: uniqueCategories(sorted),
    });
  }

  return groups.sort((a, b) => a.name.localeCompare(b.name));
}

export function exportItemsCsv(items: WeeklyProduct[]) {
  const header = ["Item", "Category", "Quantity", "Unit", "Notes"];
  const rows = items.map((item) => [
    item.name,
    getCategoryDisplay(item),
    String(item.defaultQty),
    item.unit,
    item.note ?? "",
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "weekly-items.csv";
  link.click();
  URL.revokeObjectURL(url);
}
