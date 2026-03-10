import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  message: string;
  onDismiss?: () => void;
}

export function ErrorMessage({ message, onDismiss }: Props) {
  if (!message) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss}>
          <Text style={styles.dismiss}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function SuccessMessage({ message, onDismiss }: Props) {
  if (!message) return null;
  return (
    <View style={[styles.container, styles.successContainer]}>
      <Text style={[styles.text, styles.successText]}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss}>
          <Text style={[styles.dismiss, styles.successText]}>✕</Text>
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
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  text: {
    flex: 1,
    fontSize: 14,
    color: colors.red[700],
  },
  dismiss: {
    fontSize: 16,
    color: colors.red[500],
    paddingLeft: 8,
  },
  successContainer: {
    backgroundColor: colors.green[50],
    borderColor: colors.green[200],
  },
  successText: {
    color: colors.green[700],
  },
});
