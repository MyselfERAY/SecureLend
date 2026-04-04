import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'small' | 'large';
  inline?: boolean;
}

export function LoadingSpinner({ text = 'Yukleniyor...', size = 'large', inline }: LoadingSpinnerProps) {
  if (inline) {
    return (
      <View style={styles.inlineContainer}>
        <ActivityIndicator size={size} color={colors.primary[600]} />
        {text && <Text style={styles.inlineText}>{text}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.primary[600]} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.gray[50],
  },
  text: {
    marginTop: 16,
    fontSize: 15,
    color: colors.gray[500],
    fontWeight: '500',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  inlineText: {
    marginLeft: 12,
    fontSize: 14,
    color: colors.gray[500],
    fontWeight: '500',
  },
});
