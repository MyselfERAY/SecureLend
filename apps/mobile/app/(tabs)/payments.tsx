import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, StyleSheet,
} from 'react-native';
import { useAuth } from '../../src/lib/auth-context';
import { api, extractError } from '../../src/lib/api';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Badge, getStatusBadge } from '../../src/components/ui/Badge';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { ErrorMessage } from '../../src/components/ui/ErrorMessage';
import { SuccessMessage } from '../../src/components/ui/ErrorMessage';
import { ConfirmModal } from '../../src/components/ui/Modal';
import { colors } from '../../src/theme/colors';
import { PaymentItem } from '../../src/types';

export default function PaymentsScreen() {
  const { tokens, user } = useAuth();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [confirmPayment, setConfirmPayment] = useState<PaymentItem | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isTenant = user?.roles.includes('TENANT');

  const loadPayments = useCallback(async () => {
    if (!tokens) return;
    const res = await api<PaymentItem[]>('/api/v1/payments/my', { token: tokens.accessToken });
    if (res.status === 'success' && res.data) setPayments(res.data);
  }, [tokens]);

  useEffect(() => { loadPayments().finally(() => setLoading(false)); }, [loadPayments]);

  const onRefresh = async () => { setRefreshing(true); await loadPayments(); setRefreshing(false); };

  const handleProcess = async () => {
    if (!tokens || !confirmPayment) return;
    setProcessing(confirmPayment.id);
    setError('');
    const res = await api(`/api/v1/payments/${confirmPayment.id}/process`, { method: 'POST', token: tokens.accessToken });
    if (res.status === 'success') {
      setSuccessMsg('Odeme basariyla gerceklestirildi!');
      await loadPayments();
    } else {
      setError(extractError(res));
    }
    setProcessing(null);
    setConfirmPayment(null);
  };

  if (loading) return <LoadingSpinner />;

  const pending = payments.filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE');
  const completed = payments.filter((p) => p.status === 'COMPLETED');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {error ? <ErrorMessage message={error} onDismiss={() => setError('')} /> : null}
      {successMsg ? <SuccessMessage message={successMsg} onDismiss={() => setSuccessMsg('')} /> : null}

      {/* Pending */}
      {pending.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Bekleyen Odemeler</Text>
          {pending.map((p) => {
            const sb = getStatusBadge(p.status);
            return (
              <Card key={p.id} style={{ marginBottom: 10 }}>
                <View style={styles.payRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payTitle}>{p.propertyTitle}</Text>
                    <Text style={styles.payMeta}>{p.periodLabel} - {new Date(p.dueDate).toLocaleDateString('tr-TR')}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Badge text={sb.text} variant={sb.variant} />
                    <Text style={styles.payAmount}>₺{p.amount.toLocaleString('tr-TR')}</Text>
                  </View>
                </View>
                {isTenant && (
                  <Button
                    title="Ode"
                    variant="success"
                    size="sm"
                    onPress={() => setConfirmPayment(p)}
                    loading={processing === p.id}
                    style={{ marginTop: 10 }}
                  />
                )}
              </Card>
            );
          })}
        </>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Tamamlanan Odemeler</Text>
          {completed.map((p) => (
            <Card key={p.id} style={{ marginBottom: 10 }}>
              <View style={styles.payRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payTitle}>{p.propertyTitle}</Text>
                  <Text style={styles.payMeta}>{p.periodLabel}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Badge text="Odendi" variant="success" />
                  <Text style={styles.payAmount}>₺{p.amount.toLocaleString('tr-TR')}</Text>
                </View>
              </View>
            </Card>
          ))}
        </>
      )}

      {payments.length === 0 && (
        <Card><Text style={styles.emptyText}>Henuz odemeniz bulunmuyor.</Text></Card>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        visible={!!confirmPayment}
        title="Odeme Onayi"
        confirmText="Odemeyi Onayla"
        confirmVariant="success"
        onConfirm={handleProcess}
        onCancel={() => setConfirmPayment(null)}
        loading={!!processing}
      >
        {confirmPayment && (
          <View style={styles.confirmBody}>
            <ConfirmRow label="Mulk" value={confirmPayment.propertyTitle} />
            <ConfirmRow label="Donem" value={confirmPayment.periodLabel} />
            <ConfirmRow label="Vade" value={new Date(confirmPayment.dueDate).toLocaleDateString('tr-TR')} />
            <View style={styles.confirmAmountBox}>
              <Text style={styles.confirmAmountLabel}>Tutar</Text>
              <Text style={styles.confirmAmount}>₺{confirmPayment.amount.toLocaleString('tr-TR')}</Text>
            </View>
            <Text style={styles.confirmNote}>Bu odemeyi onayliyor musunuz? Islem KMH hesabinizdan gerceklestirilecektir.</Text>
          </View>
        )}
      </ConfirmModal>
    </ScrollView>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.confirmRow}>
      <Text style={styles.confirmLabel}>{label}</Text>
      <Text style={styles.confirmValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.gray[800], marginBottom: 12, marginTop: 8 },
  payRow: { flexDirection: 'row', alignItems: 'flex-start' },
  payTitle: { fontSize: 15, fontWeight: '600', color: colors.gray[900] },
  payMeta: { fontSize: 13, color: colors.gray[500], marginTop: 4 },
  payAmount: { fontSize: 16, fontWeight: '700', color: colors.gray[900], marginTop: 6 },
  emptyText: { fontSize: 14, color: colors.gray[500], textAlign: 'center', padding: 16 },
  confirmBody: { marginTop: 8 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  confirmLabel: { fontSize: 14, color: colors.gray[500] },
  confirmValue: { fontSize: 14, fontWeight: '600', color: colors.gray[800] },
  confirmAmountBox: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  confirmAmountLabel: { fontSize: 12, color: colors.gray[400] },
  confirmAmount: { fontSize: 28, fontWeight: '800', color: colors.green[600] },
  confirmNote: { fontSize: 13, color: colors.gray[500], textAlign: 'center', marginTop: 8, lineHeight: 19 },
});
