import json
from collections import defaultdict
from pathlib import Path

base = Path(__file__).resolve().parent.parent / "app" / "components" / "order"
data = json.loads((base / "excel-data.json").read_text(encoding="utf-8"))

lines = [
    'import type { OrderRole } from "./roles";',
    "",
    "export type ProductCategory = OrderRole;",
    "",
    "export type WeeklyProduct = {",
    "  id: string;",
    "  name: string;",
    "  defaultQty: number;",
    "  unit: string;",
    "  note?: string;",
    "  category: ProductCategory;",
    "};",
    "",
    'export const weekLabel = "WEEK 1 — June 29-July 3, 2026";',
    "",
    "export const weeklyProducts: WeeklyProduct[] = [",
]
for p in data["products"]:
    note = p.get("note")
    note_part = f", note: {json.dumps(note)}" if note else ""
    lines.append(
        f'  {{ id: {json.dumps(p["id"])}, name: {json.dumps(p["name"])}, defaultQty: {p["defaultQty"]}, unit: {json.dumps(p["unit"])}, category: {json.dumps(p["category"])}{note_part} }},'
    )
lines += ["];", "", 'export { orderRoleLabels as categoryLabels } from "./roles";', ""]
(base / "products.ts").write_text("\n".join(lines), encoding="utf-8")

roles_ts = '''export type OrderRole =
  | "vegetables_fruits"
  | "meat"
  | "fish_egg"
  | "groceries"
  | "other_order";

export const orderRoles: OrderRole[] = [
  "vegetables_fruits",
  "meat",
  "fish_egg",
  "groceries",
  "other_order",
];

export const orderRoleLabels: Record<OrderRole, string> = {
  vegetables_fruits: "Vegetables & Fruits",
  meat: "Meat",
  fish_egg: "Fish and Egg",
  groceries: "Groceries",
  other_order: "Other Order",
};

export const orderRoleColors: Record<OrderRole, string> = {
  vegetables_fruits: "bg-emerald-100 text-emerald-700",
  meat: "bg-rose-100 text-rose-700",
  fish_egg: "bg-sky-100 text-sky-700",
  groceries: "bg-amber-100 text-amber-700",
  other_order: "bg-indigo-100 text-indigo-700",
};
'''
(base / "roles.ts").write_text(roles_ts, encoding="utf-8")

school_lines = [
    "export type ClientRecord = {",
    "  id: string;",
    "  name: string;",
    "};",
    "",
    'const STORAGE_KEY = "occdc_clients";',
    'const STORAGE_VERSION = "excel-week1-v1";',
    'const VERSION_KEY = "occdc_clients_version";',
    "",
    "function seedClients(): ClientRecord[] {",
    "  return [",
]
for i, s in enumerate(data["schools"], 1):
    school_lines.append(f'    {{ id: "school-{i}", name: {json.dumps(s)} }},')
school_lines += [
    "  ];",
    "}",
    "",
    "function readClients(): ClientRecord[] {",
    '  if (typeof window === "undefined") return [];',
    "  try {",
    "    const version = localStorage.getItem(VERSION_KEY);",
    "    const raw = localStorage.getItem(STORAGE_KEY);",
    "    if (!raw || version !== STORAGE_VERSION) {",
    "      const seeded = seedClients();",
    "      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));",
    "      localStorage.setItem(VERSION_KEY, STORAGE_VERSION);",
    "      return seeded;",
    "    }",
    "    return JSON.parse(raw) as ClientRecord[];",
    "  } catch {",
    "    return [];",
    "  }",
    "}",
    "",
    "function notify() {",
    '  window.dispatchEvent(new Event("occdc-clients-updated"));',
    "}",
    "",
    "export function getClients(): ClientRecord[] {",
    "  return readClients();",
    "}",
    "",
    "export function getClientByName(name: string): ClientRecord | undefined {",
    "  return readClients().find((c) => c.name === name);",
    "}",
    "",
    "export function addClient(name: string): ClientRecord {",
    "  const clients = readClients();",
    "  const existing = clients.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());",
    "  if (existing) return existing;",
    "  const entry: ClientRecord = { id: `school-${Date.now()}`, name: name.trim() };",
    "  clients.push(entry);",
    "  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));",
    "  notify();",
    "  return entry;",
    "}",
    "",
]
(base / "clientStorage.ts").write_text("\n".join(school_lines), encoding="utf-8")

groups = defaultdict(list)
for line in data["orderLines"]:
    groups[(line["school"], line["category"])].append(line)

