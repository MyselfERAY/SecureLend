import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/lib/auth-context';
import { api } from '../../src/lib/api';
import { Button } from '../../src/components/ui/Button';
import { Badge, getStatusBadge } from '../../src/components/ui/Badge';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../src/components/EmptyState';
import { colors } from '../../src/theme/colors';
import { KmhApplication, BankAccount, Transaction } from '../../src/types';

const DARK_NAVY = '#0a1628';

const employmentOptions = [
  { value: 'EMPLOYED', label: 'Çalışan', icon: 'briefcase' },
  { value: 'SELF_EMPLOYED', label: 'Serbest Meslek', icon: 'person' },
  { value: 'RETIRED', label: 'Emekli', icon: 'heart' },
  { value: 'STUDENT', label: 'Öğrenci', icon: 'school' },
  { value: 'UNEMPLOYED', label: 'İşsiz', icon: 'search' },
];

export default function BankScreen() {
  const { tokens } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'kmh' | 'accounts'>('kmh');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // KMH
  const [applications, setApplications] = useState<KmhApplication[]>([]);

  // Accounts
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!tokens) return;
    const [kmhRes, accRes] = await Promise.all([
      api<KmhApplication[]>('/api/v1/bank/kmh/my-applications', { token: tokens.accessToken }),
      api<BankAccount[]>('/api/v1/bank/accounts', { token: tokens.accessToken }),
    ]);
    if (kmhRes.status === 'success' && kmhRes.data) setApplications(kmhRes.data);
    if (accRes.status === 'success' && accRes.data) setAccounts(accRes.data);
  }, [tokens]);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const loadTransactions = async (accountId: string) => {
    if (!tokens) return;
    setSelectedAccount(accountId === selectedAccount ? null : accountId);
    if (accountId === selectedAccount) return;
    setTxLoading(true);
    const res = await api<Transaction[]>(`/api/v1/bank/accounts/${accountId}/transactions`, { token: tokens.accessToken });
    if (res.status === 'success' && res.data) setTransactions(res.data);
    setTxLoading(false);
  };

  if (loading) return <LoadingSpinner />;

  const canApply = !applications.some((a) => a.status === 'PENDING' || (a.status === 'APPROVED' && !a.onboardingCompleted));
  const needsOnboarding = applications.find((a) => a.status === 'APPROVED' && !a.onboardingCompleted);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
      showsVerticalScrollIndicator={false}
    >
      {/* Segmented Control */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segment, tab === 'kmh' && styles.segmentActive]}
          onPress={() => setTab('kmh')}
          activeOpacity={0.7}
        >
          <Text style={[styles.segmentText, tab === 'kmh' && styles.segmentTextActive]}>Güvence Başvuruları</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, tab === 'accounts' && styles.segmentActive]}
          onPress={() => setTab('accounts')}
          activeOpacity={0.7}
        >
          <Text style={[styles.segmentText, tab === 'accounts' && styles.segmentTextActive]}>Hesaplarım</Text>
        </TouchableOpacity>
      </View>

      {tab === 'kmh' && (
        <>
          {/* Onboarding Alert */}
          {needsOnboarding && (
            <View style={styles.onboardingCard}>
              <View style={styles.onboardingHeader}>
                <View style={styles.onboardingIconWrap}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.onboardingTitle}>Güvence Başvurunuz Onaylandı!</Text>
                  <Text style={styles.onboardingLimit}>
                    Onaylanan Limit: {needsOnboarding.approvedLimit?.toLocaleString('tr-TR')} TL
                  </Text>
                </View>
              </View>
              {/* Progress bar */}
              <View style={styles.onboardingProgressTrack}>
                <View style={[styles.onboardingProgressFill, { width: '25%' }]} />
              </View>
              <Text style={styles.onboardingProgressLabel}>Dijital onboarding devam ediyor</Text>
              <Button
                title="Devam Et"
                variant="success"
                size="sm"
                onPress={() => router.push({ pathname: '/kmh/onboarding', params: { applicationId: needsOnboarding.id } })}
                style={{ marginTop: 12 }}
              />
            </View>
          )}

          {/* Apply Button - navigates to dedicated flow */}
          {canApply && (
            <TouchableOpacity
              style={styles.applyCard}
              onPress={() => router.push('/kmh/apply')}
              activeOpacity={0.7}
            >
              <View style={styles.applyIcon}>
                <Ionicons name="add-circle" size={24} color="#2563eb" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.applyTitle}>Banka Güvence Hesabı Aç</Text>
                <Text style={styles.applySubtitle}>Kira güvence hesabı oluşturun</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[300]} />
            </TouchableOpacity>
          )}

          {/* Application History */}
          <Text style={styles.sectionTitle}>Başvuru Geçmişi</Text>
          {applications.length === 0 ? (
            <EmptyState
              icon="card-outline"
              title="Henüz güvence başvurunuz yok"
              subtitle="Banka güvencesi kefil yerine geçer — hemen başvurun"
            />
          ) : (
            applications.map((app) => {
              const isApprovedNotOnboarded = app.status === 'APPROVED' && !app.onboardingCompleted;
              return (
                <View key={app.id} style={styles.appCard}>
                  <View style={styles.appHeader}>
                    <Text style={styles.appDate}>{new Date(app.createdAt).toLocaleDateString('tr-TR')}</Text>
                    <Badge {...getStatusBadge(app.status)} />
                  </View>
                  <View style={styles.appDetails}>
                    <View style={styles.appDetailRow}>
                      <Text style={styles.appDetailLabel}>İstihdam</Text>
                      <Text style={styles.appDetailValue}>{employmentOptions.find((o) => o.value === app.employmentStatus)?.label}</Text>
                    </View>
                    <View style={styles.appDetailRow}>
                      <Text style={styles.appDetailLabel}>Gelir</Text>
                      <Text style={styles.appDetailValue}>{app.monthlyIncome.toLocaleString('tr-TR')} TL</Text>
                    </View>
                    <View style={styles.appDetailRow}>
                      <Text style={styles.appDetailLabel}>Kira</Text>
                      <Text style={styles.appDetailValue}>{app.estimatedRent.toLocaleString('tr-TR')} TL</Text>
                    </View>
                  </View>
                  {app.approvedLimit && (
                    <View style={styles.appLimitRow}>
                      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                      <Text style={styles.appLimitText}>Onaylanan Limit: {app.approvedLimit.toLocaleString('tr-TR')} TL</Text>
                    </View>
                  )}
                  {app.bankAccount && (
                    <View style={styles.appAccountRow}>
                      <Ionicons name="card" size={16} color="#2563eb" />
                      <Text style={styles.appAccountText}>{app.bankAccount.accountNumber}</Text>
                    </View>
                  )}
                  {app.rejectionReason && (
                    <Text style={styles.rejectText}>{app.rejectionReason}</Text>
                  )}
                  {/* Onboarding progress for approved apps */}
                  {isApprovedNotOnboarded && (
                    <TouchableOpacity
                      style={styles.continueBtn}
                      onPress={() => router.push({ pathname: '/kmh/onboarding', params: { applicationId: app.id } })}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="arrow-forward-circle" size={18} color="#2563eb" />
                      <Text style={styles.continueBtnText}>Onboarding&apos;e Devam Et</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </>
      )}

      {tab === 'accounts' && (
        <>
          {accounts.length === 0 ? (
            <EmptyState
              icon="wallet-outline"
              title="Henüz banka hesabınız yok"
              subtitle="Güvence hesabı açarak kira ödemelerinizi garanti altına alın"
            />
          ) : (
            accounts.map((acc) => (
              <View key={acc.accountId}>
                <TouchableOpacity
                  style={styles.accountCard}
                  onPress={() => loadTransactions(acc.accountId)}
                  activeOpacity={0.7}
                >
                  <View style={styles.accountCardTop}>
                    <View style={styles.accountCardIcon}>
                      <Ionicons name="card" size={20} color="#ffffff" />
                    </View>
                    <View style={styles.accountCardTopRight}>
                      <Text style={styles.accountNumber}>{acc.accountNumber}</Text>
                      <Text style={styles.accountCurrency}>{acc.currency}</Text>
                    </View>
                  </View>
                  <View style={styles.accountBalances}>
                    <View style={styles.accountBalanceItem}>
                      <Text style={styles.accountBalanceLabel}>Bakiye</Text>
                      <Text style={styles.accountBalance}>{acc.balance.toLocaleString('tr-TR')} TL</Text>
                    </View>
                    <View style={styles.accountBalanceItem}>
                      <Text style={styles.accountBalanceLabel}>Kullanılabilir</Text>
                      <Text style={styles.accountAvailable}>{acc.availableBalance.toLocaleString('tr-TR')} TL</Text>
                    </View>
                    {acc.creditLimit != null && (
                      <View style={styles.accountBalanceItem}>
                        <Text style={styles.accountBalanceLabel}>Limit</Text>
                        <Text style={styles.accountLimit}>{acc.creditLimit.toLocaleString('tr-TR')} TL</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.accountExpandRow}>
                    <Text style={styles.accountExpandText}>
                      {selectedAccount === acc.accountId ? 'İşlemleri gizle' : 'İşlemleri göster'}
                    </Text>
                    <Ionicons
                      name={selectedAccount === acc.accountId ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={colors.gray[400]}
                    />
                  </View>
                </TouchableOpacity>

                {/* Transactions */}
                {selectedAccount === acc.accountId && (
                  <View style={styles.txContainer}>
                    {txLoading ? (
                      <LoadingSpinner text="İşlemler yükleniyor..." size="small" inline />
                    ) : transactions.length === 0 ? (
                      <Text style={styles.txEmpty}>İşlem bulunamadı.</Text>
                    ) : (
                      transactions.map((tx) => (
                        <View key={tx.id} style={styles.txRow}>
                          <View style={[styles.txIcon, { backgroundColor: tx.direction === 'IN' ? '#ecfdf5' : '#fef2f2' }]}>
                            <Ionicons
                              name={tx.direction === 'IN' ? 'arrow-down' : 'arrow-up'}
                              size={16}
                              color={tx.direction === 'IN' ? '#10b981' : '#ef4444'}
                            />
                          </View>
                          <View style={styles.txInfo}>
                            <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                            <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleString('tr-TR')}</Text>
                          </View>
                          <Text style={[styles.txAmount, { color: tx.direction === 'IN' ? '#10b981' : '#ef4444' }]}>
                            {tx.direction === 'IN' ? '+' : '-'}{tx.amount.toLocaleString('tr-TR')} TL
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            ))
          )}
        </>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 20, paddingBottom: 32 },

  // Segmented Control
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: 14,
    padding: 3,
    marginBottom: 20,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.white,
    ...Platform.select({
      ios: {
        shadowColor: '#0a1628',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  segmentText: { fontSize: 14, fontWeight: '600', color: colors.gray[500] },
  segmentTextActive: { color: '#2563eb' },

  // Onboarding Card
  onboardingCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  onboardingHeader: { flexDirection: 'row', alignItems: 'center' },
  onboardingIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingTitle: { fontSize: 15, fontWeight: '700', color: '#059669' },
  onboardingLimit: { fontSize: 14, color: '#059669', marginTop: 2, fontWeight: '500' },
  onboardingProgressTrack: {
    height: 4,
    backgroundColor: '#d1fae5',
    borderRadius: 2,
    marginTop: 14,
  },
  onboardingProgressFill: {
    height: 4,
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  onboardingProgressLabel: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
    marginTop: 6,
  },

  // Apply Card
  applyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
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
  applyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  applyTitle: { fontSize: 15, fontWeight: '700', color: colors.gray[900] },
  applySubtitle: { fontSize: 13, color: colors.gray[500], marginTop: 2, fontWeight: '500' },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.gray[900], marginBottom: 14 },

  // Application Cards
  appCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
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
  appHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  appDate: { fontSize: 13, fontWeight: '600', color: colors.gray[600] },
  appDetails: { gap: 8, marginBottom: 8 },
  appDetailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  appDetailLabel: { fontSize: 13, color: colors.gray[400], fontWeight: '500' },
  appDetailValue: { fontSize: 13, fontWeight: '600', color: colors.gray[700] },
  appLimitRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.gray[100] },
  appLimitText: { fontSize: 14, fontWeight: '700', color: '#059669' },
  appAccountRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  appAccountText: { fontSize: 13, fontWeight: '500', color: '#2563eb', fontFamily: 'monospace' },
  rejectText: { fontSize: 13, color: '#ef4444', marginTop: 8 },

  // Continue button for onboarding
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray[100],
  },
  continueBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },

  // Account Cards (Bank Card Style)
  accountCard: {
    backgroundColor: DARK_NAVY,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  accountCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  accountCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountCardTopRight: {},
  accountNumber: { fontSize: 14, fontWeight: '600', fontFamily: 'monospace', color: '#ffffff' },
  accountCurrency: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  accountBalances: { flexDirection: 'row', gap: 16 },
  accountBalanceItem: { flex: 1 },
  accountBalanceLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.3 },
  accountBalance: { fontSize: 18, fontWeight: '800', color: '#ffffff', marginTop: 4 },
  accountAvailable: { fontSize: 16, fontWeight: '700', color: '#10b981', marginTop: 4 },
  accountLimit: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  accountExpandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  accountExpandText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
  },

  // Transactions
  txContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginTop: -4,
    marginBottom: 12,
    overflow: 'hidden',
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
  txEmpty: { padding: 16, fontSize: 14, color: colors.gray[400], textAlign: 'center' },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[100],
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 15, fontWeight: '500', color: colors.gray[800] },
  txDate: { fontSize: 12, color: colors.gray[400], marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },

  // Empty State styles removed — now uses shared EmptyState component
});
