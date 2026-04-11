import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, FlatList,
  Dimensions, Platform, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/lib/auth-context';
import { api } from '../../src/lib/api';
import { getProfilePhoto, hasTutorialBeenSeen, setTutorialSeen } from '../../src/lib/storage';
import Tutorial from '../../src/components/Tutorial';
import { Badge, getStatusBadge } from '../../src/components/ui/Badge';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { colors } from '../../src/theme/colors';
import { ContractSummary, PaymentItem, DashboardData, DashboardNotification } from '../../src/types';
import { useNotifications } from '../../src/hooks/useNotifications';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DARK_NAVY = '#0a1628';
const DARK_NAVY_LIGHT = '#0f1d32';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const NOTIF_ICON_MAP: Record<string, { name: IoniconsName; color: string; bg: string }> = {
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
  SYSTEM: { name: 'information-circle', color: '#2563eb', bg: '#eff6ff' },
};

const DEFAULT_NOTIF_ICON: { name: IoniconsName; color: string; bg: string } = {
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

function formatCompact(amount: number): string {
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K TL`;
  }
  return `${amount} TL`;
}

export default function DashboardScreen() {
  const { user, tokens } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialChecked, setTutorialChecked] = useState(false);
  const { unreadCount } = useNotifications();

  const loadData = useCallback(async () => {
    if (!tokens) return;
    try {
      const [cRes, pRes, dRes] = await Promise.all([
        api<ContractSummary[]>('/api/v1/contracts', { token: tokens.accessToken }),
        api<PaymentItem[]>('/api/v1/payments/my', { token: tokens.accessToken }),
        api<DashboardData>('/api/v1/users/dashboard', { token: tokens.accessToken }),
      ]);
      if (cRes.status === 'success' && cRes.data) setContracts(cRes.data);
      if (pRes.status === 'success' && pRes.data) setPayments(pRes.data);
      if (dRes.status === 'success' && dRes.data) setDashboard(dRes.data);
    } catch { /* ignore */ }
  }, [tokens]);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
    if (user?.id) {
      getProfilePhoto(user.id).then(setProfilePhoto);
      // Check tutorial
      hasTutorialBeenSeen(user.id).then((seen) => {
        if (!seen) setShowTutorial(true);
        setTutorialChecked(true);
      });
    } else {
      setProfilePhoto(null);
      setTutorialChecked(true);
    }
  }, [loadData, user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading || !tutorialChecked) return <LoadingSpinner />;

  if (showTutorial) {
    return (
      <Tutorial
        onComplete={() => {
          setShowTutorial(false);
          if (user?.id) setTutorialSeen(user.id);
        }}
      />
    );
  }

  const activeContracts = contracts.filter((c) => c.status === 'ACTIVE');
  const pendingPayments = payments.filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE');

  // Use dashboard data for metrics if available, fall back to local computation
  const tenantMetrics = dashboard?.tenant;
  const landlordMetrics = dashboard?.landlord;

  const metricActiveContracts = tenantMetrics?.activeContracts ?? activeContracts.length;
  const metricMonthlyRent = tenantMetrics?.totalMonthlyRent ?? activeContracts.reduce((sum, c) => sum + c.monthlyRent, 0);
  const metricPendingCount = tenantMetrics
    ? tenantMetrics.pendingPayments + tenantMetrics.overduePayments
    : pendingPayments.length;

  const firstName = dashboard?.fullName?.split(' ')[0] || user?.fullName?.split(' ')[0] || '';
  const initials = (dashboard?.fullName || user?.fullName)
    ? (dashboard?.fullName || user?.fullName || '').split(' ').map((n) => n.charAt(0)).join('').slice(0, 2).toUpperCase()
    : '?';

  const quickActions = [
    { title: 'Mulk Ekle', icon: 'home-outline' as const, color: '#2563eb', bg: '#eff6ff', route: '/(tabs)/properties' },
    { title: 'Sozlesme', icon: 'document-text-outline' as const, color: '#10b981', bg: '#ecfdf5', route: '/(tabs)/contracts' },
    { title: 'KMH', icon: 'card-outline' as const, color: '#f59e0b', bg: '#fffbeb', route: '/kmh/apply' },
    { title: 'Odeme', icon: 'wallet-outline' as const, color: '#8b5cf6', bg: '#f5f3ff', route: '/(tabs)/payments' },
    { title: 'Rehber', icon: 'book-outline' as const, color: '#0891b2', bg: '#ecfeff', route: '/rehber' },
    { title: 'Davet Et', icon: 'gift-outline' as const, color: '#ea580c', bg: '#fff7ed', route: '/referral' },
  ];

  // Build activity feed from real data
  const activityItems: { icon: string; iconColor: string; iconBg: string; title: string; subtitle: string; rightText?: string; rightColor?: string }[] = [];

  pendingPayments.slice(0, 2).forEach((p) => {
    activityItems.push({
      icon: p.status === 'OVERDUE' ? 'alert-circle' : 'time-outline',
      iconColor: p.status === 'OVERDUE' ? '#ef4444' : '#f59e0b',
      iconBg: p.status === 'OVERDUE' ? '#fef2f2' : '#fffbeb',
      title: p.status === 'OVERDUE' ? 'Odeme gecikti' : 'Odeme bekleniyor',
      subtitle: p.propertyTitle,
      rightText: `${p.amount.toLocaleString('tr-TR')} TL`,
      rightColor: p.status === 'OVERDUE' ? '#ef4444' : colors.gray[900],
    });
  });

  contracts.filter(c => c.status === 'PENDING_SIGNATURES').slice(0, 2).forEach((c) => {
    activityItems.push({
      icon: 'create-outline',
      iconColor: '#2563eb',
      iconBg: '#eff6ff',
      title: 'Imza bekleniyor',
      subtitle: c.propertyTitle,
    });
  });

  activeContracts.slice(0, 1).forEach((c) => {
    activityItems.push({
      icon: 'checkmark-circle',
      iconColor: '#10b981',
      iconBg: '#ecfdf5',
      title: 'Sozlesme aktif',
      subtitle: c.propertyTitle,
    });
  });

  // KMH status card config
  const kmhStatus = tenantMetrics?.kmhStatus;
  const kmhLimit = tenantMetrics?.kmhLimit;

  let kmhCard: { bg: string; borderColor: string; icon: IoniconsName; iconColor: string; title: string; subtitle: string; route: string } | null = null;
  if (tenantMetrics) {
    if (kmhStatus === 'APPROVED') {
      kmhCard = {
        bg: '#ecfdf5',
        borderColor: '#10b981',
        icon: 'checkmark-circle',
        iconColor: '#10b981',
        title: 'KMH Aktif',
        subtitle: kmhLimit ? `Limit: ${kmhLimit.toLocaleString('tr-TR')} TL` : 'Hesabiniz aktif',
        route: '/(tabs)/bank',
      };
    } else if (kmhStatus === 'PENDING') {
      kmhCard = {
        bg: '#fffbeb',
        borderColor: '#f59e0b',
        icon: 'time',
        iconColor: '#f59e0b',
        title: 'KMH Basvuru Bekliyor',
        subtitle: 'Basvurunuz inceleniyor',
        route: '/(tabs)/bank',
      };
    } else if (kmhStatus === 'REJECTED') {
      kmhCard = {
        bg: '#fef2f2',
        borderColor: '#ef4444',
        icon: 'close-circle',
        iconColor: '#ef4444',
        title: 'KMH Reddedildi',
        subtitle: 'Yeni basvuru yapabilirsiniz',
        route: '/(tabs)/bank',
      };
    } else {
      kmhCard = {
        bg: '#eff6ff',
        borderColor: '#2563eb',
        icon: 'card-outline',
        iconColor: '#2563eb',
        title: 'KMH Basvurusu Yap',
        subtitle: 'Kira odeme kolayligi icin basvurun',
        route: '/kmh/apply',
      };
    }
  }

  // Next payment card
  const nextPaymentDate = tenantMetrics?.nextPaymentDate;
  const nextPaymentAmount = tenantMetrics?.nextPaymentAmount;

  // Recent notifications from dashboard
  const recentNotifications = (dashboard?.recentNotifications ?? []).slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />}
      showsVerticalScrollIndicator={false}
    >
      {/* Dark Navy Header */}
      <View style={[styles.headerSection, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.logoDot} />
            <Text style={styles.logoText}>Kira Guvence</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => router.push('/notifications')}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={22} color="#ffffff" />
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => router.push('/(tabs)/payments')}
              activeOpacity={0.7}
            >
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.heroGreeting}>Hos geldiniz, {firstName}</Text>

        {/* Tenant Metric Pills */}
        <View style={styles.metricRow}>
          <View style={styles.metricPill}>
            <Text style={styles.metricValue}>{metricActiveContracts}</Text>
            <Text style={styles.metricLabel}>Aktif</Text>
          </View>
          <View style={styles.metricPill}>
            <Text style={styles.metricValue}>
              {metricMonthlyRent > 0 ? formatCompact(metricMonthlyRent) : '0'}
            </Text>
            <Text style={styles.metricLabel}>Bu Ay</Text>
          </View>
          <View style={styles.metricPill}>
            <Text style={styles.metricValue}>{metricPendingCount}</Text>
            <Text style={styles.metricLabel}>Bekleyen</Text>
          </View>
        </View>

        {/* Landlord Metric Pills */}
        {landlordMetrics && (
          <View style={[styles.metricRow, { marginTop: 12 }]}>
            <View style={styles.metricPill}>
              <Text style={styles.metricValue}>{landlordMetrics.totalProperties}</Text>
              <Text style={styles.metricLabel}>Mulk</Text>
            </View>
            <View style={styles.metricPill}>
              <Text style={styles.metricValue}>
                {landlordMetrics.totalMonthlyIncome > 0 ? formatCompact(landlordMetrics.totalMonthlyIncome) : '0'}
              </Text>
              <Text style={styles.metricLabel}>Gelir</Text>
            </View>
            <View style={styles.metricPill}>
              <Text style={styles.metricValue}>{Math.round(landlordMetrics.occupancyRate)}%</Text>
              <Text style={styles.metricLabel}>Doluluk</Text>
            </View>
          </View>
        )}
      </View>

      {/* KMH Status Card */}
      {kmhCard && (
        <TouchableOpacity
          style={[styles.kmhCard, { backgroundColor: kmhCard.bg, borderColor: kmhCard.borderColor }]}
          onPress={() => router.push(kmhCard!.route as any)}
          activeOpacity={0.7}
        >
          <View style={[styles.kmhIconCircle, { backgroundColor: kmhCard.borderColor + '20' }]}>
            <Ionicons name={kmhCard.icon} size={24} color={kmhCard.iconColor} />
          </View>
          <View style={styles.kmhContent}>
            <Text style={[styles.kmhTitle, { color: kmhCard.borderColor }]}>{kmhCard.title}</Text>
            <Text style={styles.kmhSubtitle}>{kmhCard.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={kmhCard.borderColor} />
        </TouchableOpacity>
      )}

      {/* Next Payment Card */}
      {tenantMetrics && nextPaymentDate && nextPaymentAmount != null && (
        <TouchableOpacity
          style={styles.nextPaymentCard}
          onPress={() => router.push('/(tabs)/payments')}
          activeOpacity={0.7}
        >
          <View style={styles.nextPaymentIconCircle}>
            <Ionicons name="calendar-outline" size={22} color="#8b5cf6" />
          </View>
          <View style={styles.nextPaymentContent}>
            <Text style={styles.nextPaymentLabel}>Sonraki Odeme</Text>
            <Text style={styles.nextPaymentDate}>
              {new Date(nextPaymentDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <Text style={styles.nextPaymentAmount}>
            {nextPaymentAmount.toLocaleString('tr-TR')} TL
          </Text>
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Hizli Islemler</Text>
      <View style={styles.quickGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.title}
            style={styles.quickAction}
            onPress={() => router.push(action.route as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: action.bg }]}>
              <Ionicons name={action.icon as any} size={22} color={action.color} />
            </View>
            <Text style={styles.quickLabel}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Notifications */}
      {recentNotifications.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bildirimler</Text>
            <TouchableOpacity onPress={() => router.push('/notifications')} activeOpacity={0.7}>
              <Text style={styles.seeAllText}>Tumunu Gor</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.notificationsCard}>
            {recentNotifications.map((notif: DashboardNotification, i: number) => {
              const iconInfo = NOTIF_ICON_MAP[notif.type] || DEFAULT_NOTIF_ICON;
              return (
                <View
                  key={notif.id}
                  style={[styles.notifItem, i < recentNotifications.length - 1 && styles.notifItemBorder]}
                >
                  <View style={[styles.notifIcon, { backgroundColor: iconInfo.bg }]}>
                    <Ionicons name={iconInfo.name} size={18} color={iconInfo.color} />
                  </View>
                  <View style={styles.notifContent}>
                    <Text style={[styles.notifTitle, !notif.isRead && styles.notifTitleUnread]} numberOfLines={1}>
                      {notif.title}
                    </Text>
                    <Text style={styles.notifTime}>{formatTimeAgo(notif.createdAt)}</Text>
                  </View>
                  {!notif.isRead && <View style={styles.notifUnreadDot} />}
                </View>
              );
            })}
          </View>
        </>
      )}

      {/* Activity Feed */}
      {activityItems.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Son Islemler</Text>
          <View style={styles.activityCard}>
            {activityItems.map((item, i) => (
              <View key={i} style={[styles.activityItem, i < activityItems.length - 1 && styles.activityBorder]}>
                <View style={[styles.activityIcon, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.iconColor} />
                </View>
                <View style={styles.activityText}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activitySubtitle} numberOfLines={1}>{item.subtitle}</Text>
                </View>
                {item.rightText && (
                  <Text style={[styles.activityRight, item.rightColor ? { color: item.rightColor } : undefined]}>
                    {item.rightText}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </>
      )}

      {/* Contract Cards - Horizontal */}
      {activeContracts.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Sozlesmelerim</Text>
          <FlatList
            data={activeContracts}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.contractScroll}
            renderItem={({ item: c }) => (
              <TouchableOpacity
                style={styles.contractCard}
                onPress={() => router.push(`/(tabs)/contracts/${c.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.contractCardTop}>
                  <View style={styles.contractIcon}>
                    <Ionicons name="business-outline" size={18} color="#2563eb" />
                  </View>
                  <Badge {...getStatusBadge(c.status)} size="sm" />
                </View>
                <Text style={styles.contractCardTitle} numberOfLines={1}>{c.propertyTitle}</Text>
                <Text style={styles.contractCardMeta} numberOfLines={1}>{c.tenantName}</Text>
                <Text style={styles.contractCardAmount}>
                  {c.monthlyRent.toLocaleString('tr-TR')} TL
                  <Text style={styles.contractCardPer}>/ay</Text>
                </Text>
              </TouchableOpacity>
            )}
          />
        </>
      )}

      {/* Upcoming Payments */}
      {pendingPayments.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Yaklasan Odemeler</Text>
          {pendingPayments.slice(0, 4).map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.paymentRow}
              activeOpacity={0.6}
              onPress={() => router.push('/(tabs)/payments')}
            >
              <View style={[styles.paymentIcon, { backgroundColor: p.status === 'OVERDUE' ? '#fef2f2' : '#fffbeb' }]}>
                <Ionicons
                  name={p.status === 'OVERDUE' ? 'alert-circle' : 'time-outline'}
                  size={20}
                  color={p.status === 'OVERDUE' ? '#ef4444' : '#f59e0b'}
                />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle} numberOfLines={1}>{p.propertyTitle}</Text>
                <Text style={styles.paymentMeta}>{p.periodLabel} - {new Date(p.dueDate).toLocaleDateString('tr-TR')}</Text>
              </View>
              <View style={styles.paymentRight}>
                <Text style={[styles.paymentAmount, p.status === 'OVERDUE' && { color: '#ef4444' }]}>
                  {p.amount.toLocaleString('tr-TR')} TL
                </Text>
                <Badge {...getStatusBadge(p.status)} size="sm" />
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Empty State */}
      {contracts.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="document-text-outline" size={48} color={colors.gray[300]} />
          </View>
          <Text style={styles.emptyTitle}>Henuz sozlesmeniz yok</Text>
          <Text style={styles.emptySubtitle}>Mulk ekleyerek veya bir sozlesmeye dahil olarak baslayabilirsiniz.</Text>
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: {},

  // Dark Navy Header
  headerSection: {
    backgroundColor: DARK_NAVY,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
    marginRight: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: DARK_NAVY,
  },
  bellBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroGreeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 20,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },

  // KMH Status Card
  kmhCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  kmhIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  kmhContent: {
    flex: 1,
  },
  kmhTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  kmhSubtitle: {
    fontSize: 13,
    color: colors.gray[600],
    marginTop: 2,
  },

  // Next Payment Card
  nextPaymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
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
  nextPaymentIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nextPaymentContent: {
    flex: 1,
  },
  nextPaymentLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray[500],
  },
  nextPaymentDate: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray[900],
    marginTop: 2,
  },
  nextPaymentAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#8b5cf6',
  },

  // Quick Actions
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 14,
    marginTop: 4,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 20,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  quickAction: {
    width: (SCREEN_WIDTH - 40 - 24) / 3,
    alignItems: 'center',
  },
  quickIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[700],
    textAlign: 'center',
  },

  // Notifications Section
  notificationsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 24,
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
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  notifItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[100],
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
  },
  notifTitleUnread: {
    fontWeight: '700',
    color: colors.gray[900],
  },
  notifTime: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 2,
  },
  notifUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
    marginLeft: 8,
  },

  // Activity Feed
  activityCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 24,
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
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  activityBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[100],
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityText: { flex: 1 },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
  },
  activitySubtitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  activityRight: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray[900],
    marginLeft: 8,
  },

  // Contract Cards (Horizontal)
  contractScroll: { paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  contractCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    width: SCREEN_WIDTH * 0.6,
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
  contractCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  contractIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  contractCardMeta: {
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: 14,
  },
  contractCardAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  contractCardPer: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[400],
  },

  // Payment Rows
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
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
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentInfo: { flex: 1, marginRight: 8 },
  paymentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
  },
  paymentMeta: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  paymentRight: { alignItems: 'flex-end' },
  paymentAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 6,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
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
