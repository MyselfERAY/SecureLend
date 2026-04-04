import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Platform,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/lib/auth-context';
import { api, extractError } from '../../src/lib/api';
import { Button } from '../../src/components/ui/Button';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { colors } from '../../src/theme/colors';
import { KmhEvaluationResult } from '../../src/types';

const DARK_NAVY = '#0a1628';

function getScoreColor(score: number): string {
  if (score >= 700) return '#10b981';
  if (score >= 500) return '#f59e0b';
  return '#ef4444';
}

function getScoreLabel(score: number): string {
  if (score >= 800) return 'Cok Iyi';
  if (score >= 700) return 'Iyi';
  if (score >= 500) return 'Yeterli';
  return 'Dusuk';
}

function getImpactIcon(impact: string): { name: string; color: string } {
  if (impact === 'POSITIVE' || impact === 'pozitif') return { name: 'arrow-up-circle', color: '#10b981' };
  if (impact === 'NEGATIVE' || impact === 'negatif') return { name: 'arrow-down-circle', color: '#ef4444' };
  return { name: 'remove-circle', color: colors.gray[400] };
}

export default function KmhResultScreen() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const { tokens } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [result, setResult] = useState<KmhEvaluationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tokens || !applicationId) return;
    api<KmhEvaluationResult>(`/api/v1/bank/kmh/${applicationId}`, {
      token: tokens.accessToken,
    }).then((res) => {
      if (res.status === 'success' && res.data) {
        setResult(res.data);
      } else {
        setError(extractError(res));
      }
      setLoading(false);
    });
  }, [tokens, applicationId]);

  const handleAccept = async () => {
    if (!tokens || !applicationId) return;
    setAccepting(true);
    try {
      const res = await api(`/api/v1/bank/kmh/${applicationId}/accept-offer`, {
        method: 'POST',
        token: tokens.accessToken,
      });
      if (res.status === 'success') {
        router.replace({ pathname: '/kmh/onboarding', params: { applicationId } });
      } else {
        setError(extractError(res));
      }
    } catch {
      setError('Bir hata olustu');
    }
    setAccepting(false);
  };

  if (loading) return <LoadingSpinner text="Degerlendirme sonucu yukleniyor..." />;

  if (!result) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Sonuc bulunamadi'}</Text>
          <Button title="Geri Don" variant="secondary" onPress={() => router.back()} style={{ marginTop: 16 }} />
        </View>
      </View>
    );
  }

  const isApproved = result.status === 'APPROVED';
  const scoreColor = getScoreColor(result.creditScore);
  const scoreLabel = result.creditScoreLabel || getScoreLabel(result.creditScore);
  const scorePercent = Math.min(result.creditScore / 1000, 1);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={22} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Degerlendirme Sonucu</Text>
          </View>
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>2/4</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '50%' }]} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: isApproved ? '#ecfdf5' : '#fef2f2' }]}>
          <View style={[styles.statusIconWrap, { backgroundColor: isApproved ? '#d1fae5' : '#fee2e2' }]}>
            <Ionicons
              name={isApproved ? 'checkmark-circle' : 'close-circle'}
              size={32}
              color={isApproved ? '#10b981' : '#ef4444'}
            />
          </View>
          <Text style={[styles.statusTitle, { color: isApproved ? '#059669' : '#dc2626' }]}>
            {isApproved ? 'Basvurunuz Onaylandi!' : 'Basvurunuz Uygun Bulunmadi'}
          </Text>
          {result.bankReferenceNo && (
            <Text style={styles.refNo}>Referans: {result.bankReferenceNo}</Text>
          )}
        </View>

        {/* Credit Score Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Kredi Skoru</Text>
          <View style={styles.scoreContainer}>
            {/* Score Circle */}
            <View style={styles.scoreCircleOuter}>
              <View style={[styles.scoreCircleTrack, { borderColor: colors.gray[100] }]}>
                <View style={styles.scoreCircleInner}>
                  <Text style={[styles.scoreValue, { color: scoreColor }]}>{result.creditScore}</Text>
                  <Text style={styles.scoreMax}>/1000</Text>
                </View>
              </View>
              {/* Score bar below circle */}
              <View style={styles.scoreBarTrack}>
                <View
                  style={[
                    styles.scoreBarFill,
                    { width: `${scorePercent * 100}%`, backgroundColor: scoreColor },
                  ]}
                />
              </View>
              <Text style={[styles.scoreLabel, { color: scoreColor }]}>{scoreLabel}</Text>
            </View>
          </View>

          {isApproved && (
            <>
              <View style={styles.divider} />

              {/* Approved Details */}
              <View style={styles.detailRows}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Onaylanan Limit</Text>
                  <Text style={styles.detailValueLarge}>
                    {result.approvedLimit?.toLocaleString('tr-TR')} TL
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Faiz Orani</Text>
                  <Text style={styles.detailValue}>
                    %{result.interestRate?.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Aylik Taksit</Text>
                  <Text style={styles.detailValue}>
                    {result.monthlyInstallment?.toLocaleString('tr-TR')} TL
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Borc/Gelir Orani</Text>
                  <Text style={styles.detailValue}>
                    %{((result.debtToIncomeRatio ?? 0) * 100).toFixed(1)}
                  </Text>
                </View>
              </View>
            </>
          )}

          {!isApproved && result.rejectionReason && (
            <>
              <View style={styles.divider} />
              <View style={styles.rejectionBox}>
                <Ionicons name="information-circle" size={18} color="#dc2626" />
                <Text style={styles.rejectionText}>{result.rejectionReason}</Text>
              </View>
            </>
          )}
        </View>

        {/* Evaluation Factors */}
        {result.evaluationFactors && result.evaluationFactors.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Degerlendirme Faktorleri</Text>
            {result.evaluationFactors.map((factor, i) => {
              const impactInfo = getImpactIcon(factor.impact);
              return (
                <View
                  key={i}
                  style={[
                    styles.factorRow,
                    i < result.evaluationFactors.length - 1 && styles.factorBorder,
                  ]}
                >
                  <Ionicons
                    name={impactInfo.name as any}
                    size={22}
                    color={impactInfo.color}
                    style={{ marginRight: 12 }}
                  />
                  <View style={styles.factorInfo}>
                    <Text style={styles.factorName}>{factor.name}</Text>
                    <Text style={styles.factorDetail}>{factor.detail}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#ef4444" />
            <Text style={styles.errorBoxText}>{error}</Text>
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.actions}>
          {isApproved ? (
            <>
              <Button
                title="Teklifi Kabul Et"
                onPress={handleAccept}
                loading={accepting}
                size="lg"
              />
              <Button
                title="Vazgec"
                variant="ghost"
                onPress={() => router.replace('/(tabs)/bank')}
                style={{ marginTop: 10 }}
              />
            </>
          ) : (
            <Button
              title="Tamam"
              variant="secondary"
              onPress={() => router.replace('/(tabs)/bank')}
              size="lg"
            />
          )}
        </View>

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
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, marginLeft: 14 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  stepBadge: {
    backgroundColor: 'rgba(37,99,235,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepText: { fontSize: 13, fontWeight: '700', color: '#93c5fd' },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#2563eb',
    borderRadius: 2,
  },

  scrollArea: { flex: 1 },
  scrollContent: { padding: 20 },

  // Status Banner
  statusBanner: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  refNo: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 6,
    fontWeight: '500',
  },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Score
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  scoreCircleOuter: {
    alignItems: 'center',
  },
  scoreCircleTrack: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scoreCircleInner: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  scoreMax: {
    fontSize: 14,
    color: colors.gray[400],
    fontWeight: '500',
    marginTop: -2,
  },
  scoreBarTrack: {
    width: 160,
    height: 6,
    backgroundColor: colors.gray[100],
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  scoreBarFill: {
    height: 6,
    borderRadius: 3,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '700',
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray[200],
    marginVertical: 16,
  },

  // Details
  detailRows: { gap: 12 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: colors.gray[500],
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[800],
  },
  detailValueLarge: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563eb',
  },

  // Rejection
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  rejectionText: {
    flex: 1,
    fontSize: 14,
    color: '#b91c1c',
    lineHeight: 20,
  },

  // Factors
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  factorBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[100],
  },
  factorInfo: { flex: 1 },
  factorName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[800],
  },
  factorDetail: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  errorBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#ef4444',
  },

  // Actions
  actions: {
    marginTop: 8,
  },

  // Error fallback
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
  },
});
