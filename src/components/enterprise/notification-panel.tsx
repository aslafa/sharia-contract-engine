"use client";

import * as React from "react";
import { Bell, Check, Clock, AlertTriangle, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  type: "sharia_alert" | "approval" | "system";
  unread: boolean;
}

export function NotificationPanel({
  notifications: initialNotifications = [],
  onClose,
}: {
  notifications?: NotificationItem[];
  onClose?: () => void;
}) {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(initialNotifications);
  const [isLoading, setIsLoading] = React.useState(false);

  // Fetch real notifications from database
  React.useEffect(() => {
    async function loadNotifs() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/v1/notifications");
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const mapped: NotificationItem[] = json.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            message: item.message,
            timeAgo: new Date(item.createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }) + " WIB",
            type: item.type === "REVIEW_REQUESTED" ? "approval" : item.type === "REVISION_REQUESTED" ? "sharia_alert" : "system",
            unread: !item.isRead,
          }));
          setNotifications(mapped);
        }
      } catch (err) {
        console.warn("Notifications fallback:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadNotifs();
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      await fetch("/api/v1/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MARK_ALL_READ" }),
      });
    } catch (e) {
      console.warn("Failed marking notifications read:", e);
    }
  };

  return (
    <div className="w-80 sm:w-96 rounded-lg border border-[#E2E8F0] bg-white shadow-dropdown text-xs text-[#172B4D]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">Pusat Notifikasi</span>
          {unreadCount > 0 && (
            <Badge variant="primary" className="text-[10px] h-4 px-1.5">
              {unreadCount} Baru
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[11px] text-[#00549c] hover:underline"
            >
              Tandai Dibaca
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-[#64748B] hover:text-[#172B4D] p-0.5 rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-[#E2E8F0] max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-[#64748B]">
            Tidak ada notifikasi baru.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3.5 flex gap-3 hover:bg-[#F5F8FC] transition-colors ${
                n.unread ? "bg-[#DCEAF5]/20" : ""
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {n.type === "approval" ? (
                  <ShieldCheck className="h-4 w-4 text-[#00549c]" />
                ) : n.type === "sharia_alert" ? (
                  <AlertTriangle className="h-4 w-4 text-[#E9A23B]" />
                ) : (
                  <Clock className="h-4 w-4 text-[#64748B]" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-1">
                  <h4 className="font-semibold text-[#172B4D]">{n.title}</h4>
                  {n.unread && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00549c] shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-[#64748B] leading-relaxed text-[11px]">
                  {n.message}
                </p>
                <p className="text-[10px] text-[#94A3B8] pt-0.5">{n.timeAgo}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#E2E8F0] px-4 py-2 text-center bg-[#F5F8FC]">
        <span className="text-[11px] font-medium text-[#00549c] cursor-pointer hover:underline">
          Lihat Riwayat Audit Lengkap
        </span>
      </div>
    </div>
  );
}

