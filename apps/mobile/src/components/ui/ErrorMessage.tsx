import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface Props {
  message: string;
  onDismiss?: () => void;
}

export function ErrorMessage({ message, onDismiss }: Props) {
  if (!message) return null;
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle" size={20} color={colors.red[600]} style={styles.icon} />
      <Text style={styles.text}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={18} color={colors.red[500]} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export function SuccessMessage({ message, onDismiss }: Props) {
  if (!message) return null;
  return (
    <View style={[styles.container, styles.successContainer]}>
      <Ionicons name="checkmark-circle" size={20} color={colors.green[600]} style={styles.icon} />
      <Text style={[styles.text, styles.successText]}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={18} color={colors.green[500]} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.red[50],
    borderWidth: 1,
    borderColor: colors.red[200],
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    marginRight: 10,
  },
  text: {
    flex: 1,
    fontSize: 14,
    color: colors.red[700],
    lineHeight: 20,
  },
  successContainer: {
    backgroundColor: colors.green[50],
    borderColor: colors.green[200],
  },
  successText: {
    color: colors.green[700],
  },
});
