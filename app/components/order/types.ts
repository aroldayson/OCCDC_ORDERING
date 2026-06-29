import type { OrderRole } from "./roles";

export type OrderItem = {
  productId: string;
  name: string;
  qty: number;
  unit: string;
  note?: string;
  category: string;
};

export type OrderStatus = "pending" | "processing" | "completed";

export type WeeklyOrderRecord = {
  id: string;
  clientName: string;
  clientRole: OrderRole;
  weekLabel: string;
  status: OrderStatus;
  items: OrderItem[];
  itemCount: number;
  createdAt: string;
  notes?: string;
};

export type OrderLine = {
  selected: boolean;
  qty: number;
};

export type OrderState = Record<string, OrderLine>;
