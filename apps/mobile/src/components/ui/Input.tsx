import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  Animated,
} from 'react-native';
import { colors } from '../../theme/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  prefix?: string;
}

export function Input({ label, error, prefix, style, onFocus, onBlur, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (e: any) => {
    setIsFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onBlur?.(e);
  };

  const borderColor = error
    ? colors.red[500]
    : isFocused
    ? colors.primary[500]
    : colors.gray[200];

  const backgroundColor = error
    ? colors.red[50]
    : isFocused
    ? '#f0f5ff'
    : colors.white;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, isFocused && styles.labelFocused, error && styles.labelError]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            borderColor,
            backgroundColor,
          },
        ]}
      >
        {prefix && (
          <View style={styles.prefixBox}>
            <Text style={styles.prefixText}>{prefix}</Text>
          </View>
        )}
        <TextInput
          style={[styles.input, prefix ? styles.inputWithPrefix : null, style]}
          placeholderTextColor={colors.gray[400]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={colors.primary[500]}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[600],
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  labelFocused: {
    color: colors.primary[600],
  },
  labelError: {
    color: colors.red[500],
  },
  inputWrapper: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.gray[900],
    fontWeight: '500',
  },
  inputWithPrefix: {
    paddingLeft: 12,
  },
  prefixBox: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.gray[200],
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[600],
  },
  errorText: {
    fontSize: 12,
    color: colors.red[600],
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
});
