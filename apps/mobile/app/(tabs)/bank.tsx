import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useAuth } from '../../src/lib/auth-context';
import { api, extractError } from '../../src/lib/api';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Badge, getStatusBadge } from '../../src/components/ui/Badge';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { ErrorMessage } from '../../src/components/ui/ErrorMessage';
import { SuccessMessage } from '../../src/components/ui/ErrorMessage';
import { colors } from '../../src/theme/colors';
import { KmhApplication, BankAccount, Transaction } from '../../src/types';

const employmentOptions = [
  { value: 'EMPLOYED', label: 'Calisan' },
  { value: 'SELF_EMPLOYED', label: 'Serbest Meslek' },
  { value: 'RETIRED', label: 'Emekli' },
  { value: 'STUDENT', label: 'Ogrenci' },
  { value: 'UNEMPLOYED', label: 'Issiz' },
];

export default function BankScreen() {
  const { tokens } = useAuth();
  const [tab, setTab] = useState<'kmh' | 'accounts'>('kmh');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // KMH
  const [applications, setApplications] = useState<KmhApplication[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [employment, setEmployment] = useState('EMPLOYED');
  const [income, setIncome] = useState('');
  const [employer, setEmployer] = useState('');
  const [address, setAddress] = useState('');
  const [rent, setRent] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleApply = async () => {
    if (!tokens || !income || !rent || !address) { setFormError('Zorunlu alanlari doldurun'); return; }
    setFormError(''); setSubmitting(true);
    const body: any = { employmentStatus: employment, monthlyIncome: Number(income), residentialAddress: address, estimatedRent: Number(rent) };
    if (employer) body.employerName = employer;
    const res = await api('/api/v1/bank/kmh/apply', { method: 'POST', body, token: tokens.accessToken });
    if (res.status === 'success') {
      setFormSuccess('KMH basvurunuz alindi!');
      setShowForm(false);
      setIncome(''); setEmployer(''); setAddress(''); setRent('');
      await loadData();
    } else { setFormError(extractError(res)); }
    setSubmitting(false);
  };

  const handleOnboarding = async (appId: string) => {
    if (!tokens) return;
    const res = await api(`/api/v1/bank/kmh/${appId}/complete-onboarding`, { method: 'POST', token: tokens.accessToken });
    if (res.status === 'success') { await loadData(); }
  };

  const loadTransactions = async (accountId: string) => {
    if (!tokens) return;
    setSelectedAccount(accountId);
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'kmh' && styles.tabActive]} onPress={() => setTab('kmh')}>
          <Text style={[styles.tabText, tab === 'kmh' && styles.tabTextActive]}>KMH Basvurusu</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'accounts' && styles.tabActive]} onPress={() => setTab('accounts')}>
          <Text style={[styles.tabText, tab === 'accounts' && styles.tabTextActive]}>Hesaplar</Text>
        </TouchableOpacity>
      </View>

      {tab === 'kmh' && (
        <>
          {formSuccess ? <SuccessMessage message={formSuccess} onDismiss={() => setFormSuccess('')} /> : null}

          {/* Onboarding Alert */}
          {needsOnboarding && (
            <Card style={{ marginBottom: 12, borderLeftWidth: 4, borderLeftColor: colors.yellow[500] }}>
              <Text style={styles.alertTitle}>KMH Basvurunuz Onaylandi!</Text>
              <Text style={styles.alertMeta}>Onaylanan Limit: ₺{needsOnboarding.approvedLimit?.toLocaleString('tr-TR')}</Text>
              <Button title="Dijital Onboarding Tamamla" variant="success" size="sm" onPress={() => handleOnboarding(needsOnboarding.id)} style={{ marginTop: 10 }} />
            </Card>
          )}

          {/* Apply Button */}
          {canApply && (
            <Button title={showForm ? 'Iptal' : '+ Yeni KMH Basvurusu'} variant={showForm ? 'secondary' : 'primary'} onPress={() => setShowForm(!showForm)} style={{ marginBottom: 12 }} />
          )}

          {/* Application Form */}
          {showForm && (
            <Card style={{ marginBottom: 16 }}>
              <Text style={styles.formTitle}>KMH Basvuru Formu</Text>
              {formError ? <ErrorMessage message={formError} /> : null}

              <Text style={styles.pickLabel}>Istihdam Durumu</Text>
              <View style={styles.typeRow}>
                {employmentOptions.map((opt) => (
                  <TouchableOpacity key={opt.value} style={[styles.typePill, employment === opt.value && styles.typePillActive]} onPress={() => setEmployment(opt.value)}>
                    <Text style={[styles.typePillText, employment === opt.value && styles.typePillTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input label="Aylik Gelir (TL) *" value={income} onChangeText={(t) => setIncome(t.replace(/\D/g, ''))} keyboardType="number-pad" />
              <Input label="Isveren Adi" value={employer} onChangeText={setEmployer} />
              <Input label="Tahmini Aylik Kira (TL) *" value={rent} onChangeText={(t) => setRent(t.replace(/\D/g, ''))} keyboardType="number-pad" />
              <Input label="Ikamet Adresi *" value={address} onChangeText={setAddress} />

              <Card style={{ backgroundColor: colors.primary[50], borderColor: colors.primary[200], marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: colors.primary[700] }}>Onay kriterleri: Gelir ≥ Kira x 2 | Limit = Gelir x 3 (max 500.000 TL)</Text>
              </Card>

              <Button title="Basvuru Gonder" onPress={handleApply} loading={submitting} />
            </Card>
          )}

          {/* Application History */}
          <Text style={styles.sectionTitle}>Basvuru Gecmisi</Text>
          {applications.length === 0 ? (
            <Card><Text style={styles.emptyText}>Henuz KMH basvurunuz yok.</Text></Card>
          ) : (
            applications.map((app) => (
              <Card key={app.id} style={{ marginBottom: 10 }}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardDate}>{new Date(app.createdAt).toLocaleDateString('tr-TR')}</Text>
                  <Badge {...getStatusBadge(app.status)} />
                </View>
                <Text style={styles.cardMeta}>Istihdam: {employmentOptions.find((o) => o.value === app.employmentStatus)?.label}</Text>
                <Text style={styles.cardMeta}>Gelir: ₺{app.monthlyIncome.toLocaleString('tr-TR')} | Tahmini Kira: ₺{app.estimatedRent.toLocaleString('tr-TR')}</Text>
                {app.approvedLimit && <Text style={styles.limitText}>Onaylanan Limit: ₺{app.approvedLimit.toLocaleString('tr-TR')}</Text>}
                {app.bankAccount && <Text style={styles.accountText}>Hesap: {app.bankAccount.accountNumber}</Text>}
                {app.rejectionReason && <Text style={styles.rejectText}>{app.rejectionReason}</Text>}
              </Card>
            ))
          )}
        </>
      )}

      {tab === 'accounts' && (
        <>
          {accounts.length === 0 ? (
            <Card><Text style={styles.emptyText}>Henuz banka hesabiniz yok.</Text></Card>
          ) : (
            accounts.map((acc) => (
              <TouchableOpacity key={acc.accountId} onPress={() => loadTransactions(acc.accountId)}>
                <Card style={selectedAccount === acc.accountId ? { marginBottom: 10, borderColor: colors.primary[500], borderWidth: 2 } : { marginBottom: 10 }}>
                  <Text style={styles.accNumber}>{acc.accountNumber}</Text>
                  <Text style={styles.accBalance}>₺{acc.balance.toLocaleString('tr-TR')}</Text>
                  {acc.creditLimit != null && <Text style={styles.cardMeta}>Kredi Limiti: ₺{acc.creditLimit.toLocaleString('tr-TR')}</Text>}
                  <Text style={styles.cardMeta}>Kullanilabilir: ₺{acc.availableBalance.toLocaleString('tr-TR')}</Text>
                </Card>
              </TouchableOpacity>
            ))
          )}

          {/* Transactions */}
          {selectedAccount && (
            <>
              <Text style={styles.sectionTitle}>Islemler</Text>
              {txLoading ? <LoadingSpinner text="Islemler yukleniyor..." /> : (
                transactions.length === 0 ? (
                  <Card><Text style={styles.emptyText}>Islem bulunamadi.</Text></Card>
                ) : (
                  transactions.map((tx) => (
                    <Card key={tx.id} style={{ marginBottom: 8 }}>
                      <View style={styles.txRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.txDesc}>{tx.description}</Text>
                          <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleString('tr-TR')}</Text>
                        </View>
                        <Text style={[styles.txAmount, { color: tx.direction === 'IN' ? colors.green[600] : colors.red[600] }]}>
                          {tx.direction === 'IN' ? '+' : '-'}₺{tx.amount.toLocaleString('tr-TR')}
                        </Text>
                      </View>
                    </Card>
                  ))
                )
              )}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  content: { padding: 16, paddingBottom: 32 },
  tabRow: { flexDirection: 'row', backgroundColor: colors.gray[100], borderRadius: 10, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: colors.white, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.gray[500] },
  tabTextActive: { color: colors.primary[600] },
  formTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[900], marginBottom: 16 },
  pickLabel: { fontSize: 14, fontWeight: '600', color: colors.gray[700], marginBottom: 6 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  typePill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.gray[100], borderWidth: 1, borderColor: colors.gray[200] },
  typePillActive: { backgroundColor: colors.primary[100], borderColor: colors.primary[500] },
  typePillText: { fontSize: 13, fontWeight: '500', color: colors.gray[600] },
  typePillTextActive: { color: colors.primary[700] },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.gray[800], marginBottom: 12, marginTop: 8 },
  alertTitle: { fontSize: 15, fontWeight: '700', color: colors.yellow[800] },
  alertMeta: { fontSize: 14, color: colors.yellow[700], marginTop: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDate: { fontSize: 13, fontWeight: '600', color: colors.gray[600] },
  cardMeta: { fontSize: 13, color: colors.gray[500], marginTop: 4 },
  limitText: { fontSize: 15, fontWeight: '700', color: colors.green[600], marginTop: 6 },
  accountText: { fontSize: 13, fontWeight: '500', color: colors.primary[600], marginTop: 4, fontFamily: 'monospace' },
  rejectText: { fontSize: 13, color: colors.red[600], marginTop: 4 },
  accNumber: { fontSize: 14, fontWeight: '600', color: colors.gray[700], fontFamily: 'monospace' },
  accBalance: { fontSize: 26, fontWeight: '800', color: colors.gray[900], marginTop: 4 },
  txRow: { flexDirection: 'row', alignItems: 'center' },
  txDesc: { fontSize: 14, fontWeight: '500', color: colors.gray[800] },
  txDate: { fontSize: 12, color: colors.gray[400], marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: '700' },
  emptyText: { fontSize: 14, color: colors.gray[500], textAlign: 'center', padding: 16 },
});
