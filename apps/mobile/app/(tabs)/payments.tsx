import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, Platform,
  Image, ActionSheetIOS, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/lib/auth-context';
import { api, extractError } from '../../src/lib/api';
import { getProfilePhoto, setProfilePhoto, clearProfilePhoto } from '../../src/lib/storage';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Badge } from '../../src/components/ui/Badge';
import { ErrorMessage } from '../../src/components/ui/ErrorMessage';
import { SuccessMessage } from '../../src/components/ui/ErrorMessage';
import { colors } from '../../src/theme/colors';

const DARK_NAVY = '#0a1628';

export default function ProfileScreen() {
  const { user, tokens, refreshUser, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [addingRole, setAddingRole] = useState(false);
  const [roleMsg, setRoleMsg] = useState('');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email || '');
    }
    // Load saved profile photo
    getProfilePhoto().then((uri) => {
      if (uri) setProfilePhotoUri(uri);
    });
  }, [user]);

  const pickImage = async (source: 'camera' | 'library') => {
    let result: ImagePicker.ImagePickerResult;

    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Izin Gerekli', 'Kamera izni verilmedi.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Izin Gerekli', 'Galeri izni verilmedi.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
    }

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setProfilePhotoUri(uri);
      await setProfilePhoto(uri);
    }
  };

  const handlePhotoPress = () => {
    if (Platform.OS === 'ios') {
      const options = profilePhotoUri
        ? ['Kamera', 'Galeriden Sec', 'Fotografi Kaldir', 'Iptal']
        : ['Kamera', 'Galeriden Sec', 'Iptal'];
      const cancelIndex = options.length - 1;
      const destructiveIndex = profilePhotoUri ? 2 : undefined;

      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex, destructiveButtonIndex: destructiveIndex },
        async (buttonIndex) => {
          if (buttonIndex === 0) pickImage('camera');
          else if (buttonIndex === 1) pickImage('library');
          else if (buttonIndex === 2 && profilePhotoUri) {
            setProfilePhotoUri(null);
            await clearProfilePhoto();
          }
        },
      );
    } else {
      Alert.alert(
        'Profil Fotografi',
        'Kaynak secin',
        [
          { text: 'Kamera', onPress: () => pickImage('camera') },
          { text: 'Galeriden Sec', onPress: () => pickImage('library') },
          ...(profilePhotoUri
            ? [{ text: 'Fotografi Kaldir', style: 'destructive' as const, onPress: async () => {
                setProfilePhotoUri(null);
                await clearProfilePhoto();
              }}]
            : []),
          { text: 'Iptal', style: 'cancel' as const },
        ],
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  };

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
      setSaveMsg('Profil guncellendi!');
    } else { setError(extractError(res)); }
    setSaving(false);
  };

  const handleAddRole = async (role: string) => {
    if (!tokens) return;
    setAddingRole(true); setRoleMsg('');
    const res = await api('/api/v1/users/me/roles', { method: 'POST', body: { role }, token: tokens.accessToken });
    if (res.status === 'success') {
      await refreshUser();
      setRoleMsg(`${role === 'TENANT' ? 'Kiraci' : 'Ev Sahibi'} rolu eklendi!`);
    } else { setRoleMsg(extractError(res)); }
    setAddingRole(false);
  };

  const roleLabels: Record<string, string> = { TENANT: 'Kiraci', LANDLORD: 'Ev Sahibi', ADMIN: 'Yonetici' };
  const roleIcons: Record<string, string> = { TENANT: 'person', LANDLORD: 'home', ADMIN: 'shield-checkmark' };
  const roleColors: Record<string, string> = { TENANT: '#2563eb', LANDLORD: '#10b981', ADMIN: '#f59e0b' };
  const roleBgs: Record<string, string> = { TENANT: '#eff6ff', LANDLORD: '#ecfdf5', ADMIN: '#fffbeb' };
  const hasTenant = user?.roles.includes('TENANT');
  const hasLandlord = user?.roles.includes('LANDLORD');

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n.charAt(0)).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />}
      showsVerticalScrollIndicator={false}
    >
      {/* Dark Navy Header */}
      <View style={[styles.headerSection, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={handlePhotoPress} activeOpacity={0.8} style={styles.avatarTouchable}>
          {profilePhotoUri ? (
            <Image source={{ uri: profilePhotoUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={12} color="#ffffff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.userName}>{user?.fullName}</Text>
        <Text style={styles.userPhone}>+90 {user?.phone}</Text>
        <View style={styles.rolesRow}>
          {user?.roles.map((r) => (
            <View key={r} style={styles.roleBadge}>
              <Ionicons name={roleIcons[r] as any || 'person'} size={12} color="#ffffff" />
              <Text style={styles.roleBadgeText}>{roleLabels[r] || r}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bodyContent}>
        {error ? <ErrorMessage message={error} onDismiss={() => setError('')} /> : null}
        {saveMsg ? <SuccessMessage message={saveMsg} onDismiss={() => setSaveMsg('')} /> : null}

        {/* Account Info Section */}
        <Text style={styles.sectionLabel}>Hesap Bilgileri</Text>
        <View style={styles.sectionCard}>
          {editing ? (
            <View style={{ padding: 20 }}>
              <Input label="Ad Soyad" value={fullName} onChangeText={setFullName} />
              <Input label="E-posta" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <View style={styles.editActions}>
                <Button title="Kaydet" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
                <Button
                  title="Iptal"
                  variant="secondary"
                  onPress={() => { setEditing(false); setFullName(user?.fullName || ''); setEmail(user?.email || ''); }}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ) : (
            <>
              <SettingsRow icon="person-outline" label="Ad Soyad" value={user?.fullName || ''} />
              <SettingsRow icon="call-outline" label="Telefon" value={`+90 ${user?.phone || ''}`} />
              <SettingsRow icon="id-card-outline" label="TCKN" value={user?.maskedTckn || ''} />
              <SettingsRow icon="calendar-outline" label="Dogum Tarihi" value={user?.dateOfBirth ? user.dateOfBirth.split('-').reverse().join('.') : '-'} />
              <SettingsRow icon="mail-outline" label="E-posta" value={user?.email || '-'} last />
              <TouchableOpacity style={styles.editButton} onPress={() => router.push('/profile/edit')} activeOpacity={0.7}>
                <Ionicons name="create-outline" size={16} color="#2563eb" />
                <Text style={styles.editButtonText}>Duzenle</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Roles Section */}
        <Text style={styles.sectionLabel}>Roller</Text>
        <View style={styles.sectionCard}>
          {roleMsg ? (
            <View style={{ padding: 20, paddingBottom: 0 }}>
              <SuccessMessage message={roleMsg} onDismiss={() => setRoleMsg('')} />
            </View>
          ) : null}
          {user?.roles.map((r, i) => (
            <View key={r} style={[styles.roleItem, i < (user?.roles.length || 0) - 1 && styles.roleItemBorder]}>
              <View style={[styles.roleIconWrap, { backgroundColor: roleBgs[r] || '#eff6ff' }]}>
                <Ionicons name={roleIcons[r] as any || 'person'} size={18} color={roleColors[r] || '#2563eb'} />
              </View>
              <Text style={styles.roleItemText}>{roleLabels[r] || r}</Text>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            </View>
          ))}
          {(!hasTenant || !hasLandlord) && (
            <View style={styles.addRolesRow}>
              {!hasTenant && (
                <Button title="+ Kiraci" variant="outline" size="sm" onPress={() => handleAddRole('TENANT')} loading={addingRole} style={{ flex: 1 }} />
              )}
              {!hasLandlord && (
                <Button title="+ Ev Sahibi" variant="outline" size="sm" onPress={() => handleAddRole('LANDLORD')} loading={addingRole} style={{ flex: 1 }} />
              )}
            </View>
          )}
        </View>

        {/* Security Section */}
        <Text style={styles.sectionLabel}>Guvenlik</Text>
        <View style={styles.sectionCard}>
          <View style={styles.kycRow}>
            <View style={styles.kycLeft}>
              <View style={[styles.kycIcon, {
                backgroundColor: user?.kycStatus === 'COMPLETED' ? '#ecfdf5' : '#fffbeb',
              }]}>
                <Ionicons
                  name={user?.kycStatus === 'COMPLETED' ? 'shield-checkmark' : 'shield-outline'}
                  size={20}
                  color={user?.kycStatus === 'COMPLETED' ? '#10b981' : '#f59e0b'}
                />
              </View>
              <View>
                <Text style={styles.kycLabel}>KYC Durumu</Text>
                <Text style={styles.kycValue}>
                  {user?.kycStatus === 'COMPLETED' ? 'Dogrulandi' : user?.kycStatus === 'REJECTED' ? 'Reddedildi' : 'Bekliyor'}
                </Text>
              </View>
            </View>
            <Badge
              text={user?.kycStatus === 'COMPLETED' ? 'Dogrulandi' : user?.kycStatus === 'REJECTED' ? 'Reddedildi' : 'Bekliyor'}
              variant={user?.kycStatus === 'COMPLETED' ? 'success' : user?.kycStatus === 'REJECTED' ? 'danger' : 'warning'}
            />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Cikis Yap</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </View>
    </ScrollView>
  );
}

function SettingsRow({ icon, label, value, last }: { icon: string; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.settingsRow, !last && styles.settingsRowBorder]}>
      <View style={styles.settingsRowLeft}>
        <View style={styles.settingsIconWrap}>
          <Ionicons name={icon as any} size={18} color={colors.gray[500]} />
        </View>
        <Text style={styles.settingsLabel}>{label}</Text>
      </View>
      <Text style={styles.settingsValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: {},

  // Dark Navy Header
  headerSection: {
    backgroundColor: DARK_NAVY,
    alignItems: 'center',
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 24,
  },
  avatarTouchable: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: DARK_NAVY,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 14,
    fontWeight: '500',
  },
  rolesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Body
  bodyContent: {
    paddingHorizontal: 20,
  },

  // Section
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
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

  // Settings Rows
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 52,
  },
  settingsRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[100],
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingsLabel: {
    fontSize: 15,
    color: colors.gray[500],
    fontWeight: '500',
  },
  settingsValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[800],
    maxWidth: '50%',
    textAlign: 'right',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray[100],
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563eb',
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },

  // Roles
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 52,
  },
  roleItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[100],
  },
  roleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roleItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.gray[800],
  },
  addRolesRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray[100],
  },

  // KYC
  kycRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  kycLeft: { flexDirection: 'row', alignItems: 'center' },
  kycIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  kycLabel: { fontSize: 12, color: colors.gray[400], fontWeight: '500' },
  kycValue: { fontSize: 15, fontWeight: '600', color: colors.gray[800], marginTop: 2 },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
  },
});
