import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'gray';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: colors.green[100], text: colors.green[700] },
  warning: { bg: colors.yellow[100], text: colors.yellow[800] },
  danger: { bg: colors.red[100], text: colors.red[700] },
  info: { bg: colors.primary[100], text: colors.primary[700] },
  gray: { bg: colors.gray[100], text: colors.gray[600] },
};

export function Badge({ text, variant = 'gray' }: BadgeProps) {
  const v = variantColors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }]}>
      <Text style={[styles.text, { color: v.text }]}>{text}</Text>
    </View>
  );
}

export function getStatusBadge(status: string): { text: string; variant: BadgeVariant } {
  const map: Record<string, { text: string; variant: BadgeVariant }> = {
    ACTIVE: { text: 'Aktif', variant: 'success' },
    COMPLETED: { text: 'Tamamlandi', variant: 'success' },
    APPROVED: { text: 'Onaylandi', variant: 'success' },
    PENDING: { text: 'Bekliyor', variant: 'warning' },
    PENDING_SIGNATURES: { text: 'Imza Bekleniyor', variant: 'warning' },
    PROCESSING: { text: 'Isleniyor', variant: 'warning' },
    DRAFT: { text: 'Taslak', variant: 'gray' },
    INACTIVE: { text: 'Pasif', variant: 'gray' },
    REJECTED: { text: 'Reddedildi', variant: 'danger' },
    TERMINATED: { text: 'Feshedildi', variant: 'danger' },
    OVERDUE: { text: 'Gecikti', variant: 'danger' },
    FAILED: { text: 'Basarisiz', variant: 'danger' },
    EXPIRED: { text: 'Suresi Doldu', variant: 'gray' },
    RENTED: { text: 'Kirada', variant: 'info' },
  };
  return map[status] || { text: status, variant: 'gray' };
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
