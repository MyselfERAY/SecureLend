import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, Platform,
  FlatList, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/lib/auth-context';
import { api, extractError } from '../../src/lib/api';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Badge, getStatusBadge } from '../../src/components/ui/Badge';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { ErrorMessage } from '../../src/components/ui/ErrorMessage';
import { BottomSheet, ConfirmModal } from '../../src/components/ui/Modal';
import { colors } from '../../src/theme/colors';
import { Property } from '../../src/types';
import { PROVINCES, DISTRICTS } from '../../src/data/turkey-locations';

const propertyTypes = [
  { value: 'APARTMENT', label: 'Daire', icon: 'business', color: '#2563eb', bg: '#eff6ff' },
  { value: 'HOUSE', label: 'Mustakil Ev', icon: 'home', color: '#10b981', bg: '#ecfdf5' },
  { value: 'OFFICE', label: 'Ofis', icon: 'briefcase', color: '#f59e0b', bg: '#fffbeb' },
  { value: 'SHOP', label: 'Dukkan', icon: 'storefront', color: '#8b5cf6', bg: '#f5f3ff' },
];

const initialForm = {
  title: '', addressLine1: '', city: '', district: '', neighborhood: '', street: '',
  propertyType: 'APARTMENT', roomCount: '', areaM2: '', floor: '', totalFloors: '',
  monthlyRent: '', depositAmount: '',
};

/* ── Inline Picker View (renders inside BottomSheet, not a separate Modal) ── */
interface InlinePickerProps {
  title: string;
  data: string[];
  onSelect: (value: string) => void;
  onBack: () => void;
  selected?: string;
}

function InlinePicker({ title, data, onSelect, onBack, selected }: InlinePickerProps) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!search) return data;
    const lower = search.toLocaleLowerCase('tr-TR');
    return data.filter((item) => item.toLocaleLowerCase('tr-TR').includes(lower));
  }, [data, search]);

  return (
    <View style={{ flex: 1 }}>
      <View style={pickerStyles.headerRow}>
        <TouchableOpacity onPress={onBack} style={pickerStyles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.gray[700]} />
        </TouchableOpacity>
        <Text style={pickerStyles.title}>{title}</Text>
      </View>
      <View style={pickerStyles.searchBox}>
        <Ionicons name="search" size={18} color={colors.gray[400]} />
        <TextInput
          style={pickerStyles.searchInput}
          placeholder="Ara..."
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.gray[400]} />
          </TouchableOpacity>
        ) : null}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item}
        style={{ maxHeight: 380 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[pickerStyles.item, item === selected && pickerStyles.itemSelected]}
            onPress={() => { onSelect(item); }}
          >
            <Text style={[pickerStyles.itemText, item === selected && pickerStyles.itemTextSelected]}>
              {item}
            </Text>
            {item === selected && <Ionicons name="checkmark" size={20} color="#2563eb" />}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={pickerStyles.empty}>Sonuc bulunamadi</Text>
        }
      />
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.gray[100],
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  title: {
    fontSize: 18, fontWeight: '700', color: colors.gray[900],
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.gray[50],
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
    borderWidth: 1, borderColor: colors.gray[200],
  },
  searchInput: {
    flex: 1, marginLeft: 8, fontSize: 15, color: colors.gray[900],
  },
  item: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  itemSelected: { backgroundColor: '#eff6ff' },
  itemText: { fontSize: 15, color: colors.gray[700] },
  itemTextSelected: { color: '#2563eb', fontWeight: '600' },
  empty: { textAlign: 'center', paddingVertical: 24, color: colors.gray[400], fontSize: 14 },
});

