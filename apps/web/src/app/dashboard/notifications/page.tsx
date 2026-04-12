'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  PAYMENT_DUE: {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'text-yellow-400 bg-yellow-500/20',
  },
  PAYMENT_COMPLETED: {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'text-emerald-400 bg-emerald-500/20',
  },
  CONTRACT_SIGNED: {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'text-blue-400 bg-blue-500/20',
  },
  PAYMENT_OVERDUE: {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    color: 'text-red-400 bg-red-500/20',
  },
};

const defaultTypeConfig = {
  icon: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  color: 'text-slate-400 bg-slate-500/20',
};

export default function NotificationsPage() {
  const { tokens } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokens?.accessToken) return;

    const load = async () => {
      try {
        const res = await api<NotificationsResponse>('/api/v1/notifications', { token: tokens.accessToken });
        if (res.status === 'success' && res.data) {
          setNotifications(res.data.notifications || []);
        }
      } catch {
        // Endpoint may not exist yet
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [tokens?.accessToken]);

  const markAsRead = async (id: string) => {
    if (!tokens?.accessToken) return;
    try {
      await api(`/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
        token: tokens.accessToken,
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    if (!tokens?.accessToken) return;
    try {
      await api('/api/v1/notifications/read-all', {
        method: 'PATCH',
        token: tokens.accessToken,
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          <span className="text-sm text-slate-400">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bildirimler</h1>
          {unreadCount > 0 && (
            <p className="mt-1 text-sm text-slate-400">{unreadCount} okunmamış bildirim</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700/50"
          >
            Tümünü Okundu İşaretle
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-700/50">
            <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="text-lg font-medium text-slate-300">Henüz bildiriminiz yok</div>
          <p className="mt-2 text-sm text-slate-500">Ödeme ve sözleşme bildirimleri burada görünecektir.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700/50 bg-[#0d1b2a] divide-y divide-slate-700/50">
          {notifications.map((n) => {
            const config = typeConfig[n.type] || defaultTypeConfig;
            return (
              <div
                key={n.id}
                className={`flex gap-4 p-4 transition ${
                  !n.isRead ? 'bg-blue-500/5' : ''
                }`}
                onClick={() => !n.isRead && markAsRead(n.id)}
                role={!n.isRead ? 'button' : undefined}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.color}`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`text-sm font-semibold ${!n.isRead ? 'text-white' : 'text-slate-300'}`}>
                      {n.title}
                    </div>
                    {!n.isRead && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-400">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {new Date(n.createdAt).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
