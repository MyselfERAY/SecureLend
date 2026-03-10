import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/lib/auth-context';
import { api, extractError } from '../../../src/lib/api';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { Badge, getStatusBadge } from '../../../src/components/ui/Badge';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../src/components/ui/ErrorMessage';
import { SuccessMessage } from '../../../src/components/ui/ErrorMessage';
import { colors } from '../../../src/theme/colors';
import { ContractSummary, Property } from '../../../src/types';

interface TenantResult {
  id: string;
  fullName: string;
  maskedTckn: string;
  phone: string;
}

export default function ContractsListScreen() {
  const { tokens, user } = useAuth();
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create form state
  const [showForm, setShowForm] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantResult, setTenantResult] = useState<TenantResult | null>(null);
  const [tenantSearching, setTenantSearching] = useState(false);
  const [tenantError, setTenantError] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentDay, setPaymentDay] = useState('1');
  const [landlordIban, setLandlordIban] = useState('');
  const [terms, setTerms] = useState('');
  const [specialClauses, setSpecialClauses] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isLandlord = user?.roles.includes('LANDLORD');

  const loadContracts = useCallback(async () => {
    if (!tokens) return;
    const res = await api<ContractSummary[]>('/api/v1/contracts', { token: tokens.accessToken });
    if (res.status === 'success' && res.data) setContracts(res.data);
  }, [tokens]);

  const loadProperties = useCallback(async () => {
    if (!tokens) return;
    const res = await api<Property[]>('/api/v1/properties/my', { token: tokens.accessToken });
    if (res.status === 'success' && res.data) setProperties(res.data.filter((p) => p.status === 'ACTIVE'));
  }, [tokens]);

  useEffect(() => {
    Promise.all([loadContracts(), loadProperties()]).finally(() => setLoading(false));
  }, [loadContracts, loadProperties]);

  const onRefresh = async () => { setRefreshing(true); await loadContracts(); setRefreshing(false); };

  const searchTenant = async () => {
    if (!/^5\d{9}$/.test(tenantPhone)) { setTenantError('Gecerli bir telefon girin (5XXXXXXXXX)'); return; }
    setTenantError(''); setTenantSearching(true); setTenantResult(null);
    const res = await api<TenantResult>(`/api/v1/users/search?phone=${tenantPhone}`, { token: tokens!.accessToken });
    if (res.status === 'success' && res.data) {
      setTenantResult(res.data);
    } else { setTenantError(extractError(res, 'Kullanici bulunamadi')); }
    setTenantSearching(false);
  };

  const handleCreate = async () => {
    if (!tokens || !tenantResult || !selectedPropertyId || !monthlyRent || !startDate || !endDate) {
      setFormError('Zorunlu alanlari doldurun'); return;
    }
    if (!/^TR\d{24}$/.test(landlordIban)) { setFormError('Gecersiz IBAN (TR + 24 rakam)'); return; }

    setFormError(''); setSubmitting(true);
    const body: any = {
      propertyId: selectedPropertyId,
      tenantId: tenantResult.id,
      monthlyRent: Number(monthlyRent),
      startDate,
      endDate,
      paymentDayOfMonth: Number(paymentDay),
      landlordIban,
    };
    if (depositAmount) body.depositAmount = Number(depositAmount);
    if (terms) body.terms = terms;
    if (specialClauses) body.specialClauses = specialClauses;

    const res = await api('/api/v1/contracts', { method: 'POST', body, token: tokens.accessToken });
    if (res.status === 'success') {
      setShowForm(false);
      resetForm();
      await loadContracts();
    } else { setFormError(extractError(res)); }
    setSubmitting(false);
  };

  const resetForm = () => {
    setTenantPhone(''); setTenantResult(null); setSelectedPropertyId('');
    setMonthlyRent(''); setDepositAmount(''); setStartDate(''); setEndDate('');
    setPaymentDay('1'); setLandlordIban(''); setTerms(''); setSpecialClauses('');
  };

  const selectProperty = (p: Property) => {
    setSelectedPropertyId(p.id);
    setMonthlyRent(p.monthlyRent.toString());
    if (p.depositAmount) setDepositAmount(p.depositAmount.toString());
  };

  if (loading) return <LoadingSpinner />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Create Button */}
      {isLandlord && (
        <Button
          title={showForm ? 'Iptal' : '+ Yeni Sozlesme'}
          variant={showForm ? 'secondary' : 'primary'}
          onPress={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Create Form */}
      {showForm && (
        <Card style={{ marginBottom: 16 }}>
          <Text style={styles.formTitle}>Yeni Sozlesme</Text>
          {formError ? <ErrorMessage message={formError} /> : null}

          {/* Tenant Search */}
          <Text style={styles.pickLabel}>Kiraci Ara (Telefon)</Text>
          <View style={styles.searchRow}>
            <View style={{ flex: 1 }}>
              <Input
                prefix="+90"
                placeholder="5XXXXXXXXX"
                value={tenantPhone}
                onChangeText={(t) => setTenantPhone(t.replace(/\D/g, '').slice(0, 10))}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
            <Button title="Ara" onPress={searchTenant} loading={tenantSearching} size="sm" style={{ height: 48, marginBottom: 16 }} />
          </View>
          {tenantError ? <Text style={styles.errorSmall}>{tenantError}</Text> : null}
          {tenantResult && (
            <Card style={{ backgroundColor: colors.green[50], borderColor: colors.green[200], marginBottom: 12 }}>
              <Text style={{ fontWeight: '600', color: colors.green[700] }}>{tenantResult.fullName}</Text>
              <Text style={{ fontSize: 13, color: colors.green[600] }}>TCKN: {tenantResult.maskedTckn}</Text>
            </Card>
          )}

          {/* Property Selector */}
          <Text style={styles.pickLabel}>Mulk Sec</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {properties.map((p) => (
              <TouchableOpacity key={p.id} onPress={() => selectProperty(p)}>
                <View style={[styles.propPill, selectedPropertyId === p.id && styles.propPillActive]}>
                  <Text style={[styles.propPillTitle, selectedPropertyId === p.id && { color: colors.primary[700] }]}>{p.title}</Text>
                  <Text style={styles.propPillRent}>₺{p.monthlyRent.toLocaleString('tr-TR')}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Dates */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}><Input label="Baslangic *" placeholder="YYYY-MM-DD" value={startDate} onChangeText={setStartDate} /></View>
            <View style={{ flex: 1 }}><Input label="Bitis *" placeholder="YYYY-MM-DD" value={endDate} onChangeText={setEndDate} /></View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}><Input label="Kira (TL) *" value={monthlyRent} onChangeText={(t) => setMonthlyRent(t.replace(/\D/g, ''))} keyboardType="number-pad" /></View>
            <View style={{ flex: 1 }}><Input label="Depozito" value={depositAmount} onChangeText={(t) => setDepositAmount(t.replace(/\D/g, ''))} keyboardType="number-pad" /></View>
          </View>

          <Input label="Odeme Gunu (1-28)" value={paymentDay} onChangeText={(t) => setPaymentDay(t.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" />

          <Input
            label="Ev Sahibi IBAN *"
            placeholder="TR + 24 rakam"
            value={landlordIban}
            onChangeText={(t) => setLandlordIban(t.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 26))}
            maxLength={26}
            error={landlordIban.length > 0 && !/^TR\d{24}$/.test(landlordIban) ? 'TR + 24 rakam olmali' : undefined}
          />

          <Input label="Sozlesme Sartlari" value={terms} onChangeText={setTerms} multiline numberOfLines={3} />
          <Input label="Ozel Sartlar" value={specialClauses} onChangeText={setSpecialClauses} multiline numberOfLines={2} />

          <Button title="Sozlesme Olustur" onPress={handleCreate} loading={submitting} disabled={!tenantResult || !selectedPropertyId} />
        </Card>
      )}

      {/* Contracts List */}
      {contracts.length === 0 ? (
        <Card><Text style={styles.emptyText}>Henuz sozlesmeniz bulunmuyor.</Text></Card>
      ) : (
        contracts.map((c) => (
          <TouchableOpacity key={c.id} onPress={() => router.push(`/(tabs)/contracts/${c.id}`)}>
            <Card style={{ marginBottom: 10 }}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{c.propertyTitle}</Text>
                <Badge {...getStatusBadge(c.status)} />
              </View>
              <Text style={styles.cardMeta}>Kiraci: {c.tenantName} | Ev Sahibi: {c.landlordName}</Text>
              <Text style={styles.cardMeta}>{new Date(c.startDate).toLocaleDateString('tr-TR')} - {new Date(c.endDate).toLocaleDateString('tr-TR')}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardAmount}>₺{c.monthlyRent.toLocaleString('tr-TR')}/ay</Text>
                {c.signatureCount !== undefined && (
                  <Text style={styles.sigCount}>{c.signatureCount}/2 imza{c.mySignature ? ' (Imzaladim)' : ''}</Text>
                )}
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  content: { padding: 16, paddingBottom: 32 },
  formTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[900], marginBottom: 16 },
  pickLabel: { fontSize: 14, fontWeight: '600', color: colors.gray[700], marginBottom: 6 },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  errorSmall: { fontSize: 12, color: colors.red[600], marginBottom: 8, marginTop: -8 },
  row: { flexDirection: 'row', gap: 10 },
  propPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.gray[100], borderWidth: 1, borderColor: colors.gray[200], marginRight: 8 },
  propPillActive: { backgroundColor: colors.primary[50], borderColor: colors.primary[500] },
  propPillTitle: { fontSize: 14, fontWeight: '600', color: colors.gray[700] },
  propPillRent: { fontSize: 12, color: colors.gray[500], marginTop: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.gray[900], flex: 1, marginRight: 8 },
  cardMeta: { fontSize: 13, color: colors.gray[500], marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  cardAmount: { fontSize: 17, fontWeight: '700', color: colors.primary[600] },
  sigCount: { fontSize: 12, color: colors.gray[400] },
  emptyText: { fontSize: 14, color: colors.gray[500], textAlign: 'center', padding: 16 },
});
