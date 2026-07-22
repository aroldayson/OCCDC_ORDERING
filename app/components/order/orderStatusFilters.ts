import type { OrderStatus } from "./types";

/** Filter value for the Order Summary status dropdown. */
export function orderStatusToOrdersFilter(status: OrderStatus): string {
  return status;
}

/**
 * Filter value for the Other Order category view
 * (pending | approved | completed | cancelled | all).
 */
export function orderStatusToCategoryFilter(status: OrderStatus): string {
  if (status === "pending") return "pending";
  if (status === "accepted" || status === "processing") return "approved";
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  return "all";
}

/** Resolve a category-view filter from a URL status param or raw order status. */
export function resolveCategoryFilterFromStatus(
  status: string | null | undefined,
): string {
  if (!status) return "pending";
  if (
    status === "pending" ||
    status === "approved" ||
    status === "completed" ||
    status === "cancelled" ||
    status === "all"
  ) {
    return status;
  }
  return orderStatusToCategoryFilter(status as OrderStatus);
}

/** Resolve an Order Summary filter from a URL status param or raw order status. */
export function resolveOrdersFilterFromStatus(
  status: string | null | undefined,
): string {
  if (!status || status === "all") return "all";
  if (
    status === "pending" ||
    status === "in_progress" ||
    status === "accepted" ||
    status === "processing" ||
    status === "completed" ||
    status === "cancelled"
  ) {
    return status;
  }
  return orderStatusToOrdersFilter(status as OrderStatus);
}
