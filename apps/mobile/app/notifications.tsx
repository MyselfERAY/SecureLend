import React, { useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Platform, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../src/hooks/useNotifications';
import { LoadingSpinner } from '../src/components/ui/LoadingSpinner';
import { colors } from '../src/theme/colors';
import { NotificationItem } from '../src/types';

const DARK_NAVY = '#0a1628';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const ICON_MAP: Record<string, { name: IoniconsName; color: string; bg: string }> = {
  KMH_APPROVED: { name: 'checkmark-circle', color: '#10b981', bg: '#ecfdf5' },
  KMH_REJECTED: { name: 'close-circle', color: '#ef4444', bg: '#fef2f2' },
  KMH_ONBOARDING_COMPLETE: { name: 'ribbon', color: '#2563eb', bg: '#eff6ff' },
  CONTRACT_CREATED: { name: 'document-text', color: '#2563eb', bg: '#eff6ff' },
  CONTRACT_SIGNED: { name: 'create', color: '#10b981', bg: '#ecfdf5' },
  CONTRACT_ACTIVATED: { name: 'checkmark-done', color: '#10b981', bg: '#ecfdf5' },
  CONTRACT_TERMINATED: { name: 'ban', color: '#ef4444', bg: '#fef2f2' },
  PAYMENT_DUE: { name: 'time', color: '#f59e0b', bg: '#fffbeb' },
  PAYMENT_OVERDUE: { name: 'alert-circle', color: '#ef4444', bg: '#fef2f2' },
  PAYMENT_COMPLETED: { name: 'wallet', color: '#10b981', bg: '#ecfdf5' },
  CHAT_MESSAGE: { name: 'chatbubble-ellipses', color: '#8b5cf6', bg: '#f5f3ff' },
  SYSTEM: { name: 'information-circle', color: '#2563eb', bg: '#eff6ff' },
};

const DEFAULT_ICON: { name: IoniconsName; color: string; bg: string } = {
  name: 'notifications-outline',
  color: colors.gray[500],
  bg: colors.gray[100],
};

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Az once';
  if (diffMin < 60) return `${diffMin} dk once`;
  if (diffHour < 24) return `${diffHour} saat once`;
  if (diffDay === 1) return 'Dun';
  if (diffDay < 30) return `${diffDay} gun once`;
  return new Date(dateStr).toLocaleDateString('tr-TR');
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { notifications, unreadCount, loading, refresh, markAsRead, markAllAsRead } =
    useNotifications();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handlePress = useCallback(
    async (item: NotificationItem) => {
      if (!item.isRead) {
        await markAsRead(item.id);
      }
      // Navigate to related entity if available
      if (item.entityType === 'ChatRoom' && item.entityId) {
        router.push({ pathname: '/chat/[roomId]', params: { roomId: item.entityId } });
      } else if (item.entityType === 'CONTRACT' && item.entityId) {
        router.push(`/(tabs)/contracts/${item.entityId}`);
      } else if (item.entityType === 'PAYMENT' && item.entityId) {
        router.push('/(tabs)/payments');
      } else if (item.entityType === 'KMH_APPLICATION' && item.entityId) {
        router.push('/(tabs)/bank');
      }
    },
    [markAsRead, router],
  );

  const renderItem = useCallback(
    ({ item }: { item: NotificationItem }) => {
      const iconInfo = ICON_MAP[item.type] || DEFAULT_ICON;
      return (
        <TouchableOpacity
          style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
          onPress={() => handlePress(item)}
          activeOpacity={0.7}
        >
          <View style={[styles.notifIcon, { backgroundColor: iconInfo.bg }]}>
            <Ionicons name={iconInfo.name} size={20} color={iconInfo.color} />
          </View>
          <View style={styles.notifContent}>
            <View style={styles.notifTitleRow}>
              <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]} numberOfLines={1}>
                {item.title}
              </Text>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.notifBody} numberOfLines={2}>
              {item.body}
            </Text>
            <Text style={styles.notifTime}>{formatTimeAgo(item.createdAt)}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [handlePress],
  );

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityLabel="Geri don"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirimler</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity style={styles.readAllBtn} onPress={markAllAsRead} activeOpacity={0.7}>
            <Text style={styles.readAllText}>Tumunu Oku</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.readAllPlaceholder} />
        )}
      </View>

      {/* List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.listContentEmpty,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gray[500]} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.gray[300]} />
            </View>
            <Text style={styles.emptyTitle}>Bildirim yok</Text>
            <Text style={styles.emptySubtitle}>
              Yeni bildirimleriniz burada gorunecek.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },

  // Header
  header: {
    backgroundColor: DARK_NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  readAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  readAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#60a5fa',
  },
  readAllPlaceholder: {
    width: 36,
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },

  // Notification Card
  notifCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#0a1628',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  notifCardUnread: {
    backgroundColor: '#f0f5ff',
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifContent: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[800],
    flex: 1,
  },
  notifTitleUnread: {
    fontWeight: '700',
    color: colors.gray[900],
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
    marginLeft: 8,
  },
  notifBody: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
    marginBottom: 6,
  },
  notifTime: {
    fontSize: 12,
    color: colors.gray[400],
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray[700],
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
  },
});
