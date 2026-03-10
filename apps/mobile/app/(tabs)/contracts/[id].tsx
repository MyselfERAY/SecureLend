import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/lib/auth-context';
import { api, extractError } from '../../../src/lib/api';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Badge, getStatusBadge } from '../../../src/components/ui/Badge';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../src/components/ui/ErrorMessage';
import { colors } from '../../../src/theme/colors';
import { ContractDetail, PaymentItem, KmhAccountOption } from '../../../src/types';

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tokens, user } = useAuth();
  const router = useRouter();
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKmhId, setSelectedKmhId] = useState('');
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');
  const [showTerminate, setShowTerminate] = useState(false);
  const [terminateReason, setTerminateReason] = useState('');
  const [terminating, setTerminating] = useState(false);

  const loadData = useCallback(async () => {
    if (!tokens || !id) return;
    const [cRes, pRes] = await Promise.all([
      api<ContractDetail>(`/api/v1/contracts/${id}`, { token: tokens.accessToken }),
      api<PaymentItem[]>(`/api/v1/contracts/${id}/payments`, { token: tokens.accessToken }),
    ]);
    if (cRes.status === 'success' && cRes.data) {
      setContract(cRes.data);
      // Auto-select first eligible KMH
      const accs = cRes.data.tenantKmhAccounts || [];
      const eligible = accs.find((a) => a.creditLimit >= cRes.data!.monthlyRent && !a.contractId);
      if (eligible) setSelectedKmhId(eligible.accountId);
    }
    if (pRes.status === 'success' && pRes.data) setPayments(pRes.data);
  }, [tokens, id]);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  if (loading || !contract) return <LoadingSpinner />;

  const isTenant = contract.tenant.id === user?.id;
  const isLandlord = contract.landlord.id === user?.id;
  const myRole = isTenant ? 'TENANT' : 'LANDLORD';
  const mySignature = contract.signatures.find((s) => s.role === myRole);
  const kmhAccounts = contract.tenantKmhAccounts || [];
  const selectedKmh = kmhAccounts.find((a) => a.accountId === selectedKmhId);
  const kmhOk = !isTenant || (selectedKmh != null && selectedKmh.creditLimit >= contract.monthlyRent);
  const canSign = contract.status === 'PENDING_SIGNATURES' && !mySignature && kmhOk;
  const canTerminate = contract.status === 'ACTIVE';

  const handleSign = async () => {
    if (!tokens) return;
    setError(''); setSigning(true);
    const body: any = {};
    if (isTenant && selectedKmhId) body.kmhAccountId = selectedKmhId;

    const res = await api(`/api/v1/contracts/${id}/sign`, { method: 'POST', body, token: tokens.accessToken });
    if (res.status === 'success') {
      await loadData();
    } else { setError(extractError(res)); }
    setSigning(false);
  };

  const handleTerminate = async () => {
    if (!tokens || !terminateReason.trim()) return;
    setTerminating(true);
    const res = await api(`/api/v1/contracts/${id}/terminate`, {
      method: 'POST', body: { reason: terminateReason }, token: tokens.accessToken,
    });
    if (res.status === 'success') { await loadData(); setShowTerminate(false); }
    else { setError(extractError(res)); }
    setTerminating(false);
  };

  const sb = getStatusBadge(contract.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Card */}
      <Card style={{ marginBottom: 12 }}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.propTitle}>{contract.property.title}</Text>
            <Text style={styles.propAddr}>{contract.property.addressLine1}, {contract.property.district}/{contract.property.city}</Text>
          </View>
          <Badge text={sb.text} variant={sb.variant} />
        </View>

        <View style={styles.infoGrid}>
          <InfoItem label="Kira" value={`₺${contract.monthlyRent.toLocaleString('tr-TR')}`} />
          {contract.depositAmount ? <InfoItem label="Depozito" value={`₺${contract.depositAmount.toLocaleString('tr-TR')}`} /> : null}
          <InfoItem label="Baslangic" value={new Date(contract.startDate).toLocaleDateString('tr-TR')} />
          <InfoItem label="Bitis" value={new Date(contract.endDate).toLocaleDateString('tr-TR')} />
          <InfoItem label="Odeme Gunu" value={`Her ay ${contract.paymentDayOfMonth}.`} />
          {contract.landlordIban ? <InfoItem label="IBAN" value={contract.landlordIban} mono /> : null}
        </View>
      </Card>

      {/* Parties */}
      <View style={styles.partiesRow}>
        <Card style={[styles.partyCard, { borderTopColor: colors.yellow[500] }]}>
          <Text style={styles.partyLabel}>Ev Sahibi</Text>
          <Text style={styles.partyName}>{contract.landlord.fullName}</Text>
          <Text style={styles.partyTckn}>{contract.landlord.tcknMasked}</Text>
        </Card>
        <Card style={[styles.partyCard, { borderTopColor: colors.primary[500] }]}>
          <Text style={styles.partyLabel}>Kiraci</Text>
          <Text style={styles.partyName}>{contract.tenant.fullName}</Text>
          <Text style={styles.partyTckn}>{contract.tenant.tcknMasked}</Text>
        </Card>
      </View>

      {/* KMH Selection (Tenant only, pending signatures) */}
      {isTenant && contract.status === 'PENDING_SIGNATURES' && (
        <Card style={{ marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>KMH Hesap Secimi</Text>
          {kmhAccounts.length === 0 ? (
            <View style={[styles.alertBox, { backgroundColor: colors.red[50], borderColor: colors.red[200] }]}>
              <Text style={{ color: colors.red[700], fontSize: 14 }}>Aktif KMH hesabiniz bulunmuyor. Banka sayfasindan KMH basvurusu yapin.</Text>
            </View>
          ) : (
            kmhAccounts.map((acc) => {
              const isEligible = acc.creditLimit >= contract.monthlyRent;
              const isBound = acc.contractId && acc.contractId !== contract.id;
              const isSelected = selectedKmhId === acc.accountId;
              const disabled = !isEligible || !!isBound;

              return (
                <TouchableOpacity
                  key={acc.accountId}
                  onPress={() => !disabled && setSelectedKmhId(acc.accountId)}
                  disabled={disabled}
                  style={[
                    styles.kmhItem,
                    isSelected && styles.kmhItemSelected,
                    disabled && styles.kmhItemDisabled,
                  ]}
                >
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.kmhNumber, disabled && { color: colors.gray[400] }]}>{acc.accountNumber}</Text>
                    <Text style={styles.kmhLimit}>Limit: ₺{acc.creditLimit.toLocaleString('tr-TR')}</Text>
                    {isBound && <Text style={styles.kmhBound}>Baska sozlesmeye bagli</Text>}
                    {!isEligible && !isBound && <Text style={styles.kmhInsufficient}>Limit yetersiz (min ₺{contract.monthlyRent.toLocaleString('tr-TR')})</Text>}
                  </View>
                  {isEligible && !isBound && <Ionicons name="checkmark-circle" size={22} color={colors.green[500]} />}
                </TouchableOpacity>
              );
            })
          )}
        </Card>
      )}

      {/* Signatures */}
      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.sectionTitle}>Imzalar</Text>
        {contract.signatures.map((sig, i) => (
          <View key={i} style={styles.sigRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.green[500]} />
            <View>
              <Text style={styles.sigName}>{sig.signedByName} ({sig.role === 'LANDLORD' ? 'Ev Sahibi' : 'Kiraci'})</Text>
              <Text style={styles.sigDate}>{new Date(sig.signedAt).toLocaleString('tr-TR')}</Text>
            </View>
          </View>
        ))}

        {error ? <ErrorMessage message={error} onDismiss={() => setError('')} /> : null}

        {canSign && (
          <Button title="Sozlesmeyi Imzala" variant="success" onPress={handleSign} loading={signing} style={{ marginTop: 12 }} />
        )}

        {isTenant && contract.status === 'PENDING_SIGNATURES' && !mySignature && !kmhOk && (
          <View style={[styles.alertBox, { backgroundColor: colors.orange[50], borderColor: colors.orange[200], marginTop: 12 }]}>
            <Text style={{ color: colors.orange[600], fontSize: 13 }}>
              {kmhAccounts.length === 0
                ? 'Imzalamak icin aktif KMH hesabi gereklidir.'
                : !selectedKmhId
                  ? 'Lutfen bir KMH hesabi secin.'
                  : 'Secilen hesabin limiti yetersiz.'}
            </Text>
          </View>
        )}

        {/* Terminate */}
        {canTerminate && !showTerminate && (
          <Button title="Sozlesmeyi Feshet" variant="danger" onPress={() => setShowTerminate(true)} style={{ marginTop: 12 }} />
        )}

        {showTerminate && (
          <View style={{ marginTop: 12 }}>
            <View style={[styles.alertBox, { backgroundColor: colors.red[50], borderColor: colors.red[200] }]}>
              <Text style={{ color: colors.red[700], fontSize: 13 }}>Sozlesme feshi geri alinamaz.</Text>
            </View>
            <TextInput
              style={styles.terminateInput}
              placeholder="Fesih sebebi..."
              value={terminateReason}
              onChangeText={setTerminateReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.row}>
              <Button title="Feshet" variant="danger" onPress={handleTerminate} loading={terminating} style={{ flex: 1 }} />
              <Button title="Iptal" variant="secondary" onPress={() => setShowTerminate(false)} style={{ flex: 1 }} />
            </View>
          </View>
        )}
      </Card>

      {/* Payment Schedule */}
      {payments.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Odeme Takvimi</Text>
          {payments.map((p) => {
            const ps = getStatusBadge(p.status);
            return (
              <View key={p.id} style={styles.payRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payPeriod}>{p.periodLabel}</Text>
                  <Text style={styles.payDate}>{new Date(p.dueDate).toLocaleDateString('tr-TR')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Badge text={ps.text} variant={ps.variant} />
                  <Text style={styles.payAmount}>₺{p.amount.toLocaleString('tr-TR')}</Text>
                </View>
              </View>
            );
          })}
        </Card>
      )}
    </ScrollView>
  );
}

function InfoItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && { fontFamily: 'monospace', fontSize: 12 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  content: { padding: 16, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  propTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[900] },
  propAddr: { fontSize: 13, color: colors.gray[500], marginTop: 4 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  infoItem: { minWidth: '45%' },
  infoLabel: { fontSize: 12, color: colors.gray[400], fontWeight: '500' },
  infoValue: { fontSize: 15, fontWeight: '600', color: colors.gray[800], marginTop: 2 },
  partiesRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  partyCard: { flex: 1, borderTopWidth: 3 },
  partyLabel: { fontSize: 12, color: colors.gray[400], fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  partyName: { fontSize: 15, fontWeight: '700', color: colors.gray[900], marginTop: 4 },
  partyTckn: { fontSize: 12, color: colors.gray[500], marginTop: 2, fontFamily: 'monospace' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.gray[800], marginBottom: 12 },
  kmhItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.gray[200], backgroundColor: colors.white, marginBottom: 8,
  },
  kmhItemSelected: { borderColor: colors.primary[500], backgroundColor: colors.primary[50] },
  kmhItemDisabled: { opacity: 0.5 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.gray[300], justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: colors.primary[600] },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary[600] },
  kmhNumber: { fontSize: 14, fontWeight: '600', fontFamily: 'monospace', color: colors.gray[800] },
  kmhLimit: { fontSize: 12, color: colors.gray[500], marginTop: 2 },
  kmhBound: { fontSize: 11, color: colors.orange[500], marginTop: 2 },
  kmhInsufficient: { fontSize: 11, color: colors.red[500], marginTop: 2 },
  sigRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  sigName: { fontSize: 14, fontWeight: '600', color: colors.gray[800] },
  sigDate: { fontSize: 12, color: colors.gray[400] },
  alertBox: { borderWidth: 1, borderRadius: 10, padding: 12 },
  terminateInput: {
    borderWidth: 1, borderColor: colors.gray[300], borderRadius: 10, padding: 12,
    fontSize: 14, color: colors.gray[800], textAlignVertical: 'top', marginVertical: 12, minHeight: 80,
  },
  row: { flexDirection: 'row', gap: 10 },
  payRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  payPeriod: { fontSize: 14, fontWeight: '600', color: colors.gray[800] },
  payDate: { fontSize: 12, color: colors.gray[400], marginTop: 2 },
  payAmount: { fontSize: 15, fontWeight: '700', color: colors.gray[900], marginTop: 4 },
});
