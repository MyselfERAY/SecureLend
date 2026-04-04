import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'gray';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  dot?: boolean;
  size?: 'sm' | 'md';
}

const variantColors: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  success: { bg: '#ecfdf5', text: '#059669', dot: '#10b981' },
  warning: { bg: '#fffbeb', text: '#d97706', dot: '#f59e0b' },
  danger: { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' },
  info: { bg: '#eff6ff', text: '#2563eb', dot: '#3b82f6' },
  gray: { bg: colors.gray[100], text: colors.gray[600], dot: colors.gray[400] },
};

export function Badge({ text, variant = 'gray', dot = true, size = 'md' }: BadgeProps) {
  const v = variantColors[variant];
  const isSmall = size === 'sm';
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }, isSmall && styles.badgeSm]}>
      {dot && <View style={[styles.dot, { backgroundColor: v.dot }]} />}
      <Text style={[styles.text, { color: v.text }, isSmall && styles.textSm]}>{text}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 13,
    alignSelf: 'flex-start',
    height: 26,
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    height: 22,
    borderRadius: 11,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  textSm: {
    fontSize: 11,
  },
});
