import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/lib/auth-context';
import { api } from '../../src/lib/api';
import { Card } from '../../src/components/ui/Card';
import { Badge, getStatusBadge } from '../../src/components/ui/Badge';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { colors } from '../../src/theme/colors';
import { ContractSummary, PaymentItem } from '../../src/types';

export default function DashboardScreen() {
  const { user, tokens, logout } = useAuth();
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!tokens) return;
    try {
      const [cRes, pRes] = await Promise.all([
        api<ContractSummary[]>('/api/v1/contracts', { token: tokens.accessToken }),
        api<PaymentItem[]>('/api/v1/payments/my', { token: tokens.accessToken }),
      ]);
      if (cRes.status === 'success' && cRes.data) setContracts(cRes.data);
      if (pRes.status === 'success' && pRes.data) setPayments(pRes.data);
    } catch { /* ignore */ }
  }, [tokens]);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) return <LoadingSpinner />;

  const activeContracts = contracts.filter((c) => c.status === 'ACTIVE');
  const pendingPayments = payments.filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE');

  const roleLabels: Record<string, string> = {
    TENANT: 'Kiraci',
    LANDLORD: 'Ev Sahibi',
    ADMIN: 'Yonetici',
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Welcome */}
      <View style={styles.welcomeRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.welcome}>Hos geldiniz,</Text>
          <Text style={styles.userName}>{user?.fullName}</Text>
          <View style={styles.roleRow}>
            {user?.roles.map((r) => (
              <View key={r} style={styles.rolePill}>
                <Text style={styles.roleText}>{roleLabels[r] || r}</Text>
              </View>
            ))}
          </View>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={colors.gray[500]} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statGrid}>
        <StatCard title="Aktif Sozlesme" value={activeContracts.length} color={colors.primary[600]} icon="document-text" />
        <StatCard title="Bekleyen Odeme" value={pendingPayments.length} color={pendingPayments.some((p) => p.status === 'OVERDUE') ? colors.red[600] : colors.yellow[600]} icon="time" />
        <StatCard title="Toplam Sozlesme" value={contracts.length} color={colors.gray[600]} icon="documents" />
        <StatCard title="Roller" value={user?.roles.length || 0} color={colors.green[600]} icon="people" />
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Hizli Erisim</Text>
      <View style={styles.quickGrid}>
        <QuickAction title="Mulkler" icon="home-outline" onPress={() => router.push('/(tabs)/properties')} />
        <QuickAction title="Sozlesmeler" icon="document-text-outline" onPress={() => router.push('/(tabs)/contracts')} />
        <QuickAction title="Banka" icon="card-outline" onPress={() => router.push('/(tabs)/bank')} />
      </View>

      {/* Active Contracts */}
      {activeContracts.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Aktif Sozlesmeler</Text>
          {activeContracts.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => router.push(`/(tabs)/contracts/${c.id}`)}
            >
              <Card style={styles.contractCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{c.propertyTitle}</Text>
                  <Badge {...getStatusBadge(c.status)} />
                </View>
                <Text style={styles.cardMeta}>Kiraci: {c.tenantName}</Text>
                <Text style={styles.cardMeta}>Ev Sahibi: {c.landlordName}</Text>
                <Text style={styles.cardAmount}>₺{c.monthlyRent.toLocaleString('tr-TR')}/ay</Text>
              </Card>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Upcoming Payments */}
      {pendingPayments.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Yaklasan Odemeler</Text>
          {pendingPayments.slice(0, 5).map((p) => (
            <Card key={p.id} style={styles.paymentCard}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{p.propertyTitle}</Text>
                  <Text style={styles.cardMeta}>{p.periodLabel} - {new Date(p.dueDate).toLocaleDateString('tr-TR')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Badge {...getStatusBadge(p.status)} />
                  <Text style={styles.paymentAmount}>₺{p.amount.toLocaleString('tr-TR')}</Text>
                </View>
              </View>
            </Card>
          ))}
        </>
      )}

      {contracts.length === 0 && (
        <Card style={{ marginTop: 16 }}>
          <Text style={styles.emptyText}>Henuz sozlesmeniz bulunmuyor.</Text>
        </Card>
      )}
    </ScrollView>
  );
}

function StatCard({ title, value, color, icon }: { title: string; value: number; color: string; icon: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{title}</Text>
    </View>
  );
}

function QuickAction({ title, icon, onPress }: { title: string; icon: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickCard} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon as any} size={24} color={colors.primary[600]} />
      <Text style={styles.quickTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  content: { padding: 16, paddingBottom: 32 },
  welcomeRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  welcome: { fontSize: 14, color: colors.gray[500] },
  userName: { fontSize: 22, fontWeight: '800', color: colors.gray[900] },
  roleRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  rolePill: { backgroundColor: colors.primary[100], paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  roleText: { fontSize: 12, fontWeight: '600', color: colors.primary[700] },
  logoutBtn: { padding: 8 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, minWidth: '46%', backgroundColor: colors.white, borderRadius: 12, padding: 14,
    borderLeftWidth: 3, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  statValue: { fontSize: 28, fontWeight: '800', marginTop: 6 },
  statLabel: { fontSize: 12, color: colors.gray[500], marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.gray[800], marginBottom: 12, marginTop: 8 },
  quickGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: 12, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  quickTitle: { fontSize: 13, fontWeight: '600', color: colors.gray[700], marginTop: 8 },
  contractCard: { marginBottom: 10 },
  paymentCard: { marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.gray[900], flex: 1 },
  cardMeta: { fontSize: 13, color: colors.gray[500], marginTop: 4 },
  cardAmount: { fontSize: 17, fontWeight: '700', color: colors.primary[600], marginTop: 8 },
  paymentAmount: { fontSize: 16, fontWeight: '700', color: colors.gray[900], marginTop: 6 },
  emptyText: { fontSize: 14, color: colors.gray[500], textAlign: 'center', padding: 16 },
});
