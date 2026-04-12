import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Platform,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/lib/auth-context';
import { api } from '../../src/lib/api';
import { Button } from '../../src/components/ui/Button';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { colors } from '../../src/theme/colors';

const DARK_NAVY = '#0a1628';

interface AccountDetails {
  accountNumber: string;
  iban?: string;
  accountType: string;
  creditLimit: number;
  interestRate: number;
  status: string;
}

export default function KmhCompleteScreen() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const { tokens } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokens || !applicationId) {
      setLoading(false);
      return;
    }
    api<any>(`/api/v1/bank/kmh/${applicationId}`, {
      token: tokens.accessToken,
    }).then((res) => {
      if (res.status === 'success' && res.data) {
        const data = res.data;
        setAccount({
          accountNumber: data.bankAccount?.accountNumber || data.accountNumber || 'TR00 0000 0000 0000 0000 00',
          iban: data.bankAccount?.iban || data.iban,
          accountType: 'KMH',
          creditLimit: data.approvedLimit || data.bankAccount?.creditLimit || 0,
          interestRate: data.interestRate || 0,
          status: 'ACTIVE',
        });
      }
      setLoading(false);
    });
  }, [tokens, applicationId]);

  if (loading) return <LoadingSpinner text="Hesap bilgileri yükleniyor..." />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.celebrationIconWrap}>
          <Ionicons name="checkmark-done-circle" size={56} color="#10b981" />
        </View>
        <Text style={styles.headerTitle}>Hesabınız Açıldı!</Text>
        <Text style={styles.headerSubtitle}>
          Banka Güvence Hesabınız başarıyla oluşturuldu
        </Text>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>4/4</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Card */}
        <View style={styles.accountCard}>
          <View style={styles.accountCardHeader}>
            <View style={styles.accountIcon}>
              <Ionicons name="card" size={22} color="#ffffff" />
            </View>
            <View>
              <Text style={styles.accountTypeLabel}>Kredili Mevduat Hesabı</Text>
              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusLabel}>Aktif</Text>
              </View>
            </View>
          </View>

          {/* IBAN */}
          <View style={styles.ibanRow}>
            <Text style={styles.ibanLabel}>Hesap Numarası</Text>
            <Text style={styles.ibanValue}>
              {account?.iban || account?.accountNumber || '-'}
            </Text>
          </View>

          <View style={styles.accountDivider} />

          {/* Details */}
          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Hesap Tipi</Text>
              <Text style={styles.detailValue}>{account?.accountType === 'KMH' ? 'Güvence Hesabı' : (account?.accountType || 'Güvence Hesabı')}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Kredi Limiti</Text>
              <Text style={styles.detailValueHighlight}>
                {account?.creditLimit?.toLocaleString('tr-TR') || '0'} TL
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Faiz Oranı</Text>
              <Text style={styles.detailValue}>
                %{account?.interestRate?.toFixed(2) || '0.00'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Durum</Text>
              <Text style={[styles.detailValue, { color: '#10b981' }]}>Aktif</Text>
            </View>
          </View>
        </View>

        {/* Info note */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={18} color="#2563eb" />
          <Text style={styles.infoText}>
            Hesabınızı bir kira sözleşmesine bağlayarak ödeme güvenceleme hizmetinden yararlanabilirsiniz.
          </Text>
        </View>

        {/* Actions */}
        <Button
          title="Sözleşmeye Bağla"
          onPress={() => router.replace('/(tabs)/contracts')}
          size="lg"
          variant="success"
          style={{ marginBottom: 12 }}
        />

        <Button
          title="Ana Sayfaya Dön"
          onPress={() => router.replace('/(tabs)')}
          variant="secondary"
          size="lg"
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },

  // Header
  header: {
    backgroundColor: DARK_NAVY,
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  celebrationIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16,185,129,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    marginBottom: 16,
  },
  stepRow: {
    marginBottom: 12,
  },
  stepBadge: {
    backgroundColor: 'rgba(16,185,129,0.3)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6ee7b7',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    width: '100%',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#10b981',
    borderRadius: 2,
  },

  scrollArea: { flex: 1 },
  scrollContent: { padding: 20 },

  // Account Card
  accountCard: {
    backgroundColor: DARK_NAVY,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  accountCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  accountTypeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },

  // IBAN
  ibanRow: {
    marginBottom: 16,
  },
  ibanLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  ibanValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },

  accountDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },

  // Detail grid
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    width: '45%',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  detailValueHighlight: {
    fontSize: 17,
    fontWeight: '800',
    color: '#60a5fa',
  },

  // Info
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1d4ed8',
    lineHeight: 19,
  },
});
