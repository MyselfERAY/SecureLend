import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';
import { api, extractError } from '../../src/lib/api';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Badge } from '../../src/components/ui/Badge';
import { ErrorMessage } from '../../src/components/ui/ErrorMessage';
import { SuccessMessage } from '../../src/components/ui/ErrorMessage';
import { colors } from '../../src/theme/colors';

export default function ProfileScreen() {
  const { user, tokens, refreshUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [addingRole, setAddingRole] = useState(false);
  const [roleMsg, setRoleMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!tokens) return;
    setSaving(true); setError(''); setSaveMsg('');
    const body: any = {};
    if (fullName !== user?.fullName) body.fullName = fullName;
    if (email !== (user?.email || '')) body.email = email || undefined;

    const res = await api('/api/v1/users/me', { method: 'PATCH', body, token: tokens.accessToken });
    if (res.status === 'success') {
      await refreshUser();
      setEditing(false);
      setSaveMsg('Profil güncellendi!');
    } else { setError(extractError(res)); }
    setSaving(false);
  };

  const handleAddRole = async (role: string) => {
    if (!tokens) return;
    setAddingRole(true); setRoleMsg('');
    const res = await api('/api/v1/users/me/roles', { method: 'POST', body: { role }, token: tokens.accessToken });
    if (res.status === 'success') {
      await refreshUser();
      setRoleMsg(`${role === 'TENANT' ? 'Kiracı' : 'Ev Sahibi'} rolü eklendi!`);
    } else { setRoleMsg(extractError(res)); }
    setAddingRole(false);
  };

  const roleLabels: Record<string, string> = { TENANT: 'Kiracı', LANDLORD: 'Ev Sahibi', ADMIN: 'Yönetici' };
  const hasTenant = user?.roles.includes('TENANT');
  const hasLandlord = user?.roles.includes('LANDLORD');

  return (
    <>
      <Stack.Screen options={{ title: 'Profil', headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {error ? <ErrorMessage message={error} onDismiss={() => setError('')} /> : null}
        {saveMsg ? <SuccessMessage message={saveMsg} onDismiss={() => setSaveMsg('')} /> : null}

        {/* Profile Info */}
        <Card style={{ marginBottom: 12 }}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
            {!editing && <Button title="Düzenle" variant="outline" size="sm" onPress={() => setEditing(true)} />}
          </View>

          {editing ? (
            <>
              <Input label="Ad Soyad" value={fullName} onChangeText={setFullName} />
              <Input label="E-posta" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <View style={styles.row}>
                <Button title="Kaydet" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
                <Button title="İptal" variant="secondary" onPress={() => { setEditing(false); setFullName(user?.fullName || ''); setEmail(user?.email || ''); }} style={{ flex: 1 }} />
              </View>
            </>
          ) : (
            <>
              <InfoRow label="Ad Soyad" value={user?.fullName || ''} />
              <InfoRow label="Telefon" value={`+90 ${user?.phone || ''}`} />
              <InfoRow label="TCKN" value={user?.maskedTckn || ''} />
              <InfoRow label="E-posta" value={user?.email || '-'} />
            </>
          )}
        </Card>

        {/* Roles */}
        <Card style={{ marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>Roller</Text>
          {roleMsg ? <SuccessMessage message={roleMsg} onDismiss={() => setRoleMsg('')} /> : null}
          <View style={styles.roleRow}>
            {user?.roles.map((r) => (
              <View key={r} style={styles.rolePill}>
                <Text style={styles.roleText}>{roleLabels[r] || r}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.row, { marginTop: 12 }]}>
            {!hasTenant && <Button title="+ Kiracı Rolü" variant="success" size="sm" onPress={() => handleAddRole('TENANT')} loading={addingRole} style={{ flex: 1 }} />}
            {!hasLandlord && <Button title="+ Ev Sahibi Rolu" variant="outline" size="sm" onPress={() => handleAddRole('LANDLORD')} loading={addingRole} style={{ flex: 1 }} />}
          </View>
          {hasTenant && hasLandlord && <Text style={styles.allRoles}>Tüm roller mevcut</Text>}
        </Card>

        {/* KYC */}
        <Card style={{ marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>KYC Durumu</Text>
          <Badge
            text={user?.kycStatus === 'COMPLETED' ? 'Doğrulandı' : user?.kycStatus === 'REJECTED' ? 'Reddedildi' : 'Bekliyor'}
            variant={user?.kycStatus === 'COMPLETED' ? 'success' : user?.kycStatus === 'REJECTED' ? 'danger' : 'warning'}
          />
        </Card>

        {/* Logout */}
        <Button title="Çıkış Yap" variant="danger" onPress={logout} style={{ marginTop: 8 }} />
      </ScrollView>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  content: { padding: 16, paddingBottom: 32 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.gray[800], marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  infoLabel: { fontSize: 14, color: colors.gray[500] },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.gray[800] },
  roleRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  rolePill: { backgroundColor: colors.primary[100], paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  roleText: { fontSize: 13, fontWeight: '600', color: colors.primary[700] },
  allRoles: { fontSize: 13, color: colors.gray[500], marginTop: 8 },
});