export default function PropertiesScreen() {
  const { tokens, user, refreshUser } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  // 'form' | 'city' | 'district' — controls what BottomSheet shows
  const [pickerView, setPickerView] = useState<'form' | 'city' | 'district'>('form');

  // Get districts for selected city
  const availableDistricts = useMemo(() => {
    if (!form.city) return [];
    return DISTRICTS[form.city] || [];
  }, [form.city]);

  const isLandlord = user?.roles.includes('LANDLORD');

  const loadProperties = useCallback(async () => {
    if (!tokens) return;
    const res = await api<Property[]>('/api/v1/properties/my', { token: tokens.accessToken });
    if (res.status === 'success' && res.data) setProperties(res.data);
  }, [tokens]);

  useEffect(() => {
    loadProperties().finally(() => setLoading(false));
  }, [loadProperties]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProperties();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!tokens || !form.title || !form.monthlyRent) {
      setFormError('Baslik ve kira tutari zorunludur');
      return;
    }
    setFormError('');
    setSubmitting(true);

    const body: any = {
      title: form.title,
      addressLine1: form.addressLine1,
      city: form.city,
      district: form.district,
      propertyType: form.propertyType,
      monthlyRent: Number(form.monthlyRent),
    };
    if (form.neighborhood) body.neighborhood = form.neighborhood;
    if (form.street) body.street = form.street;
    if (form.roomCount) body.roomCount = form.roomCount; // string: "3+1" format
    if (form.areaM2) body.areaM2 = Number(form.areaM2);
    if (form.floor) body.floor = Number(form.floor);
    if (form.totalFloors) body.totalFloors = Number(form.totalFloors);
    if (form.depositAmount) body.depositAmount = Number(form.depositAmount);

    const url = editingId ? `/api/v1/properties/${editingId}` : '/api/v1/properties';
    const method = editingId ? 'PATCH' : 'POST';

    const res = await api(url, { method, body, token: tokens.accessToken });
    if (res.status === 'success') {
      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
      await loadProperties();
      if (!editingId) await refreshUser();
    } else {
      setFormError(extractError(res));
    }
    setSubmitting(false);
  };

  const startEdit = (p: Property) => {
    setForm({
      title: p.title, addressLine1: p.addressLine1, city: p.city, district: p.district,
      neighborhood: (p as any).neighborhood || '', street: (p as any).street || '',
      propertyType: p.propertyType, roomCount: p.roomCount?.toString() || '',
      areaM2: p.areaM2?.toString() || '', floor: p.floor?.toString() || '',
      totalFloors: p.totalFloors?.toString() || '', monthlyRent: p.monthlyRent.toString(),
      depositAmount: p.depositAmount?.toString() || '',
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!tokens || !deleteTarget) return;
    await api(`/api/v1/properties/${deleteTarget.id}`, { method: 'DELETE', token: tokens.accessToken });
    setDeleteTarget(null);
    await loadProperties();
  };

  if (loading) return <LoadingSpinner />;

  const typeLabel = (t: string) => propertyTypes.find((pt) => pt.value === t)?.label || t;
  const typeIcon = (t: string) => propertyTypes.find((pt) => pt.value === t)?.icon || 'home';
  const typeColor = (t: string) => propertyTypes.find((pt) => pt.value === t)?.color || '#2563eb';
  const typeBg = (t: string) => propertyTypes.find((pt) => pt.value === t)?.bg || '#eff6ff';

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Mulklerim</Text>
          {properties.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{properties.length}</Text>
            </View>
          )}
        </View>

        {/* Properties List */}
        {properties.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="home-outline" size={48} color={colors.gray[300]} />
            </View>
            <Text style={styles.emptyTitle}>Henuz mulkunuz yok</Text>
            <Text style={styles.emptySubtitle}>
              Mulk ekleyerek kiralama surecini baslatin.
            </Text>
            {isLandlord && (
              <Button
                title="Mulk Ekle"
                onPress={() => { setEditingId(null); setForm(initialForm); setShowForm(true); }}
                style={{ marginTop: 20, width: 200 }}
              />
            )}
          </View>
        ) : (
          properties.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.propertyCard}
              activeOpacity={0.7}
              onPress={() => isLandlord && p.status !== 'RENTED' ? startEdit(p) : null}
            >
              <View style={styles.cardRow}>
                {/* Large rounded icon area */}
                <View style={[styles.cardIconArea, { backgroundColor: typeBg(p.propertyType) }]}>
                  <Ionicons name={typeIcon(p.propertyType) as any} size={28} color={typeColor(p.propertyType)} />
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{p.title}</Text>
                    <Badge {...getStatusBadge(p.status)} size="sm" />
                  </View>

                  <View style={styles.cardLocationRow}>
                    <Ionicons name="location-outline" size={14} color={colors.gray[400]} />
                    <Text style={styles.cardLocation} numberOfLines={1}>
                      {p.district}, {p.city}
                    </Text>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.cardRent}>
                      {p.monthlyRent.toLocaleString('tr-TR')} TL
                      <Text style={styles.cardRentPer}>/ay</Text>
                    </Text>
                    {p.status !== 'RENTED' && isLandlord && (
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          style={styles.actionIconBtn}
                          onPress={() => startEdit(p)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="create-outline" size={18} color={colors.gray[500]} />
                        </TouchableOpacity>
                        {p.status === 'ACTIVE' && (
                          <TouchableOpacity
                            style={styles.actionIconBtn}
                            onPress={() => setDeleteTarget(p)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="trash-outline" size={18} color="#ef4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      {isLandlord && properties.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => { setEditingId(null); setForm(initialForm); setFormError(''); setShowForm(true); }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      )}

      {/* Add/Edit Form - Bottom Sheet */}
      <BottomSheet
        visible={showForm}
        onClose={() => { setShowForm(false); setEditingId(null); setForm(initialForm); setPickerView('form'); }}
        title={pickerView === 'form' ? (editingId ? 'Mulku Duzenle' : 'Yeni Mulk') : undefined}
      >
        {pickerView === 'city' ? (
          <InlinePicker
            title="Il Secin"
            data={PROVINCES}
            selected={form.city}
            onSelect={(city) => { setForm((prev) => ({ ...prev, city, district: '' })); setPickerView('form'); }}
            onBack={() => setPickerView('form')}
          />
        ) : pickerView === 'district' ? (
          <InlinePicker
            title="Ilce Secin"
            data={availableDistricts}
            selected={form.district}
            onSelect={(district) => { setForm((prev) => ({ ...prev, district })); setPickerView('form'); }}
            onBack={() => setPickerView('form')}
          />
        ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
          {formError ? <ErrorMessage message={formError} /> : null}

          <Input label="Baslik *" value={form.title} onChangeText={(t) => setForm({ ...form, title: t })} placeholder="Orn: Kadikoy 2+1 Daire" />

          {/* City / District Pickers */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pickLabel}>Il *</Text>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => setPickerView('city')}>
                <Text style={[styles.pickerBtnText, !form.city && { color: colors.gray[400] }]}>
                  {form.city || 'Il secin'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.gray[400]} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pickLabel}>Ilce *</Text>
              <TouchableOpacity
                style={[styles.pickerBtn, !form.city && { opacity: 0.5 }]}
                onPress={() => form.city && setPickerView('district')}
                disabled={!form.city}
              >
                <Text style={[styles.pickerBtnText, !form.district && { color: colors.gray[400] }]}>
                  {form.district || 'Ilce secin'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.gray[400]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Neighborhood & Street */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Mahalle" value={form.neighborhood} onChangeText={(t) => setForm({ ...form, neighborhood: t })} placeholder="Orn: Caferaga Mah." />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Cadde/Sokak" value={form.street} onChangeText={(t) => setForm({ ...form, street: t })} placeholder="Orn: Moda Cad." />
            </View>
          </View>

          <Input label="Adres Detay" value={form.addressLine1} onChangeText={(t) => setForm({ ...form, addressLine1: t })} placeholder="Bina no, daire no vb." />

          {/* Property Type */}
          <Text style={styles.pickLabel}>Mulk Tipi</Text>
          <View style={styles.typeRow}>
            {propertyTypes.map((pt) => (
              <TouchableOpacity
                key={pt.value}
                style={[styles.typePill, form.propertyType === pt.value && styles.typePillActive]}
                onPress={() => setForm({ ...form, propertyType: pt.value })}
              >
                <Ionicons
                  name={pt.icon as any}
                  size={16}
                  color={form.propertyType === pt.value ? '#2563eb' : colors.gray[500]}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.typePillText, form.propertyType === pt.value && styles.typePillTextActive]}>
                  {pt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}><Input label="Oda (orn: 3+1)" value={form.roomCount} onChangeText={(t) => setForm({ ...form, roomCount: t.replace(/[^0-9+]/g, '') })} placeholder="3+1" /></View>
            <View style={{ flex: 1 }}><Input label="m2" value={form.areaM2} onChangeText={(t) => setForm({ ...form, areaM2: t.replace(/\D/g, '') })} keyboardType="number-pad" /></View>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}><Input label="Kat" value={form.floor} onChangeText={(t) => setForm({ ...form, floor: t.replace(/\D/g, '') })} keyboardType="number-pad" /></View>
            <View style={{ flex: 1 }}><Input label="Toplam Kat" value={form.totalFloors} onChangeText={(t) => setForm({ ...form, totalFloors: t.replace(/\D/g, '') })} keyboardType="number-pad" /></View>
          </View>
          <Input label="Aylik Kira (TL) *" value={form.monthlyRent} onChangeText={(t) => setForm({ ...form, monthlyRent: t.replace(/\D/g, '') })} keyboardType="number-pad" />
          <Input label="Depozito (TL)" value={form.depositAmount} onChangeText={(t) => setForm({ ...form, depositAmount: t.replace(/\D/g, '') })} keyboardType="number-pad" />

          <Button title={editingId ? 'Guncelle' : 'Kaydet'} onPress={handleSubmit} loading={submitting} style={{ marginBottom: 16 }} />
        </ScrollView>
        )}
      </BottomSheet>

      <ConfirmModal
        visible={!!deleteTarget}
        title="Mulku Sil"
        message={`"${deleteTarget?.title}" mulkunu silmek istediginize emin misiniz?`}
        confirmText="Evet, Sil"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 20, paddingBottom: 32 },
  row: { flexDirection: 'row', gap: 10 },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.gray[900],
  },
  countBadge: {
    backgroundColor: '#2563eb',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Property Cards
  propertyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
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
  cardRow: {
    flexDirection: 'row',
  },
  cardIconArea: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardBody: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
    flex: 1,
    marginRight: 8,
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardLocation: {
    fontSize: 13,
    color: colors.gray[500],
    marginLeft: 4,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardRent: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  cardRentPer: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[400],
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
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
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.gray[50], borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1.5, borderColor: colors.gray[200], marginBottom: 14,
  },
  pickerBtnText: { fontSize: 15, color: colors.gray[900], flex: 1 },
  pickLabel: { fontSize: 13, fontWeight: '600', color: colors.gray[500], marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.gray[50],
    borderWidth: 1.5,
    borderColor: colors.gray[200],
  },
  typePillActive: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  typePillText: { fontSize: 13, fontWeight: '500', color: colors.gray[600] },
  typePillTextActive: { color: '#1d4ed8', fontWeight: '600' },
});
