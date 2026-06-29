import { weeklyProducts, type WeeklyProduct } from "./products";

const STORAGE_KEY = "occdc_weekly_products";
const OVERRIDES_KEY = "occdc_weekly_overrides";
const HIDDEN_KEY = "occdc_weekly_hidden";

type ProductOverride = Partial<Omit<WeeklyProduct, "id">>;

function getCustomProducts(): WeeklyProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WeeklyProduct[]) : [];
  } catch {
    return [];
  }
}

function getOverrides(): Record<string, ProductOverride> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ProductOverride>) : {};
  } catch {
    return {};
  }
}

function getHiddenIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function notify() {
  window.dispatchEvent(new Event("occdc-weekly-products-updated"));
}

function applyOverride(product: WeeklyProduct, override?: ProductOverride): WeeklyProduct {
  if (!override) return product;
  return { ...product, ...override };
}

export function getWeeklyProducts(): WeeklyProduct[] {
  const hidden = getHiddenIds();
  const overrides = getOverrides();
  const base = weeklyProducts
    .filter((p) => !hidden.has(p.id))
    .map((p) => applyOverride(p, overrides[p.id]));
  const custom = getCustomProducts().filter((p) => !hidden.has(p.id));
  return [...base, ...custom];
}

export function isCustomProduct(id: string): boolean {
  return getCustomProducts().some((p) => p.id === id);
}

export function addWeeklyProduct(product: Omit<WeeklyProduct, "id"> & { id?: string }): WeeklyProduct {
  const custom = getCustomProducts();
  const slug =
    product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "item";

  let id = product.id ?? slug;
  const allIds = new Set([...weeklyProducts.map((p) => p.id), ...custom.map((p) => p.id)]);
  if (allIds.has(id)) id = `${slug}-${Date.now()}`;

  const entry: WeeklyProduct = {
    id,
    name: product.name,
    defaultQty: product.defaultQty,
    unit: product.unit,
    note: product.note,
    category: product.category,
  };

  custom.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
  notify();
  return entry;
}

export function updateWeeklyProduct(id: string, data: ProductOverride): void {
  if (isCustomProduct(id)) {
    const custom = getCustomProducts().map((p) => (p.id === id ? { ...p, ...data } : p));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
  } else if (weeklyProducts.some((p) => p.id === id)) {
    const overrides = getOverrides();
    overrides[id] = { ...overrides[id], ...data };
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  }
  notify();
}

export function removeWeeklyProduct(id: string): void {
  if (isCustomProduct(id)) {
    const custom = getCustomProducts().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
  } else {
    const hidden = getHiddenIds();
    hidden.add(id);
    localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hidden]));
  }
  notify();
}

export function getCustomWeeklyProducts(): WeeklyProduct[] {
  return getCustomProducts();
}
