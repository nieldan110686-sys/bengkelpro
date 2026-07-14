"use client";

import { useEffect, useState, useCallback } from "react";

export interface Notification {
  id: string;
  type: "low_stock" | "new_wo" | "wo_completed";
  message: string;
  link?: string;
  timestamp: number;
}

const POLL_INTERVAL = 30000; // 30 detik

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      if (data.notifications?.length > 0) {
        // Merge tanpa duplikasi
        setNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const newOnes = data.notifications.filter((n: Notification) => !existingIds.has(n.id));
          return [...newOnes, ...prev].slice(0, 20);
        });
        setUnreadCount((prev) => prev + data.notifications.length);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  function markAllRead() {
    setUnreadCount(0);
  }

  function clearNotifications() {
    setNotifications([]);
    setUnreadCount(0);
  }

  return { notifications, unreadCount, markAllRead, clearNotifications };
}
