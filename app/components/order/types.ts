import type { OrderRole } from "./roles";

export type OrderItem = {
  productId: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
  category: string;
  deleted?: true;
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
  /** Optional admin-set delivery date (ISO date string, e.g. "2026-06-27"). Defaults to Wednesday of the following week (next Wednesday). */
  deliveryDate?: string;
  hasReceiptRecord?: boolean;
};

export type OrderLine = {
  selected: boolean;
  qty: number;
};

export type OrderState = Record<string, OrderLine>;
