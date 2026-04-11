import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Platform, TouchableOpacity,
  Share, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/lib/auth-context';
import { api } from '../../src/lib/api';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { colors } from '../../src/theme/colors';
import { ReferralInfo } from '../../src/types';
import * as Clipboard from 'expo-clipboard';

const DARK_NAVY = '#0a1628';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ReferralScreen() {
  const { tokens } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadReferral = useCallback(async () => {
    if (!tokens) return;
    try {
      const res = await api<ReferralInfo>('/api/v1/promos/referral', {
        method: 'POST',
        token: tokens.accessToken,
      });
      if (res.status === 'success' && res.data) {
        setInfo(res.data);
      }
    } catch { /* ignore */ }
  }, [tokens]);

  useEffect(() => {
    loadReferral().finally(() => setLoading(false));
  }, [loadReferral]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReferral();
    setRefreshing(false);
  }, [loadReferral]);

  const handleCopy = useCallback(async () => {
    if (!info?.referralCode) return;
    await Clipboard.setStringAsync(info.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [info]);

  const shareMessage = info?.referralCode
    ? `KiraGuvence ile kira odemelerini guvenle yap! Benim davet kodum: ${info.referralCode}\n\n${info.referralLink || 'https://kiraguvence.com'}`
    : 'KiraGuvence ile kira odemelerini guvenle yap! Hemen kayit ol: https://kiraguvence.com';

  const handleShare = useCallback(async () => {
    try {
      await Share.share({ message: shareMessage });
    } catch { /* cancelled */ }
  }, [shareMessage]);

  const handleWhatsApp = useCallback(async () => {
    const url = `whatsapp://send?text=${encodeURIComponent(shareMessage)}`;
    try {
      const { Linking } = require('react-native');
      await Linking.openURL(url);
    } catch { /* WhatsApp not installed */ }
  }, [shareMessage]);

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="gift" size={20} color="#f59e0b" />
          <Text style={styles.headerTitle}>Davet Et</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gray[500]} />
        }
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="people" size={32} color="#2563eb" />
          </View>
          <Text style={styles.heroTitle}>Arkadaslarini Davet Et</Text>
          <Text style={styles.heroSubtitle}>
            Her basarili davet icin sen ve arkadasin ozel indirimlerden yararlanin.
          </Text>
        </View>

        {/* Referral Code */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Davet Kodun</Text>
          {info?.referralCode ? (
            <View style={styles.codeRow}>
              <Text style={styles.codeValue}>{info.referralCode}</Text>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.7}>
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={18}
                  color={copied ? '#10b981' : '#2563eb'}
                />
                <Text style={[styles.copyText, copied && { color: '#10b981' }]}>
                  {copied ? 'Kopyalandi' : 'Kopyala'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.codeEmpty}>Davet kodu henuz olusturulmadi. Asagidaki butonlarla platformumuzu paylasabilirsiniz.</Text>
          )}
        </View>

        {/* Share Buttons */}
        <View style={styles.shareRow}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleWhatsApp} activeOpacity={0.7}>
            <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
            <Text style={styles.shareBtnText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.shareBtn, styles.shareBtnPrimary]} onPress={handleShare} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={22} color="#ffffff" />
            <Text style={[styles.shareBtnText, { color: '#ffffff' }]}>Paylas</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{info?.totalReferrals || 0}</Text>
            <Text style={styles.statLabel}>Toplam Davet</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>
              {info?.referrals?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Basarili</Text>
          </View>
        </View>

        {/* How it works */}
        <View style={styles.howCard}>
          <Text style={styles.howTitle}>Nasil Calisir?</Text>
          {[
            { step: '1', icon: 'share-social' as const, text: 'Davet kodunu arkadaslarinla paylas' },
            { step: '2', icon: 'person-add' as const, text: 'Arkadasin kayit olurken kodunu girer' },
            { step: '3', icon: 'gift' as const, text: 'Ikiniz de ozel indirimlerden yararlanin' },
          ].map((item) => (
            <View key={item.step} style={styles.howStep}>
              <View style={styles.howStepNumber}>
                <Text style={styles.howStepNumberText}>{item.step}</Text>
              </View>
              <Ionicons name={item.icon} size={20} color={colors.gray[600]} style={{ marginRight: 10 }} />
              <Text style={styles.howStepText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Referral History */}
        {info?.referrals && info.referrals.length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>Davet Gecmisi</Text>
            {info.referrals.map((r, i) => (
              <View key={i} style={[styles.historyItem, i < info.referrals.length - 1 && styles.historyItemBorder]}>
                <View style={styles.historyLeft}>
                  <View style={styles.historyAvatar}>
                    <Ionicons name="person" size={16} color="#2563eb" />
                  </View>
                  <View>
                    <Text style={styles.historyName}>{r.userName}</Text>
                    <Text style={styles.historyDate}>{formatDate(r.joinedAt)}</Text>
                  </View>
                </View>
                <View style={styles.historyBadge}>
                  <Text style={styles.historyBadgeText}>%{r.discountPercent} indirim</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  headerCenter: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  headerTitle: {
    fontSize: 18, fontWeight: '700', color: '#ffffff',
  },

  // Scroll
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Hero
  heroCard: {
    backgroundColor: colors.white, borderRadius: 16,
    padding: 24, alignItems: 'center', marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0a1628', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06, shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  heroIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#eff6ff', alignItems: 'center',
    justifyContent: 'center', marginBottom: 14,
  },
  heroTitle: {
    fontSize: 20, fontWeight: '800', color: colors.gray[900], marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14, color: colors.gray[500], textAlign: 'center', lineHeight: 20,
  },

  // Code
  codeCard: {
    backgroundColor: colors.white, borderRadius: 16,
    padding: 16, marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0a1628', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06, shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  codeLabel: {
    fontSize: 13, fontWeight: '600', color: colors.gray[500], marginBottom: 8,
  },
  codeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  codeValue: {
    fontSize: 24, fontWeight: '800', color: '#2563eb', letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#eff6ff',
  },
  copyText: {
    fontSize: 13, fontWeight: '600', color: '#2563eb',
  },
  codeEmpty: {
    fontSize: 14, color: colors.gray[500], lineHeight: 20,
  },

  // Share
  shareRow: {
    flexDirection: 'row', gap: 12, marginBottom: 16,
  },
  shareBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: '#25D366',
    ...Platform.select({
      ios: {
        shadowColor: '#0a1628', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  shareBtnPrimary: {
    backgroundColor: '#2563eb', borderColor: '#2563eb',
  },
  shareBtnText: {
    fontSize: 15, fontWeight: '600', color: colors.gray[800],
  },

  // Stats
  statsRow: {
    flexDirection: 'row', gap: 12, marginBottom: 16,
  },
  statCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: 14,
    padding: 16, alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0a1628', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  statValue: {
    fontSize: 28, fontWeight: '800', color: '#2563eb', marginBottom: 4,
  },
  statLabel: {
    fontSize: 13, color: colors.gray[500], fontWeight: '500',
  },

  // How it works
  howCard: {
    backgroundColor: colors.white, borderRadius: 16,
    padding: 16, marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0a1628', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06, shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  howTitle: {
    fontSize: 16, fontWeight: '700', color: colors.gray[900], marginBottom: 14,
  },
  howStep: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
  },
  howStepNumber: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#eff6ff', alignItems: 'center',
    justifyContent: 'center', marginRight: 10,
  },
  howStepNumberText: {
    fontSize: 13, fontWeight: '700', color: '#2563eb',
  },
  howStepText: {
    flex: 1, fontSize: 14, color: colors.gray[700], lineHeight: 20,
  },

  // History
  historyCard: {
    backgroundColor: colors.white, borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0a1628', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06, shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  historyTitle: {
    fontSize: 16, fontWeight: '700', color: colors.gray[900], marginBottom: 14,
  },
  historyItem: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 12,
  },
  historyItemBorder: {
    borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  historyLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  historyAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center',
  },
  historyName: {
    fontSize: 14, fontWeight: '600', color: colors.gray[800],
  },
  historyDate: {
    fontSize: 12, color: colors.gray[400], marginTop: 2,
  },
  historyBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, backgroundColor: '#ecfdf5',
  },
  historyBadgeText: {
    fontSize: 12, fontWeight: '600', color: '#059669',
  },
});
