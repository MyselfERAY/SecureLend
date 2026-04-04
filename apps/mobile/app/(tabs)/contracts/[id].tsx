import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Platform,
  Alert, ActionSheetIOS,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../src/lib/auth-context';
import { api, extractError } from '../../../src/lib/api';
import { Button } from '../../../src/components/ui/Button';
import { Badge, getStatusBadge } from '../../../src/components/ui/Badge';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../src/components/ui/ErrorMessage';
import { SuccessMessage } from '../../../src/components/ui/ErrorMessage';
import { colors } from '../../../src/theme/colors';
import { ContractDetail, PaymentItem, KmhAccountOption } from '../../../src/types';

const DARK_NAVY = '#0a1628';

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tokens, user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKmhId, setSelectedKmhId] = useState('');
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');
  const [showTerminate, setShowTerminate] = useState(false);
  const [terminateReason, setTerminateReason] = useState('');
  const [terminating, setTerminating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');

  const loadData = useCallback(async () => {
    if (!tokens || !id) return;
    const [cRes, pRes] = await Promise.all([
      api<ContractDetail>(`/api/v1/contracts/${id}`, { token: tokens.accessToken }),
      api<PaymentItem[]>(`/api/v1/contracts/${id}/payments`, { token: tokens.accessToken }),
    ]);
    if (cRes.status === 'success' && cRes.data) {
      setContract(cRes.data);
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

  const isParty = isTenant || isLandlord;
  const canUploadDocument =
    isParty &&
    (contract.status === 'ACTIVE' || contract.status === 'PENDING_SIGNATURES') &&
    !contract.documentPhotoKey;

  const pickDocumentPhoto = async (source: 'camera' | 'library') => {
    let result: ImagePicker.ImagePickerResult;

    const imageOptions: ImagePicker.ImagePickerOptions = {
      quality: 0.6,
      base64: true,
      // Resize to max 1600px to keep base64 under ~2MB
      allowsEditing: false,
    };

    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Izin Gerekli', 'Kamera izni verilmedi.');
        return;
      }
      result = await ImagePicker.launchCameraAsync(imageOptions);
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Izin Gerekli', 'Galeri izni verilmedi.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync(imageOptions);
    }

    if (!result.canceled && result.assets[0]?.base64) {
      const base64 = result.assets[0].base64;
      // Check base64 size (~7MB limit to stay under 10MB JSON body)
      const sizeInMB = (base64.length * 3) / 4 / 1024 / 1024;
      if (sizeInMB > 7) {
        Alert.alert(
          'Dosya Cok Buyuk',
          `Fotograf ${sizeInMB.toFixed(1)}MB. Lutfen daha kucuk bir fotograf secin veya kamera ile cekin.`,
        );
        return;
      }
      await uploadDocument(base64);
    }
  };

  const handleDocumentUpload = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Kamera', 'Galeriden Sec', 'Iptal'],
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) pickDocumentPhoto('camera');
          else if (buttonIndex === 1) pickDocumentPhoto('library');
        },
      );
    } else {
      Alert.alert('Belge Yukle', 'Kaynak secin', [
        { text: 'Kamera', onPress: () => pickDocumentPhoto('camera') },
        { text: 'Galeriden Sec', onPress: () => pickDocumentPhoto('library') },
        { text: 'Iptal', style: 'cancel' },
      ]);
    }
  };

  const uploadDocument = async (photoBase64: string) => {
    if (!tokens) return;
    setUploading(true);
    setError('');
    setUploadSuccess('');
    const res = await api(`/api/v1/contracts/${id}/upload-document`, {
      method: 'POST',
      body: { photoBase64 },
      token: tokens.accessToken,
    });
    if (res.status === 'success') {
      setUploadSuccess('Belge basariyla yuklendi!');
      await loadData();
    } else {
      setError(extractError(res));
    }
    setUploading(false);
  };

  const sb = getStatusBadge(contract.status);

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Dark Navy Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerBadgeRow}>
            <Badge text={sb.text} variant={sb.variant} />
          </View>
          <Text style={styles.propTitle}>{contract.property.title}</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={15} color="rgba(255,255,255,0.5)" />
            <Text style={styles.propAddr}>{contract.property.addressLine1}, {contract.property.district}/{contract.property.city}</Text>
          </View>
        </View>

        {/* Key Info Grid */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <InfoItem icon="cash-outline" label="Kira" value={`${contract.monthlyRent.toLocaleString('tr-TR')} TL`} highlight />
            {contract.depositAmount ? <InfoItem icon="shield-outline" label="Depozito" value={`${contract.depositAmount.toLocaleString('tr-TR')} TL`} /> : null}
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <InfoItem icon="calendar-outline" label="Baslangic" value={new Date(contract.startDate).toLocaleDateString('tr-TR')} />
            <InfoItem icon="calendar" label="Bitis" value={new Date(contract.endDate).toLocaleDateString('tr-TR')} />
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <InfoItem icon="time-outline" label="Odeme Gunu" value={`Her ay ${contract.paymentDayOfMonth}.`} />
            {contract.landlordIban ? <InfoItem icon="card-outline" label="IBAN" value={contract.landlordIban} mono /> : null}
          </View>
        </View>

        {/* Parties */}
        <Text style={styles.sectionTitle}>Taraflar</Text>
        <View style={styles.partiesRow}>
          <View style={styles.partyCard}>
            <View style={[styles.partyAvatar, { backgroundColor: '#fffbeb' }]}>
              <Text style={[styles.partyInitial, { color: '#d97706' }]}>
                {contract.landlord.fullName.charAt(0)}
              </Text>
            </View>
            <Text style={styles.partyRole}>Ev Sahibi</Text>
            <Text style={styles.partyName}>{contract.landlord.fullName}</Text>
            <Text style={styles.partyTckn}>{contract.landlord.tcknMasked}</Text>
          </View>
          <View style={styles.partyCard}>
            <View style={[styles.partyAvatar, { backgroundColor: '#eff6ff' }]}>
              <Text style={[styles.partyInitial, { color: '#2563eb' }]}>
                {contract.tenant.fullName.charAt(0)}
              </Text>
            </View>
            <Text style={styles.partyRole}>Kiraci</Text>
            <Text style={styles.partyName}>{contract.tenant.fullName}</Text>
            <Text style={styles.partyTckn}>{contract.tenant.tcknMasked}</Text>
          </View>
        </View>

        {/* Contract Conditions (Phase D) */}
        {(contract.rentIncreaseType || contract.noticePeriodDays != null || contract.furnitureIncluded != null || contract.petsAllowed != null || contract.sublettingAllowed != null || contract.documentPhotoKey) && (
          <>
            <Text style={styles.sectionTitle}>Sozlesme Kosullari</Text>
            <View style={styles.sectionCard}>
              {contract.rentIncreaseType && (
                <View style={styles.conditionRow}>
                  <Ionicons name="trending-up-outline" size={18} color={colors.gray[500]} />
                  <Text style={styles.conditionLabel}>Kira Artisi</Text>
                  <View style={styles.conditionPill}>
                    <Text style={styles.conditionPillText}>
                      {contract.rentIncreaseType === 'TUFE'
                        ? 'TUFE Bazli'
                        : contract.rentIncreaseType === 'FIXED_RATE'
                          ? `Sabit %${contract.rentIncreaseRate ?? ''}`
                          : contract.rentIncreaseType === 'NONE'
                            ? 'Artis Yok'
                            : contract.rentIncreaseType}
                    </Text>
                  </View>
                </View>
              )}
              {contract.noticePeriodDays != null && (
                <View style={[styles.conditionRow, styles.conditionBorder]}>
                  <Ionicons name="time-outline" size={18} color={colors.gray[500]} />
                  <Text style={styles.conditionLabel}>Ihbar Suresi</Text>
                  <Text style={styles.conditionValue}>{contract.noticePeriodDays} gun</Text>
                </View>
              )}
              {contract.furnitureIncluded != null && (
                <View style={[styles.conditionRow, styles.conditionBorder]}>
                  <Ionicons name={contract.furnitureIncluded ? 'checkmark-circle' : 'close-circle'} size={18} color={contract.furnitureIncluded ? '#10b981' : '#ef4444'} />
                  <Text style={styles.conditionLabel}>Esyali</Text>
                  <Text style={[styles.conditionValue, { color: contract.furnitureIncluded ? '#10b981' : '#ef4444' }]}>
                    {contract.furnitureIncluded ? 'Evet' : 'Hayir'}
                  </Text>
                </View>
              )}
              {contract.petsAllowed != null && (
                <View style={[styles.conditionRow, styles.conditionBorder]}>
                  <Ionicons name={contract.petsAllowed ? 'checkmark-circle' : 'close-circle'} size={18} color={contract.petsAllowed ? '#10b981' : '#ef4444'} />
                  <Text style={styles.conditionLabel}>Evcil Hayvan</Text>
                  <Text style={[styles.conditionValue, { color: contract.petsAllowed ? '#10b981' : '#ef4444' }]}>
                    {contract.petsAllowed ? 'Izinli' : 'Izinsiz'}
                  </Text>
                </View>
              )}
              {contract.sublettingAllowed != null && (
                <View style={[styles.conditionRow, styles.conditionBorder]}>
                  <Ionicons name={contract.sublettingAllowed ? 'checkmark-circle' : 'close-circle'} size={18} color={contract.sublettingAllowed ? '#10b981' : '#ef4444'} />
                  <Text style={styles.conditionLabel}>Alt Kiralama</Text>
                  <Text style={[styles.conditionValue, { color: contract.sublettingAllowed ? '#10b981' : '#ef4444' }]}>
                    {contract.sublettingAllowed ? 'Izinli' : 'Izinsiz'}
                  </Text>
                </View>
              )}
              {contract.documentPhotoKey && (
                <View style={[styles.conditionRow, styles.conditionBorder]}>
                  <Ionicons name="document-attach-outline" size={18} color="#2563eb" />
                  <Text style={styles.conditionLabel}>Belge</Text>
                  <View style={styles.docBadge}>
                    <Ionicons name="checkmark" size={12} color="#2563eb" />
                    <Text style={styles.docBadgeText}>Belge yuklendi</Text>
                  </View>
                </View>
              )}
            </View>
          </>
        )}

        {/* KMH Selection (Tenant only, pending signatures) */}
        {isTenant && contract.status === 'PENDING_SIGNATURES' && (
          <>
            <Text style={styles.sectionTitle}>KMH Hesap Secimi</Text>
            <View style={styles.sectionCard}>
              {kmhAccounts.length === 0 ? (
                <View style={styles.alertBox}>
                  <Ionicons name="alert-circle" size={20} color="#ef4444" />
                  <Text style={styles.alertText}>Aktif KMH hesabiniz bulunmuyor. Banka sayfasindan KMH basvurusu yapin.</Text>
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
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radio, isSelected && styles.radioSelected]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.kmhNumber, disabled && { color: colors.gray[400] }]}>{acc.accountNumber}</Text>
                        <Text style={styles.kmhLimit}>Limit: {acc.creditLimit.toLocaleString('tr-TR')} TL</Text>
                        {isBound && <Text style={styles.kmhBound}>Baska sozlesmeye bagli</Text>}
                        {!isEligible && !isBound && <Text style={styles.kmhInsufficient}>Limit yetersiz (min {contract.monthlyRent.toLocaleString('tr-TR')} TL)</Text>}
                      </View>
                      {isEligible && !isBound && <Ionicons name="checkmark-circle" size={22} color="#10b981" />}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </>
        )}

        {/* Signatures */}
        <Text style={styles.sectionTitle}>Imzalar</Text>
        <View style={styles.sectionCard}>
          {contract.signatures.length === 0 && (
            <Text style={styles.noSigText}>Henuz imza yok</Text>
          )}
          {contract.signatures.map((sig, i) => (
            <View key={i} style={[styles.sigRow, i < contract.signatures.length - 1 && styles.sigBorder]}>
              <View style={styles.sigCheck}>
                <Ionicons name="checkmark-circle" size={22} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sigName}>{sig.signedByName}</Text>
                <Text style={styles.sigMeta}>{sig.role === 'LANDLORD' ? 'Ev Sahibi' : 'Kiraci'} - {new Date(sig.signedAt).toLocaleString('tr-TR')}</Text>
              </View>
            </View>
          ))}
        </View>

        {error ? <View style={{ paddingHorizontal: 20 }}><ErrorMessage message={error} onDismiss={() => setError('')} /></View> : null}
        {uploadSuccess ? <View style={{ paddingHorizontal: 20 }}><SuccessMessage message={uploadSuccess} onDismiss={() => setUploadSuccess('')} /></View> : null}

        {/* Document Upload Button */}
        {canUploadDocument && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleDocumentUpload}
              activeOpacity={0.8}
              disabled={uploading}
            >
              <View style={styles.uploadIconWrap}>
                <Ionicons name="camera-outline" size={20} color="#2563eb" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.uploadTitle}>
                  {uploading ? 'Yukleniyor...' : 'Belge Yukle'}
                </Text>
                <Text style={styles.uploadSubtitle}>
                  Imzali sozlesme fotografini yukleyin
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.gray[400]} />
            </TouchableOpacity>
          </View>
        )}

        {/* Sign Warning */}
        {isTenant && contract.status === 'PENDING_SIGNATURES' && !mySignature && !kmhOk && (
          <View style={styles.warningBox}>
            <Ionicons name="information-circle" size={20} color="#f59e0b" />
            <Text style={styles.warningText}>
              {kmhAccounts.length === 0
                ? 'Imzalamak icin aktif KMH hesabi gereklidir.'
                : !selectedKmhId
                  ? 'Lutfen bir KMH hesabi secin.'
                  : 'Secilen hesabin limiti yetersiz.'}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        {canTerminate && !showTerminate && (
          <View style={styles.actionButtons}>
            <Button title="Sozlesmeyi Feshet" variant="danger" onPress={() => setShowTerminate(true)} />
          </View>
        )}

        {showTerminate && (
          <View style={styles.terminateSection}>
            <View style={[styles.alertBox, { marginBottom: 12 }]}>
              <Ionicons name="warning" size={20} color="#ef4444" />
              <Text style={[styles.alertText, { color: '#b91c1c' }]}>Sozlesme feshi geri alinamaz.</Text>
            </View>
            <TextInput
              style={styles.terminateInput}
              placeholder="Fesih sebebi..."
              value={terminateReason}
              onChangeText={setTerminateReason}
              multiline
              numberOfLines={3}
              placeholderTextColor={colors.gray[400]}
            />
            <View style={styles.terminateActions}>
              <Button title="Feshet" variant="danger" onPress={handleTerminate} loading={terminating} style={{ flex: 1 }} />
              <Button title="Iptal" variant="secondary" onPress={() => setShowTerminate(false)} style={{ flex: 1 }} />
            </View>
          </View>
        )}

        {/* Chat Button */}
        {isParty && (contract.status === 'ACTIVE' || contract.status === 'PENDING_SIGNATURES') && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.chatButton}
              activeOpacity={0.8}
              onPress={async () => {
                if (!tokens?.accessToken) return;
                try {
                  const res = await api<{ id: string }>(`/api/v1/chat/rooms/contract/${id}`, {
                    method: 'POST',
                    token: tokens.accessToken,
                  });
                  if (res.status === 'success' && res.data) {
                    const otherParty = isTenant ? contract.landlord.fullName : contract.tenant.fullName;
                    router.push({
                      pathname: '/chat/[roomId]',
                      params: { roomId: res.data.id, title: otherParty },
                    });
                  }
                } catch {
                  setError('Sohbet olusturulamadi');
                }
              }}
            >
              <View style={styles.chatIconWrap}>
                <Ionicons name="chatbubbles-outline" size={20} color="#2563eb" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.uploadTitle}>Mesaj Gonder</Text>
                <Text style={styles.uploadSubtitle}>
                  {isTenant ? 'Ev sahibi ile sohbet et' : 'Kiraci ile sohbet et'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.gray[400]} />
            </TouchableOpacity>
          </View>
        )}

        {/* Payment Schedule */}
        {payments.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Odeme Takvimi</Text>
            <View style={styles.sectionCard}>
              {payments.map((p, i) => {
                const ps = getStatusBadge(p.status);
                return (
                  <View key={p.id} style={[styles.payRow, i < payments.length - 1 && styles.payBorder]}>
                    <View style={styles.payTimeline}>
                      <View style={[styles.payDot, { backgroundColor: ps.variant === 'success' ? '#10b981' : ps.variant === 'danger' ? '#ef4444' : colors.gray[300] }]} />
                      {i < payments.length - 1 && <View style={styles.payLine} />}
                    </View>
                    <View style={styles.payInfo}>
                      <Text style={styles.payPeriod}>{p.periodLabel}</Text>
                      <Text style={styles.payDate}>{new Date(p.dueDate).toLocaleDateString('tr-TR')}</Text>
                    </View>
                    <View style={styles.payRight}>
                      <Text style={styles.payAmount}>{p.amount.toLocaleString('tr-TR')} TL</Text>
                      <Badge text={ps.text} variant={ps.variant} size="sm" />
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Fixed Sign Button */}
      {canSign && (
        <View style={[styles.fixedBottom, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={styles.signButton}
            onPress={handleSign}
            activeOpacity={0.8}
            disabled={signing}
          >
            <Ionicons name="checkmark-circle" size={22} color="#ffffff" />
            <Text style={styles.signButtonText}>
              {signing ? 'Imzalaniyor...' : 'Sozlesmeyi Imzala'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function InfoItem({ icon, label, value, mono, highlight }: { icon: string; label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon as any} size={16} color={highlight ? '#2563eb' : colors.gray[400]} style={{ marginBottom: 4 }} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && { fontFamily: 'monospace', fontSize: 11 }, highlight && { color: '#1d4ed8' }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f1f5f9' },
  container: { flex: 1 },
  content: { paddingBottom: 32 },

  // Dark Navy Header
  headerSection: {
    backgroundColor: DARK_NAVY,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 20,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  propTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  propAddr: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginLeft: 6,
    flex: 1,
    fontWeight: '500',
  },

  // Info Grid
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
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
  infoRow: { flexDirection: 'row', gap: 16 },
  infoDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray[100],
    marginVertical: 14,
  },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 12, color: colors.gray[400], fontWeight: '500', marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '600', color: colors.gray[800] },

  // Parties
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  partiesRow: { flexDirection: 'row', gap: 12, marginBottom: 20, paddingHorizontal: 20 },
  partyCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
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
  partyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  partyInitial: {
    fontSize: 20,
    fontWeight: '800',
  },
  partyRole: {
    fontSize: 11,
    color: colors.gray[400],
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  partyName: { fontSize: 14, fontWeight: '600', color: colors.gray[900], textAlign: 'center' },
  partyTckn: { fontSize: 12, color: colors.gray[500], marginTop: 2, fontFamily: 'monospace' },

  // Section Card
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    marginHorizontal: 20,
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

  // Contract Conditions
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  conditionBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray[100],
  },
  conditionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
  },
  conditionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[800],
  },
  conditionPill: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  conditionPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  docBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  docBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },

  // KMH
  kmhItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[100],
  },
  kmhItemSelected: { backgroundColor: '#eff6ff' },
  kmhItemDisabled: { opacity: 0.5 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.gray[300], justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: '#2563eb' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2563eb' },
  kmhNumber: { fontSize: 14, fontWeight: '600', fontFamily: 'monospace', color: colors.gray[800] },
  kmhLimit: { fontSize: 12, color: colors.gray[500], marginTop: 2 },
  kmhBound: { fontSize: 11, color: '#f59e0b', marginTop: 2 },
  kmhInsufficient: { fontSize: 11, color: '#ef4444', marginTop: 2 },

  // Signatures
  noSigText: { padding: 16, fontSize: 14, color: colors.gray[400], textAlign: 'center' },
  sigRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  sigBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.gray[100] },
  sigCheck: { marginRight: 12 },
  sigName: { fontSize: 15, fontWeight: '600', color: colors.gray[800] },
  sigMeta: { fontSize: 12, color: colors.gray[400], marginTop: 2 },

  // Alerts
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  alertText: { flex: 1, fontSize: 13, color: '#b91c1c', lineHeight: 18 },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  warningText: { flex: 1, fontSize: 13, color: '#d97706', lineHeight: 18 },

  // Actions
  actionButtons: {
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 20,
  },

  // Upload Button
  uploadButton: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  uploadIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[800],
  },
  uploadSubtitle: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 2,
  },

  // Chat Button
  chatButton: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  chatIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Fixed Sign Button
  fixedBottom: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.white,
    ...Platform.select({
      ios: {
        shadowColor: '#0a1628',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  signButton: {
    backgroundColor: '#10b981',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Terminate
  terminateSection: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    marginHorizontal: 20,
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
  terminateInput: {
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: colors.gray[800],
    textAlignVertical: 'top',
    marginBottom: 12,
    minHeight: 80,
    backgroundColor: colors.gray[50],
  },
  terminateActions: { flexDirection: 'row', gap: 10 },

  // Payment Timeline
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  payBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[100],
  },
  payTimeline: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  payDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  payLine: {
    width: 1,
    flex: 1,
    backgroundColor: colors.gray[200],
    position: 'absolute',
    top: 14,
    bottom: -14,
  },
  payInfo: { flex: 1 },
  payPeriod: { fontSize: 14, fontWeight: '600', color: colors.gray[800] },
  payDate: { fontSize: 12, color: colors.gray[400], marginTop: 2 },
  payRight: { alignItems: 'flex-end', gap: 6 },
  payAmount: { fontSize: 15, fontWeight: '700', color: colors.gray[900] },
});
