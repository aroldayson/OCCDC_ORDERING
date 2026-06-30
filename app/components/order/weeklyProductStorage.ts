import { weeklyProducts, type WeeklyProduct } from "./products";

const STORAGE_KEY = "occdc_weekly_products";
const OVERRIDES_KEY = "occdc_weekly_overrides";
const HIDDEN_KEY = "occdc_weekly_hidden";

function getKeys(weekLabel?: string) {
  const suffix = weekLabel ? `_${weekLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")}` : "";
  return {
    storageKey: `${STORAGE_KEY}${suffix}`,
    overridesKey: `${OVERRIDES_KEY}${suffix}`,
    hiddenKey: `${HIDDEN_KEY}${suffix}`,
  };
}

type ProductOverride = Partial<Omit<WeeklyProduct, "id">>;

function getCustomProducts(weekLabel?: string): WeeklyProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const { storageKey } = getKeys(weekLabel);
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as WeeklyProduct[]) : [];
  } catch {
    return [];
  }
}

function getOverrides(weekLabel?: string): Record<string, ProductOverride> {
  if (typeof window === "undefined") return {};
  try {
    const { overridesKey } = getKeys(weekLabel);
    const raw = localStorage.getItem(overridesKey);
    return raw ? (JSON.parse(raw) as Record<string, ProductOverride>) : {};
  } catch {
    return {};
  }
}

function getHiddenIds(weekLabel?: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const { hiddenKey } = getKeys(weekLabel);
    const raw = localStorage.getItem(hiddenKey);
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

export function getWeeklyProducts(weekLabel?: string): WeeklyProduct[] {
  const hidden = getHiddenIds(weekLabel);
  const overrides = getOverrides(weekLabel);
  const base = weeklyProducts
    .filter((p) => !hidden.has(p.id))
    .map((p) => applyOverride(p, overrides[p.id]));
  const custom = getCustomProducts(weekLabel).filter((p) => !hidden.has(p.id));
  return [...base, ...custom];
}

export function isCustomProduct(id: string, weekLabel?: string): boolean {
  return getCustomProducts(weekLabel).some((p) => p.id === id);
}

export function addWeeklyProduct(
  product: Omit<WeeklyProduct, "id"> & { id?: string },
  weekLabel?: string,
): WeeklyProduct {
  const custom = getCustomProducts(weekLabel);
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
  const { storageKey } = getKeys(weekLabel);
  localStorage.setItem(storageKey, JSON.stringify(custom));
  notify();
  return entry;
}

export function updateWeeklyProduct(id: string, data: ProductOverride, weekLabel?: string): void {
  if (isCustomProduct(id, weekLabel)) {
    const custom = getCustomProducts(weekLabel).map((p) => (p.id === id ? { ...p, ...data } : p));
    const { storageKey } = getKeys(weekLabel);
    localStorage.setItem(storageKey, JSON.stringify(custom));
  } else if (weeklyProducts.some((p) => p.id === id)) {
    const overrides = getOverrides(weekLabel);
    overrides[id] = { ...overrides[id], ...data };
    const { overridesKey } = getKeys(weekLabel);
    localStorage.setItem(overridesKey, JSON.stringify(overrides));
  }
  notify();
}

export function removeWeeklyProduct(id: string, weekLabel?: string): void {
  if (isCustomProduct(id, weekLabel)) {
    const custom = getCustomProducts(weekLabel).filter((p) => p.id !== id);
    const { storageKey } = getKeys(weekLabel);
    localStorage.setItem(storageKey, JSON.stringify(custom));
  } else {
    const hidden = getHiddenIds(weekLabel);
    hidden.add(id);
    const { hiddenKey } = getKeys(weekLabel);
    localStorage.setItem(hiddenKey, JSON.stringify([...hidden]));
  }
  notify();
}

export function getCustomWeeklyProducts(weekLabel?: string): WeeklyProduct[] {
  return getCustomProducts(weekLabel);
}
