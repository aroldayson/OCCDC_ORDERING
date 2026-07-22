"use client";

import { useMemo, useState, useEffect } from "react";
import type { WeeklyOrderRecord } from "../order/types";
import { updateOrderStatus } from "../order/orderStorage";
import {
  Bell,
  Check,
  Eye,
  Clock,
  Mail,
  MessageSquare,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";

interface NotificationsViewProps {
  orders: WeeklyOrderRecord[];
  onOrdersUpdated: () => void;
  onNotificationClick: (order: WeeklyOrderRecord) => void;
  isAdmin?: boolean;
  readOrderIds: string[];
  onMarkReadIds: (ids: string[]) => void;
  onMount?: () => void;
}

const categoryLabels: Record<string, string> = {
  vegetables: "Vegetables",
  fruits: "Fruits",
  meat: "Meat",
  fish: "Fish",
  egg: "Eggs",
  groceries: "Groceries",
  rice: "Rice",
  other_order: "Other",
};

function getRelativeTime(isoString: string) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(isoString).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status: string) {
  if (status === "accepted") return "Approved";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function NotificationsView({
  orders,
  onOrdersUpdated,
  onNotificationClick,
  isAdmin = true,
  readOrderIds,
  onMarkReadIds,
  onMount,
}: NotificationsViewProps) {
  const [filterTab, setFilterTab] = useState<"all" | "unread" | "read">("all");
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Call onMount once when the component is first rendered
  useEffect(() => {
    onMount?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filters the raw visible orders based on roles (pending for supplier, approved/recent for client)
  const displayOrders = useMemo(() => {
    return orders
      .filter((o) => {
        if (isAdmin) {
          const isPending = o.status === "pending";
          const isApproved =
            o.status === "accepted" ||
            o.status === "processing" ||
            o.status === "completed";
          const isRecent =
            Date.now() - new Date(o.createdAt).getTime() <
            7 * 24 * 60 * 60 * 1000;
          return isPending || (isApproved && isRecent);
        } else {
          const isApproved =
            o.status === "accepted" ||
            o.status === "processing" ||
            o.status === "completed";
          const isRecent =
            Date.now() - new Date(o.createdAt).getTime() <
            7 * 24 * 60 * 60 * 1000;
          return isApproved && isRecent;
        }
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [orders, isAdmin]);

  // Apply tab filters (All, Unread, Read)
  const filteredOrders = useMemo(() => {
    if (filterTab === "all") return displayOrders;
    if (filterTab === "unread") {
      return displayOrders.filter((o) => !readOrderIds.includes(o.id));
    }
    if (filterTab === "read") {
      return displayOrders.filter((o) => readOrderIds.includes(o.id));
    }
    return displayOrders;
  }, [displayOrders, filterTab, readOrderIds]);

  const handleMarkAllAsRead = () => {
    const allIds = displayOrders.map((o) => o.id);
    const updated = Array.from(new Set([...readOrderIds, ...allIds]));
    onMarkReadIds(updated);
    setFilterTab("read");
  };

  const handleQuickAccept = async (id: string) => {
    try {
      setActioningId(id);
      await updateOrderStatus(id, "accepted");
      onOrdersUpdated();
    } catch (error) {
      console.error("Failed to quick accept order:", error);
    } finally {
      setActioningId(null);
    }
  };

  const handleViewDetails = (order: WeeklyOrderRecord) => {
    onNotificationClick(order);
  };

  const handleMarkSingleRead = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    if (readOrderIds.includes(orderId)) {
      // Toggle back to unread
      onMarkReadIds(readOrderIds.filter((id) => id !== orderId));
    } else {
      onMarkReadIds([...readOrderIds, orderId]);
    }
  };

  return (
    <div className="w-full min-h-0 flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      {/* Tab Filters and Header Action Row */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-3 mb-4">
        <div className="flex gap-4 text-sm font-semibold">
          {(["all", "unread", "read"] as const).map((tab) => {
            const count =
              tab === "unread"
                ? displayOrders.filter((o) => !readOrderIds.includes(o.id))
                    .length
                : tab === "read"
                  ? displayOrders.filter((o) => readOrderIds.includes(o.id))
                      .length
                  : displayOrders.length;

            return (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`capitalize pb-3 -mb-[13px] border-b-2 transition-all ${
                  filterTab === tab
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab} {count > 0 ? `(${count})` : ""}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleMarkAllAsRead}
          className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 rounded-lg px-2.5 py-1.5 transition border border-slate-100 shadow-sm"
        >
          <Check className="h-3.5 w-3.5" />
          <span>Mark all as read</span>
        </button>
      </div>

      {/* Notifications List container */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-slate-50 p-4 text-slate-400">
              <Bell className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-700">
              No notifications found
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-xs">
              {filterTab === "unread"
                ? "You have read all your notifications!"
                : "No notifications fit the selected filter."}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const timeStr = getRelativeTime(order.createdAt);
            const isUnread = !readOrderIds.includes(order.id);
            const categoryLabel =
              categoryLabels[order.clientRole] || order.clientRole;

            return (
              <div
                key={order.id}
                onClick={() => handleViewDetails(order)}
                className={`group relative flex flex-col justify-between gap-4 rounded-xl border p-4 transition shadow-sm hover:shadow-md sm:flex-row sm:items-start cursor-pointer ${
                  isUnread
                    ? "border-blue-100 bg-blue-50/5"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* circular orange icon container */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                    <Bell className="h-5 w-5" strokeWidth={2} />
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Title row */}
                    <div className="flex flex-wrap items-center gap-2 pr-12">
                      <h4 className="font-bold text-slate-800 text-sm truncate">
                        Order ID: {order.id} —{" "}
                        {formatStatus(order.status)}
                      </h4>
                    </div>

                    {/* Description body text */}
                    <p className="mt-1 text-xs text-slate-600 font-medium">
                      {isAdmin ? (
                        <>
                          {order.clientName} submitted a{" "}
                          {categoryLabel.toLowerCase()} order with{" "}
                          <strong className="font-semibold text-slate-800">
                            {order.items.length} items
                          </strong>{" "}
                          amounting to{" "}
                          <strong className="font-semibold text-slate-800">
                            ₱
                            {order.totalPrice.toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                            })}
                          </strong>
                        </>
                      ) : (
                        <>
                          Your {categoryLabel.toLowerCase()} order with{" "}
                          <strong className="font-semibold text-slate-800">
                            {order.items.length} items
                          </strong>{" "}
                          is now{" "}
                          <strong className="text-emerald-600 font-bold capitalize">
                            {formatStatus(order.status).toLowerCase()}
                          </strong>
                          .
                        </>
                      )}
                    </p>

                    {/* Tag/Badge located below description, matching announcements */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="rounded-full bg-orange-50 border border-orange-100 px-2.5 py-0.5 text-[10px] font-bold text-orange-700 capitalize">
                        {categoryLabel}
                      </span>
                      {isAdmin && (
                        <span className="text-[10px] text-slate-400 font-medium font-sans">
                          Client: {order.clientName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Timestamp & Unread indicator */}
                <div className="flex flex-col sm:items-end justify-between self-stretch shrink-0 gap-2 min-w-0">
                  <span className="text-[10px] text-slate-400 font-medium sm:text-right">
                    {timeStr}
                  </span>

                  <div className="flex items-center gap-2 mt-auto self-end">
                    {/* Mark as read toggle dot */}
                    <button
                      onClick={(e) => handleMarkSingleRead(e, order.id)}
                      className={`h-4 w-4 rounded-full border flex items-center justify-center transition-all ${
                        isUnread
                          ? "border-orange-500 bg-orange-500"
                          : "border-slate-300 bg-transparent hover:border-slate-500"
                      }`}
                      title={isUnread ? "Mark as read" : "Mark as unread"}
                    >
                      {isUnread && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </button>

                    {isAdmin && (
                      <button
                        disabled={actioningId === order.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAccept(order.id);
                        }}
                        className="flex h-7 items-center justify-center gap-1 rounded-lg bg-blue-600 px-2.5 text-[10px] font-bold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <Check className="h-3 w-3" />
                        <span>
                          {actioningId === order.id ? "..." : "Accept"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
