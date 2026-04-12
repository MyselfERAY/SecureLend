import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Platform, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/lib/auth-context';
import { api } from '../../src/lib/api';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { colors } from '../../src/theme/colors';
import { PaymentItem } from '../../src/types';

const DARK_NAVY = '#0a1628';
type FilterTab = 'ALL' | 'PENDING' | 'OVERDUE' | 'COMPLETED';

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: 'ALL', label: 'Tümü' },
  { key: 'PENDING', label: 'Bekleyen' },
  { key: 'OVERDUE', label: 'Geciken' },
  { key: 'COMPLETED', label: 'Ödenen' },
];

const STATUS_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  PENDING: { icon: 'time-outline', color: '#f59e0b', bg: '#fffbeb', label: 'Bekliyor' },
  OVERDUE: { icon: 'alert-circle', color: '#ef4444', bg: '#fef2f2', label: 'Gecikti' },
  COMPLETED: { icon: 'checkmark-circle', color: '#10b981', bg: '#ecfdf5', label: 'Ödendi' },
  PROCESSING: { icon: 'sync-outline', color: '#2563eb', bg: '#eff6ff', label: 'İşleniyor' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function PaymentsListScreen() {
  const { tokens } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('ALL');

  const loadPayments = useCallback(async () => {
    if (!tokens) return;
    try {
      const res = await api<PaymentItem[]>('/api/v1/payments/my', { token: tokens.accessToken });
      if (res.status === 'success' && res.data) setPayments(res.data);
    } catch { /* ignore */ }
  }, [tokens]);

  useEffect(() => {
    loadPayments().finally(() => setLoading(false));
  }, [loadPayments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  }, [loadPayments]);

  const filtered = payments.filter((p) => {
    if (filter === 'ALL') return true;
    if (filter === 'COMPLETED') return p.status === 'COMPLETED' || p.status === 'PROCESSING';
    return p.status === filter;
  });

  // Summary stats
  const pending = payments.filter((p) => p.status === 'PENDING').length;
  const overdue = payments.filter((p) => p.status === 'OVERDUE').length;
  const totalDue = payments
    .filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE')
    .reduce((sum, p) => sum + p.amount, 0);

  const renderPayment = useCallback(({ item }: { item: PaymentItem }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
    const isOverdue = item.status === 'OVERDUE';

    return (
      <TouchableOpacity
        style={[styles.card, isOverdue && styles.cardOverdue]}
        onPress={() => {
          if (item.contractId) {
            router.push(`/(tabs)/contracts/${item.contractId}`);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.cardIcon, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardProperty} numberOfLines={1}>{item.propertyTitle}</Text>
          <Text style={styles.cardPeriod}>{item.periodLabel}</Text>
          <View style={styles.cardDateRow}>
            <Ionicons name="calendar-outline" size={12} color={colors.gray[400]} />
            <Text style={styles.cardDate}>{formatDate(item.dueDate)}</Text>
            {item.paidAt && (
              <>
                <Ionicons name="checkmark" size={12} color="#10b981" style={{ marginLeft: 8 }} />
                <Text style={[styles.cardDate, { color: '#10b981' }]}>{formatDate(item.paidAt)}</Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.cardAmount, isOverdue && { color: '#ef4444' }]}>
            {item.amount.toLocaleString('tr-TR')} TL
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [router]);

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ödemelerim</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>{pending}</Text>
          <Text style={styles.statLabel}>Bekleyen</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>{overdue}</Text>
          <Text style={styles.statLabel}>Geciken</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.gray[900] }]}>
            {totalDue > 0 ? `${(totalDue / 1000).toFixed(0)}K` : '0'}
          </Text>
          <Text style={styles.statLabel}>Toplam TL</Text>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Payment List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderPayment}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.listContentEmpty,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gray[500]} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="wallet-outline" size={48} color={colors.gray[300]} />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === 'ALL' ? 'Henüz ödeme yok' : `${FILTERS.find(f => f.key === filter)?.label} ödeme yok`}
            </Text>
            <Text style={styles.emptySubtitle}>Ödeme geçmişiniz burada görünecek.</Text>
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
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, fontSize: 18, fontWeight: '700',
    color: '#ffffff', textAlign: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  statCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#0a1628', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  statValue: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, color: colors.gray[500], fontWeight: '500' },

  // Filter
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200],
  },
  filterChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  filterText: { fontSize: 13, fontWeight: '600', color: colors.gray[600] },
  filterTextActive: { color: '#ffffff' },

  // List
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  listContentEmpty: { flex: 1, justifyContent: 'center' },

  // Card
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: 16,
    padding: 14, marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: '#0a1628', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  cardOverdue: { borderLeftWidth: 3, borderLeftColor: '#ef4444' },
  cardIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  cardContent: { flex: 1 },
  cardProperty: { fontSize: 15, fontWeight: '600', color: colors.gray[900], marginBottom: 2 },
  cardPeriod: { fontSize: 13, color: colors.gray[500], marginBottom: 4 },
  cardDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardDate: { fontSize: 12, color: colors.gray[400] },
  cardRight: { alignItems: 'flex-end', marginLeft: 8 },
  cardAmount: { fontSize: 16, fontWeight: '700', color: colors.gray[900], marginBottom: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },

  // Empty
  emptyState: { alignItems: 'center', paddingHorizontal: 32 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.gray[100],
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.gray[700], marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: colors.gray[500], textAlign: 'center', lineHeight: 22 },
});
