import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/lib/auth-context';
import { api, extractError } from '../../src/lib/api';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { ErrorMessage } from '../../src/components/ui/ErrorMessage';
import { colors } from '../../src/theme/colors';

const DARK_NAVY = '#0a1628';

const employmentOptions = [
  { value: 'EMPLOYED', label: 'Calisan', icon: 'briefcase' as const },
  { value: 'SELF_EMPLOYED', label: 'Serbest Meslek', icon: 'person' as const },
  { value: 'RETIRED', label: 'Emekli', icon: 'heart' as const },
  { value: 'STUDENT', label: 'Ogrenci', icon: 'school' as const },
  { value: 'UNEMPLOYED', label: 'Issiz', icon: 'search' as const },
];

export default function KmhApplyScreen() {
  const { tokens } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [employment, setEmployment] = useState('EMPLOYED');
  const [income, setIncome] = useState('');
  const [employer, setEmployer] = useState('');
  const [rent, setRent] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showEmployer = employment === 'EMPLOYED' || employment === 'SELF_EMPLOYED';

  const handleSubmit = async () => {
    if (!tokens || !income || !rent || !address) {
      setError('Zorunlu alanlari doldurun');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        employmentStatus: employment,
        monthlyIncome: Number(income),
        residentialAddress: address,
        estimatedRent: Number(rent),
      };
      if (employer) body.employerName = employer;

      const res = await api<{ applicationId: string }>('/api/v1/bank/kmh/apply', {
        method: 'POST',
        body,
        token: tokens.accessToken,
      });

      if (res.status === 'success' && res.data) {
        router.replace({ pathname: '/kmh/result', params: { applicationId: res.data.applicationId } });
      } else {
        setError(extractError(res));
      }
    } catch {
      setError('Bir hata olustu');
    }
    setSubmitting(false);
  };

  return (
    <View style={styles.container}>
      {/* Dark Navy Header */}
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
            <Text style={styles.headerTitle}>KMH Basvurusu</Text>
            <Text style={styles.headerSubtitle}>Kira Mevduat Hesabi</Text>
          </View>
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>1/4</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '25%' }]} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {error ? <ErrorMessage message={error} onDismiss={() => setError('')} /> : null}

          {/* Employment Status */}
          <Text style={styles.sectionLabel}>Istihdam Durumu *</Text>
          <View style={styles.pillRow}>
            {employmentOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.pill, employment === opt.value && styles.pillActive]}
                onPress={() => setEmployment(opt.value)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={opt.icon}
                  size={15}
                  color={employment === opt.value ? '#2563eb' : colors.gray[500]}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.pillText, employment === opt.value && styles.pillTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Income */}
          <Input
            label="Aylik Gelir *"
            value={income}
            onChangeText={(t) => setIncome(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
            placeholder="0"
            prefix="TL"
          />

          {/* Employer - conditional */}
          {showEmployer && (
            <Input
              label="Isveren Adi"
              value={employer}
              onChangeText={setEmployer}
              placeholder="Sirket adi"
            />
          )}

          {/* Estimated Rent */}
          <Input
            label="Tahmini Aylik Kira *"
            value={rent}
            onChangeText={(t) => setRent(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
            placeholder="0"
            prefix="TL"
          />

          {/* Address */}
          <Input
            label="Ikamet Adresi *"
            value={address}
            onChangeText={setAddress}
            placeholder="Adres bilgileriniz"
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: 'top', paddingTop: 14 }}
          />

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={18} color="#2563eb" />
            <Text style={styles.infoBoxText}>
              {'Onay kriterleri: Gelir >= Kira x 2 | Limit = Gelir x 3 (max 500.000 TL)'}
            </Text>
          </View>

          {/* Submit */}
          <Button
            title="Basvuruyu Gonder"
            onPress={handleSubmit}
            loading={submitting}
            size="lg"
            style={{ marginBottom: 32 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
    fontWeight: '500',
  },
  stepBadge: {
    backgroundColor: 'rgba(37,99,235,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#93c5fd',
  },
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

  // Form
  scrollArea: { flex: 1 },
  formContent: { padding: 20 },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.gray[50],
    borderWidth: 1.5,
    borderColor: colors.gray[200],
  },
  pillActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[600],
  },
  pillTextActive: {
    color: '#1d4ed8',
    fontWeight: '600',
  },

  // Info
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 20,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#1d4ed8',
    lineHeight: 17,
  },
});
