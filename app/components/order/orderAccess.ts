import type { WeeklyOrderRecord } from "./types";

export function normalizeSchoolName(name: string): string {
  return name.trim().toUpperCase();
}

export function matchesSchool(
  clientName: string,
  schoolName: string | undefined,
): boolean {
  if (!schoolName?.trim()) return false;
  const a = normalizeSchoolName(clientName);
  const b = normalizeSchoolName(schoolName);
  return a === b || a.includes(b) || b.includes(a);
}

export function filterOrdersForSchool(
  orders: WeeklyOrderRecord[],
  schoolName: string | undefined,
): WeeklyOrderRecord[] {
  if (!schoolName?.trim()) return [];
  return orders.filter((order) => matchesSchool(order.clientName, schoolName));
}

export function filterOrdersForWeek(
  orders: WeeklyOrderRecord[],
  weekLabel: string,
): WeeklyOrderRecord[] {
  return orders.filter((order) => order.weekLabel === weekLabel);
}
