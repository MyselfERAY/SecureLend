import React from 'react';
import { Modal as RNModal, View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { colors } from '../../theme/colors';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
  loading?: boolean;
}

const variantBg: Record<string, string> = {
  danger: colors.red[600],
  primary: colors.primary[600],
  success: colors.green[600],
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Onayla',
  cancelText = 'Vazgec',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  children,
  loading,
}: ConfirmModalProps) {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.content} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
          {children}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: variantBg[confirmVariant] }]}
              onPress={onConfirm}
              disabled={loading}
            >
              <Text style={styles.confirmText}>
                {loading ? 'Yukleniyor...' : confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 16,
    lineHeight: 21,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[600],
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
});
