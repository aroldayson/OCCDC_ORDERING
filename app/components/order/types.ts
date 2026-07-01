import type { OrderRole } from "./roles";

export type OrderItem = {
  productId: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
  category: string;
};

export type OrderStatus = "pending" | "accepted" | "processing" | "completed" | "cancelled";

export type WeeklyOrderRecord = {
  id: string;
  clientName: string;
  clientRole: OrderRole;
  weekLabel: string;
  status: OrderStatus;
  items: OrderItem[];
  itemCount: number;
  createdAt: string;
  totalPrice: number;
};

export type OrderLine = {
  selected: boolean;
  qty: number;
};

export type OrderState = Record<string, OrderLine>;
