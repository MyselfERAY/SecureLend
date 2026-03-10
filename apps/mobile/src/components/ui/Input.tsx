import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors } from '../../theme/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  prefix?: string;
}

export function Input({ label, error, prefix, style, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        {prefix && (
          <View style={styles.prefixBox}>
            <Text style={styles.prefixText}>{prefix}</Text>
          </View>
        )}
        <TextInput
          style={[styles.input, prefix ? styles.inputWithPrefix : null, style]}
          placeholderTextColor={colors.gray[400]}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 10,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  inputError: {
    borderColor: colors.red[500],
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.gray[900],
  },
  inputWithPrefix: {
    paddingLeft: 8,
  },
  prefixBox: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.gray[300],
  },
  prefixText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.gray[500],
  },
  errorText: {
    fontSize: 12,
    color: colors.red[600],
    marginTop: 4,
  },
});
