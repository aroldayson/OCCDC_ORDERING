"use client";

import { useEffect } from "react";
import { supabase, type UserProfile } from "@/lib/supabase";
import { isCategoryAllowed } from "@/app/components/order/roles";

type RealtimePayload = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, unknown>;
  old: Record<string, unknown>;
};

export type NotificationToast = {
  message: string;
  type: "success" | "info";
};

function getPayloadField(
  record: Record<string, unknown>,
  snakeKey: string,
  camelKey: string,
) {
  return (record[snakeKey] ?? record[camelKey]) as string | undefined;
}

function describeNotification(
  payload: RealtimePayload,
  isAdmin: boolean,
  user: UserProfile | null,
): NotificationToast | null {
  if (payload.eventType === "INSERT") {
    const clientRole = getPayloadField(payload.new, "client_role", "clientRole");
    const clientName = getPayloadField(payload.new, "client_name", "clientName");

    if (isAdmin && clientName) {
      if (
        !user?.categories ||
        user.categories.length === 0 ||
        (clientRole &&
          isCategoryAllowed(
            clientRole as Parameters<typeof isCategoryAllowed>[0],
            user.categories,
          ))
      ) {
        return {
          message: `New order from ${clientName}!`,
          type: "info",
        };
      }
    }
    return null;
  }

  if (payload.eventType === "UPDATE") {
    const clientName = getPayloadField(payload.new, "client_name", "clientName");
    const newStatus = payload.new.status as string | undefined;
    const oldStatus = payload.old?.status as string | undefined;

    if (!isAdmin && user?.school_name && clientName === user.school_name) {
      const isApproved =
        newStatus === "accepted" ||
        newStatus === "processing" ||
        newStatus === "completed";
      const statusChanged = !oldStatus || oldStatus !== newStatus;
      if (isApproved && statusChanged) {
        return {
          message: "Your order has been approved by the supplier!",
          type: "success",
        };
      }
    }
  }

  return null;
}

type UseRealtimeOrderNotificationsOptions = {
  enabled: boolean;
  isAdmin: boolean;
  user: UserProfile | null;
  onOrdersChanged: (options?: { silent?: boolean }) => void | Promise<void>;
  onNotification?: (toast: NotificationToast) => void;
};

export function useRealtimeOrderNotifications({
  enabled,
  isAdmin,
  user,
  onOrdersChanged,
  onNotification,
}: UseRealtimeOrderNotificationsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleOrdersUpdated = () => {
      void onOrdersChanged({ silent: true });
    };

    window.addEventListener("occdo-orders-updated", handleOrdersUpdated);

    const channel = supabase
      .channel("realtime-order-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          void onOrdersChanged({ silent: true });

          const toast = describeNotification(
            payload as RealtimePayload,
            isAdmin,
            user,
          );
          if (toast) {
            onNotification?.(toast);
          }
        },
      )
      .subscribe();

    return () => {
      window.removeEventListener("occdo-orders-updated", handleOrdersUpdated);
      supabase.removeChannel(channel);
    };
  }, [enabled, isAdmin, user, onOrdersChanged, onNotification]);
}