order_storage = [
    'import { weekLabel } from "./products";',
    'import type { OrderItem, WeeklyOrderRecord } from "./types";',
    'import type { OrderRole } from "./roles";',
    "",
    'const STORAGE_KEY = "occdc_orders";',
    'const STORAGE_VERSION = "excel-week1-v1";',
    'const VERSION_KEY = "occdc_orders_version";',
    "",
    "function slug(s: string) {",
    '  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");',
    "}",
    "",
    "function seedOrders(): WeeklyOrderRecord[] {",
    "  const now = Date.now();",
    "  return [",
]

oid = 1001
for (school, cat), lines_g in sorted(groups.items()):
    items = []
    for ln in lines_g:
        pid = __import__("re").sub(r"[^a-z0-9]+", "-", f"{cat}-{ln['name']}".lower()).strip("-")[:60]
        items.append(
            {
                "productId": pid,
                "name": ln["name"],
                "qty": ln["qty"],
                "unit": ln["unit"],
                "category": cat,
            }
        )
    status = "pending" if oid % 3 == 0 else ("processing" if oid % 3 == 1 else "completed")
    order_storage.append("    {")
    order_storage.append(f'      id: "ORD-{oid}",')
    order_storage.append(f"      clientName: {json.dumps(school)},")
    order_storage.append(f"      clientRole: {json.dumps(cat)},")
    order_storage.append("      weekLabel,")
    order_storage.append(f"      status: {json.dumps(status)},")
    order_storage.append(f"      itemCount: {len(items)},")
    order_storage.append(f"      createdAt: new Date(now - {oid * 3600000}).toISOString(),")
    order_storage.append(f"      items: {json.dumps(items, ensure_ascii=False)},")
    order_storage.append("    },")
    oid += 1

order_storage += [
    "  ];",
    "}",
    "",
    "function migrateOrder(order: WeeklyOrderRecord & { clientRole?: OrderRole }): WeeklyOrderRecord {",
    "  if (order.clientRole) return order;",
    '  const inferred = (order.items[0]?.category as OrderRole | undefined) ?? "groceries";',
    "  return { ...order, clientRole: inferred };",
    "}",
    "",
    "export function getOrders(): WeeklyOrderRecord[] {",
    '  if (typeof window === "undefined") return [];',
    "  try {",
    "    const version = localStorage.getItem(VERSION_KEY);",
    "    const raw = localStorage.getItem(STORAGE_KEY);",
    "    if (!raw || version !== STORAGE_VERSION) {",
    "      const seeded = seedOrders();",
    "      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));",
    "      localStorage.setItem(VERSION_KEY, STORAGE_VERSION);",
    "      return seeded;",
    "    }",
    "    const parsed = JSON.parse(raw) as WeeklyOrderRecord[];",
    "    return parsed.map(migrateOrder);",
    "  } catch {",
    "    return [];",
    "  }",
    "}",
    "",
    "export function saveOrder(order: WeeklyOrderRecord): void {",
    "  const orders = getOrders();",
    "  orders.unshift(order);",
    "  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));",
    '  window.dispatchEvent(new Event("occdc-orders-updated"));',
    "}",
    "",
    'export function updateOrderStatus(id: string, status: WeeklyOrderRecord["status"]): void {',
    "  const orders = getOrders().map((o) => (o.id === id ? { ...o, status } : o));",
    "  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));",
    '  window.dispatchEvent(new Event("occdc-orders-updated"));',
    "}",
    "",
    "export function deleteOrder(id: string): void {",
    "  const orders = getOrders().filter((o) => o.id !== id);",
    "  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));",
    '  window.dispatchEvent(new Event("occdc-orders-updated"));',
    "}",
    "",
    "export function updateOrder(updated: WeeklyOrderRecord): void {",
    "  const orders = getOrders().map((o) => (o.id === updated.id ? updated : o));",
    "  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));",
    '  window.dispatchEvent(new Event("occdc-orders-updated"));',
    "}",
    "",
    "export function createOrderId(): string {",
    "  const num = Math.floor(1000 + Math.random() * 9000);",
    "  return `ORD-${num}`;",
    "}",
    "",
    "export function buildOrderItems(",
    "  selected: { id: string; name: string; unit: string; note?: string; category: string }[],",
    "  quantities: Record<string, number>",
    "): OrderItem[] {",
    "  return selected.map((p) => ({",
    "    productId: p.id,",
    "    name: p.name,",
    "    qty: quantities[p.id] ?? 0,",
    "    unit: p.unit,",
    "    note: p.note,",
    "    category: p.category,",
    "  }));",
    "}",
    "",
]
(base / "orderStorage.ts").write_text("\n".join(order_storage), encoding="utf-8")
print(f"Done: {len(data['products'])} products, {len(groups)} orders, {len(data['schools'])} schools")
