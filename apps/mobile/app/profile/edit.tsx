import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/lib/auth-context';
import { api, extractError } from '../../src/lib/api';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { ErrorMessage } from '../../src/components/ui/ErrorMessage';
import { SuccessMessage } from '../../src/components/ui/ErrorMessage';
import { colors } from '../../src/theme/colors';

const DARK_NAVY = '#0a1628';

export default function ProfileEditScreen() {
  const { user, tokens, refreshUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setAddress(user.address || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!tokens) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');

    const body: Record<string, string | undefined> = {};
    if (email !== (user?.email || '')) body.email = email || undefined;
    if (address !== (user?.address || '')) body.address = address || undefined;

    if (Object.keys(body).length === 0) {
      setSuccessMsg('Degisiklik yok.');
      setSaving(false);
      return;
    }

    const res = await api('/api/v1/users/me', {
      method: 'PATCH',
      body,
      token: tokens.accessToken,
    });

    if (res.status === 'success') {
      await refreshUser();
      setSuccessMsg('Profil basariyla guncellendi!');
    } else {
      setError(extractError(res));
    }
    setSaving(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Dark Navy Header */}
      <View style={[styles.headerSection, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profili Duzenle</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {error ? <ErrorMessage message={error} onDismiss={() => setError('')} /> : null}
        {successMsg ? <SuccessMessage message={successMsg} onDismiss={() => setSuccessMsg('')} /> : null}

        {/* Non-editable Fields */}
        <Text style={styles.sectionLabel}>Kimlik Bilgileri</Text>
        <Text style={styles.sectionHint}>Bu alanlar kimlik dogrulama gerektirdigindan degistirilemez.</Text>
        <View style={styles.sectionCard}>
          <DisabledRow icon="person-outline" label="Ad Soyad" value={user?.fullName || ''} />
          <DisabledRow icon="id-card-outline" label="TCKN" value={user?.maskedTckn || ''} />
          <DisabledRow icon="call-outline" label="Telefon" value={user?.phone ? `+90 ${user.phone}` : ''} />
          <DisabledRow
            icon="calendar-outline"
            label="Dogum Tarihi"
            value={user?.dateOfBirth ? user.dateOfBirth.split('-').reverse().join('.') : '-'}
            last
          />
        </View>

        {/* Editable Fields */}
        <Text style={styles.sectionLabel}>Duzenlenebilir Bilgiler</Text>
        <View style={styles.sectionCard}>
          <View style={styles.inputWrapper}>
            <Input
              label="E-posta"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="ornek@email.com"
            />
          </View>
          <View style={styles.inputWrapper}>
            <Input
              label="Adres"
              value={address}
              onChangeText={setAddress}
              placeholder="Ev veya is adresiniz"
              multiline
            />
          </View>
        </View>

        {/* Save Button */}
        <Button
          title="Kaydet"
          onPress={handleSave}
          loading={saving}
          style={{ marginTop: 8 }}
        />

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function DisabledRow({ icon, label, value, last }: { icon: string; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.disabledRow, !last && styles.disabledRowBorder]}>
      <View style={styles.disabledRowLeft}>
        <View style={styles.disabledIconWrap}>
          <Ionicons name={icon as any} size={18} color={colors.gray[400]} />
        </View>
        <Text style={styles.disabledLabel}>{label}</Text>
      </View>
      <View style={styles.disabledRight}>
        <Text style={styles.disabledValue} numberOfLines={1}>{value}</Text>
        <Ionicons name="lock-closed" size={12} color={colors.gray[300]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f1f5f9' },
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 24 },

  // Dark Navy Header
  headerSection: {
    backgroundColor: DARK_NAVY,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Sections
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginLeft: 4,
    marginTop: 4,
  },
  sectionHint: {
    fontSize: 12,
    color: colors.gray[400],
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
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

  // Disabled rows
  disabledRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 52,
    opacity: 0.6,
  },
  disabledRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[100],
  },
  disabledRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  disabledLabel: {
    fontSize: 15,
    color: colors.gray[500],
    fontWeight: '500',
  },
  disabledRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '50%',
  },
  disabledValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[600],
    textAlign: 'right',
  },

  // Input wrapper
  inputWrapper: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
});
