export type OrderRole =
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
