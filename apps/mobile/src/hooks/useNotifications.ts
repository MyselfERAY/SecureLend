import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api';
import { NotificationsResponse, NotificationItem } from '../types';

const POLL_INTERVAL = 30000; // 30 seconds

export function useNotifications() {
  const { tokens } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!tokens) return;
    try {
      const res = await api<NotificationsResponse>('/api/v1/notifications?limit=50', {
        token: tokens.accessToken,
      });
      if (res.status === 'success' && res.data) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch { /* ignore */ }
  }, [tokens]);

  const fetchUnreadCount = useCallback(async () => {
    if (!tokens) return;
    try {
      const res = await api<{ unreadCount: number }>('/api/v1/notifications/unread-count', {
        token: tokens.accessToken,
      });
      if (res.status === 'success' && res.data) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch { /* ignore */ }
  }, [tokens]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!tokens) return;
    try {
      await api(`/api/v1/notifications/${notificationId}/read`, {
        method: 'PATCH',
        token: tokens.accessToken,
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  }, [tokens]);

  const markAllAsRead = useCallback(async () => {
    if (!tokens) return;
    try {
      await api('/api/v1/notifications/read-all', {
        method: 'PATCH',
        token: tokens.accessToken,
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })),
      );
      setUnreadCount(0);
    } catch { /* ignore */ }
  }, [tokens]);

  useEffect(() => {
    fetchNotifications().finally(() => setLoading(false));
  }, [fetchNotifications]);

  // Poll for unread count every 30s
  useEffect(() => {
    if (!tokens) return;
    intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tokens, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
