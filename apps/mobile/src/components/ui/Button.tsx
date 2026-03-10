import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';

type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.primary[600], text: colors.white },
  secondary: { bg: colors.gray[200], text: colors.gray[700] },
  danger: { bg: colors.red[600], text: colors.white },
  success: { bg: colors.green[600], text: colors.white },
  outline: { bg: 'transparent', text: colors.primary[600], border: colors.primary[600] },
  ghost: { bg: 'transparent', text: colors.primary[600] },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  size = 'md',
}: ButtonProps) {
  const v = variantStyles[variant];
  const isDisabled = disabled || loading;
  const paddingV = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;
  const paddingH = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 17 : 15;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          paddingVertical: paddingV,
          paddingHorizontal: paddingH,
          borderColor: v.border || 'transparent',
          borderWidth: v.border ? 1.5 : 0,
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <Text style={[styles.text, { color: v.text, fontSize }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
  },
});
