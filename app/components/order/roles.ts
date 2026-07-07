export type OrderRole =
  | "all"
  | "vegetables"
  | "fruits"
  | "fish"
  | "egg"
  | "meat"
  | "groceries"
  | "rice"
  | "other_order";

export const orderRoles: OrderRole[] = [
  "all",
  "vegetables",
  "fruits",
  "fish",
  "egg",
  "meat",
  "groceries",
  "rice",
  "other_order",
];

export const orderRoleLabels: Record<OrderRole, string> = {
  all: "All",
  vegetables: "Vegetables",
  fruits: "Fruits",
  fish: "Fish",
  egg: "Egg",
  meat: "Meat",
  groceries: "Groceries",
  rice: "Rice",
  other_order: "Other Order",
};

export const orderRoleColors: Record<OrderRole, string> = {
  all: "bg-slate-100 text-slate-700",
  vegetables: "bg-emerald-100 text-emerald-700",
  fruits: "bg-teal-100 text-teal-700",
  fish: "bg-sky-100 text-sky-700",
  egg: "bg-blue-100 text-blue-700",
  meat: "bg-rose-100 text-rose-700",
  groceries: "bg-amber-100 text-amber-700",
  rice: "bg-orange-50 text-orange-700",
  other_order: "bg-indigo-100 text-indigo-700",
};

export function isCategoryAllowed(catalogCategory: string, userCategories?: string[]): boolean {
  if (!userCategories || userCategories.length === 0) return true;

  if (catalogCategory === "other_order") {
    return false;
  }
  return userCategories.includes(catalogCategory);
}

export function getSupplierCatalogCategory(categories?: string[]): OrderRole {
  if (!categories || categories.length === 0) return "other_order";
  return categories[0] as OrderRole;
}
