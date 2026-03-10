import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useAuth } from '../../src/lib/auth-context';
import { api, extractError } from '../../src/lib/api';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Badge, getStatusBadge } from '../../src/components/ui/Badge';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { ErrorMessage } from '../../src/components/ui/ErrorMessage';
import { ConfirmModal } from '../../src/components/ui/Modal';
import { colors } from '../../src/theme/colors';
import { Property } from '../../src/types';

const propertyTypes = [
  { value: 'APARTMENT', label: 'Daire' },
  { value: 'HOUSE', label: 'Mustakil Ev' },
  { value: 'OFFICE', label: 'Ofis' },
  { value: 'SHOP', label: 'Dukkan' },
];

const initialForm = {
  title: '', addressLine1: '', city: '', district: '', propertyType: 'APARTMENT',
  roomCount: '', areaM2: '', floor: '', totalFloors: '', monthlyRent: '', depositAmount: '',
};

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
    if (form.roomCount) body.roomCount = Number(form.roomCount);
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      {isLandlord && (
        <Button
          title={showForm ? 'Iptal' : '+ Mulk Ekle'}
          variant={showForm ? 'secondary' : 'primary'}
          onPress={() => {
            setShowForm(!showForm);
            if (showForm) { setEditingId(null); setForm(initialForm); }
          }}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Form */}
      {showForm && (
        <Card style={{ marginBottom: 16 }}>
          <Text style={styles.formTitle}>{editingId ? 'Mulku Duzenle' : 'Yeni Mulk'}</Text>
          {formError ? <ErrorMessage message={formError} /> : null}

          <Input label="Baslik *" value={form.title} onChangeText={(t) => setForm({ ...form, title: t })} placeholder="Orn: Kadikoy 2+1 Daire" />
          <Input label="Adres" value={form.addressLine1} onChangeText={(t) => setForm({ ...form, addressLine1: t })} />
          <View style={styles.row}>
            <View style={{ flex: 1 }}><Input label="Sehir" value={form.city} onChangeText={(t) => setForm({ ...form, city: t })} /></View>
            <View style={{ flex: 1 }}><Input label="Ilce" value={form.district} onChangeText={(t) => setForm({ ...form, district: t })} /></View>
          </View>

          {/* Property Type Picker */}
          <Text style={styles.pickLabel}>Mulk Tipi</Text>
          <View style={styles.typeRow}>
            {propertyTypes.map((pt) => (
              <TouchableOpacity
                key={pt.value}
                style={[styles.typePill, form.propertyType === pt.value && styles.typePillActive]}
                onPress={() => setForm({ ...form, propertyType: pt.value })}
              >
                <Text style={[styles.typePillText, form.propertyType === pt.value && styles.typePillTextActive]}>{pt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}><Input label="Oda" value={form.roomCount} onChangeText={(t) => setForm({ ...form, roomCount: t.replace(/\D/g, '') })} keyboardType="number-pad" /></View>
            <View style={{ flex: 1 }}><Input label="m2" value={form.areaM2} onChangeText={(t) => setForm({ ...form, areaM2: t.replace(/\D/g, '') })} keyboardType="number-pad" /></View>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}><Input label="Kat" value={form.floor} onChangeText={(t) => setForm({ ...form, floor: t.replace(/\D/g, '') })} keyboardType="number-pad" /></View>
            <View style={{ flex: 1 }}><Input label="Toplam Kat" value={form.totalFloors} onChangeText={(t) => setForm({ ...form, totalFloors: t.replace(/\D/g, '') })} keyboardType="number-pad" /></View>
          </View>
          <Input label="Aylik Kira (TL) *" value={form.monthlyRent} onChangeText={(t) => setForm({ ...form, monthlyRent: t.replace(/\D/g, '') })} keyboardType="number-pad" />
          <Input label="Depozito (TL)" value={form.depositAmount} onChangeText={(t) => setForm({ ...form, depositAmount: t.replace(/\D/g, '') })} keyboardType="number-pad" />

          <Button title={editingId ? 'Guncelle' : 'Kaydet'} onPress={handleSubmit} loading={submitting} />
        </Card>
      )}

      {/* Properties List */}
      {properties.length === 0 ? (
        <Card><Text style={styles.emptyText}>Henuz mulkunuz bulunmuyor.</Text></Card>
      ) : (
        properties.map((p) => (
          <Card key={p.id} style={{ marginBottom: 10 }}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{p.title}</Text>
              <Badge {...getStatusBadge(p.status)} />
            </View>
            {p.addressLine1 ? <Text style={styles.cardMeta}>{p.addressLine1}</Text> : null}
            <Text style={styles.cardMeta}>{p.district}, {p.city}</Text>
            <View style={styles.chipRow}>
              <View style={styles.chip}><Text style={styles.chipText}>{typeLabel(p.propertyType)}</Text></View>
              {p.roomCount ? <View style={styles.chip}><Text style={styles.chipText}>{p.roomCount} Oda</Text></View> : null}
              {p.areaM2 ? <View style={styles.chip}><Text style={styles.chipText}>{p.areaM2} m2</Text></View> : null}
            </View>
            <Text style={styles.rentText}>₺{p.monthlyRent.toLocaleString('tr-TR')}/ay</Text>
            {p.status !== 'RENTED' && isLandlord && (
              <View style={styles.actionRow}>
                <Button title="Duzenle" variant="outline" size="sm" onPress={() => startEdit(p)} />
                {p.status === 'ACTIVE' && (
                  <Button title="Sil" variant="danger" size="sm" onPress={() => setDeleteTarget(p)} />
                )}
              </View>
            )}
          </Card>
        ))
      )}

      <ConfirmModal
        visible={!!deleteTarget}
        title="Mulku Sil"
        message={`"${deleteTarget?.title}" mulkunu silmek istediginize emin misiniz?`}
        confirmText="Evet, Sil"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  content: { padding: 16, paddingBottom: 32 },
  formTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[900], marginBottom: 16 },
  row: { flexDirection: 'row', gap: 10 },
  pickLabel: { fontSize: 14, fontWeight: '600', color: colors.gray[700], marginBottom: 6 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  typePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.gray[100], borderWidth: 1, borderColor: colors.gray[200] },
  typePillActive: { backgroundColor: colors.primary[100], borderColor: colors.primary[500] },
  typePillText: { fontSize: 13, fontWeight: '500', color: colors.gray[600] },
  typePillTextActive: { color: colors.primary[700] },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.gray[900], flex: 1 },
  cardMeta: { fontSize: 13, color: colors.gray[500], marginTop: 4 },
  chipRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  chip: { backgroundColor: colors.gray[100], paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  chipText: { fontSize: 12, color: colors.gray[600], fontWeight: '500' },
  rentText: { fontSize: 17, fontWeight: '700', color: colors.primary[600], marginTop: 10 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  emptyText: { fontSize: 14, color: colors.gray[500], textAlign: 'center', padding: 16 },
});
