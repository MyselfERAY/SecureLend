import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/lib/auth-context';
import { api, extractError } from '../../../src/lib/api';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { Badge, getStatusBadge } from '../../../src/components/ui/Badge';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../src/components/ui/ErrorMessage';
import { SuccessMessage } from '../../../src/components/ui/ErrorMessage';
import { BottomSheet } from '../../../src/components/ui/Modal';
import { colors } from '../../../src/theme/colors';
import { ContractSummary, Property } from '../../../src/types';

interface TenantResult {
  id: string;
  fullName: string;
  maskedTckn: string;
  phone: string;
}

type FilterTab = 'ALL' | 'ACTIVE' | 'PENDING_SIGNATURES' | 'TERMINATED';

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'ALL', label: 'Tumu' },
  { key: 'ACTIVE', label: 'Aktif' },
  { key: 'PENDING_SIGNATURES', label: 'Bekleyen' },
  { key: 'TERMINATED', label: 'Sonlanan' },
];

export default function ContractsListScreen() {
  const { tokens, user } = useAuth();
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');

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
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [paymentDay, setPaymentDay] = useState('1');
  const [landlordIban, setLandlordIban] = useState('');
  const [terms, setTerms] = useState('');
  const [specialClauses, setSpecialClauses] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isLandlord = user?.roles.includes('LANDLORD');

  const formatDateDisplay = (d: Date) => {
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
  };
  const toIsoDate = (d: Date) => {
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  };

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
      startDate: toIsoDate(startDate),
      endDate: toIsoDate(endDate),
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
    setMonthlyRent(''); setDepositAmount(''); setStartDate(null); setEndDate(null);
    setPaymentDay('1'); setLandlordIban(''); setTerms(''); setSpecialClauses('');
  };

  const selectProperty = (p: Property) => {
    setSelectedPropertyId(p.id);
    setMonthlyRent(p.monthlyRent.toString());
    if (p.depositAmount) setDepositAmount(p.depositAmount.toString());
  };

  if (loading) return <LoadingSpinner />;

  const filteredContracts = activeFilter === 'ALL'
    ? contracts
    : contracts.filter((c) => c.status === activeFilter);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.key;
            const count = tab.key === 'ALL' ? contracts.length : contracts.filter((c) => c.status === tab.key).length;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.filterCount, isActive && styles.filterCountActive]}>
                    <Text style={[styles.filterCountText, isActive && styles.filterCountTextActive]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Contracts List */}
        {filteredContracts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="document-text-outline" size={48} color={colors.gray[300]} />
            </View>
            <Text style={styles.emptyTitle}>
              {contracts.length === 0 ? 'Henuz sozlesmeniz yok' : 'Bu filtrede sozlesme bulunamadi'}
            </Text>
            <Text style={styles.emptySubtitle}>Sozlesme olusturarak kiralama surecini baslatin.</Text>
            {isLandlord && contracts.length === 0 && (
              <Button title="Sozlesme Olustur" onPress={() => setShowForm(true)} style={{ marginTop: 20, width: 220 }} />
            )}
          </View>
        ) : (
          filteredContracts.map((c) => {
            const sb = getStatusBadge(c.status);
            return (
              <TouchableOpacity
                key={c.id}
                style={styles.contractCard}
                onPress={() => router.push(`/(tabs)/contracts/${c.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardIconWrap}>
                    <Ionicons name="document-text" size={20} color="#2563eb" />
                  </View>
                  <Badge text={sb.text} variant={sb.variant} />
                </View>

                <Text style={styles.cardTitle} numberOfLines={1}>{c.propertyTitle}</Text>

                <View style={styles.cardParties}>
                  <View style={styles.partyRow}>
                    <Text style={styles.partyLabel}>Kiraci</Text>
                    <Text style={styles.partyValue} numberOfLines={1}>{c.tenantName}</Text>
                  </View>
                  <View style={styles.partyRow}>
                    <Text style={styles.partyLabel}>Ev Sahibi</Text>
                    <Text style={styles.partyValue} numberOfLines={1}>{c.landlordName}</Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardBottom}>
                  <View>
                    <Text style={styles.cardAmount}>
                      {c.monthlyRent.toLocaleString('tr-TR')} TL
                      <Text style={styles.cardPer}>/ay</Text>
                    </Text>
                    <Text style={styles.cardDates}>
                      {new Date(c.startDate).toLocaleDateString('tr-TR')} - {new Date(c.endDate).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                  {c.signatureCount !== undefined && (
                    <View style={styles.sigBadge}>
                      <Ionicons
                        name={c.signatureCount >= 2 ? 'checkmark-circle' : 'create-outline'}
                        size={14}
                        color={c.signatureCount >= 2 ? '#10b981' : colors.gray[500]}
                      />
                      <Text style={[styles.sigText, c.signatureCount >= 2 && { color: '#10b981' }]}>
                        {c.signatureCount}/2{c.mySignature ? ' (Imzaladim)' : ''}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardArrow}>
                  <Ionicons name="chevron-forward" size={18} color={colors.gray[300]} />
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      {isLandlord && contracts.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => { resetForm(); setFormError(''); setShowForm(true); }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      )}

      {/* Create Form - Bottom Sheet */}
      <BottomSheet
        visible={showForm}
        onClose={() => { setShowForm(false); resetForm(); }}
        title="Yeni Sozlesme"
      >
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
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
            <Button title="Ara" onPress={searchTenant} loading={tenantSearching} size="sm" style={{ height: 48, marginBottom: 20 }} />
          </View>
          {tenantError ? <Text style={styles.errorSmall}>{tenantError}</Text> : null}
          {tenantResult && (
            <View style={styles.tenantFound}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.tenantName}>{tenantResult.fullName}</Text>
                <Text style={styles.tenantTckn}>TCKN: {tenantResult.maskedTckn}</Text>
              </View>
            </View>
          )}

          {/* Property Selector */}
          <Text style={styles.pickLabel}>Mulk Sec</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {properties.map((p) => (
              <TouchableOpacity key={p.id} onPress={() => selectProperty(p)} activeOpacity={0.7}>
                <View style={[styles.propPill, selectedPropertyId === p.id && styles.propPillActive]}>
                  <Ionicons name="business" size={16} color={selectedPropertyId === p.id ? '#2563eb' : colors.gray[400]} />
                  <Text style={[styles.propPillTitle, selectedPropertyId === p.id && { color: '#1d4ed8' }]}>{p.title}</Text>
                  <Text style={styles.propPillRent}>{p.monthlyRent.toLocaleString('tr-TR')} TL</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Dates */}
          <View style={styles.formRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pickLabel}>Baslangic *</Text>
              <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowStartPicker(true)} activeOpacity={0.7}>
                <Ionicons name="calendar-outline" size={18} color={startDate ? colors.brand.dark : colors.gray[400]} />
                <Text style={[styles.datePickerText, !startDate && styles.datePickerPlaceholder]}>
                  {startDate ? formatDateDisplay(startDate) : 'Tarih sec'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pickLabel}>Bitis *</Text>
              <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowEndPicker(true)} activeOpacity={0.7}>
                <Ionicons name="calendar-outline" size={18} color={endDate ? colors.brand.dark : colors.gray[400]} />
                <Text style={[styles.datePickerText, !endDate && styles.datePickerPlaceholder]}>
                  {endDate ? formatDateDisplay(endDate) : 'Tarih sec'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Pickers */}
          {Platform.OS === 'ios' ? (
            <>
              <Modal visible={showStartPicker} transparent animationType="slide">
                <View style={styles.dateModalOverlay}>
                  <View style={styles.dateModalContent}>
                    <View style={styles.dateModalHeader}>
                      <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                        <Text style={styles.dateModalCancel}>Iptal</Text>
                      </TouchableOpacity>
                      <Text style={styles.dateModalTitle}>Baslangic Tarihi</Text>
                      <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                        <Text style={styles.dateModalDone}>Tamam</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={startDate || new Date()}
                      mode="date"
                      display="spinner"
                      minimumDate={new Date()}
                      onChange={(_, selected) => { if (selected) setStartDate(selected); }}
                      locale="tr"
                    />
                  </View>
                </View>
              </Modal>
              <Modal visible={showEndPicker} transparent animationType="slide">
                <View style={styles.dateModalOverlay}>
                  <View style={styles.dateModalContent}>
                    <View style={styles.dateModalHeader}>
                      <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                        <Text style={styles.dateModalCancel}>Iptal</Text>
                      </TouchableOpacity>
                      <Text style={styles.dateModalTitle}>Bitis Tarihi</Text>
                      <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                        <Text style={styles.dateModalDone}>Tamam</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={endDate || (startDate ? new Date(startDate.getTime() + 365 * 86400000) : new Date(Date.now() + 365 * 86400000))}
                      mode="date"
                      display="spinner"
                      minimumDate={startDate || new Date()}
                      onChange={(_, selected) => { if (selected) setEndDate(selected); }}
                      locale="tr"
                    />
                  </View>
                </View>
              </Modal>
            </>
          ) : (
            <>
              {showStartPicker && (
                <DateTimePicker
                  value={startDate || new Date()}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(_, selected) => { setShowStartPicker(false); if (selected) setStartDate(selected); }}
                />
              )}
              {showEndPicker && (
                <DateTimePicker
                  value={endDate || (startDate ? new Date(startDate.getTime() + 365 * 86400000) : new Date(Date.now() + 365 * 86400000))}
                  mode="date"
                  display="default"
                  minimumDate={startDate || new Date()}
                  onChange={(_, selected) => { setShowEndPicker(false); if (selected) setEndDate(selected); }}
                />
              )}
            </>
          )}

          <View style={styles.formRow}>
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

          <Button title="Sozlesme Olustur" onPress={handleCreate} loading={submitting} disabled={!tenantResult || !selectedPropertyId} style={{ marginBottom: 16 }} />
        </ScrollView>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 20, paddingBottom: 32 },

  // Filter Chips
  filterScroll: { marginHorizontal: -20, marginBottom: 20 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: colors.white,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#0a1628',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  filterChipActive: {
    backgroundColor: '#0a1628',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[600],
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  filterCount: {
    backgroundColor: colors.gray[100],
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gray[600],
  },
  filterCountTextActive: {
    color: '#ffffff',
  },

  // Contract Cards
  contractCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    position: 'relative',
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
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 10,
  },
  cardParties: {
    gap: 6,
    marginBottom: 12,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partyLabel: {
    fontSize: 13,
    color: colors.gray[400],
    width: 80,
    fontWeight: '500',
  },
  partyValue: {
    fontSize: 13,
    color: colors.gray[700],
    fontWeight: '500',
    flex: 1,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray[200],
    marginBottom: 12,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  cardPer: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[400],
  },
  cardDates: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  sigBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gray[50],
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  sigText: {
    fontSize: 12,
    color: colors.gray[500],
    fontWeight: '500',
  },
  cardArrow: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -9,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
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

  // FAB
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },

  // Form
  pickLabel: { fontSize: 13, fontWeight: '600', color: colors.gray[500], marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  errorSmall: { fontSize: 12, color: '#ef4444', marginBottom: 8, marginTop: -8 },
  formRow: { flexDirection: 'row', gap: 10 },
  tenantFound: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  tenantName: { fontWeight: '600', color: '#059669', fontSize: 14 },
  tenantTckn: { fontSize: 12, color: '#10b981', marginTop: 2 },
  propPill: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.gray[50],
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    marginRight: 8,
    alignItems: 'center',
    gap: 4,
  },
  propPillActive: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  propPillTitle: { fontSize: 14, fontWeight: '600', color: colors.gray[700] },
  propPillRent: { fontSize: 12, color: colors.gray[500] },

  // Date Picker
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    marginBottom: 16,
    gap: 8,
  },
  datePickerText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.brand?.dark || '#0a1628',
  },
  datePickerPlaceholder: {
    color: colors.gray[400],
  },
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  dateModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  dateModalCancel: {
    fontSize: 16,
    color: colors.gray[400],
    fontWeight: '500',
  },
  dateModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.brand?.dark || '#0a1628',
  },
  dateModalDone: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '700',
  },
});
