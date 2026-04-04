import React, { useCallback } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../../theme/colors';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';

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

const variantConfig: Record<Variant, { bg: string; text: string; border?: string; pressedBg: string }> = {
  primary: {
    bg: colors.primary[600],
    text: colors.white,
    pressedBg: colors.primary[700],
  },
  secondary: {
    bg: colors.gray[100],
    text: colors.gray[700],
    pressedBg: colors.gray[200],
  },
  outline: {
    bg: 'transparent',
    text: colors.primary[600],
    border: colors.primary[200],
    pressedBg: colors.primary[50],
  },
  danger: {
    bg: colors.red[600],
    text: colors.white,
    pressedBg: colors.red[700],
  },
  success: {
    bg: colors.green[600],
    text: colors.white,
    pressedBg: colors.green[700],
  },
  ghost: {
    bg: 'transparent',
    text: colors.primary[600],
    pressedBg: colors.primary[50],
  },
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
  const config = variantConfig[variant];
  const isDisabled = disabled || loading;

  const height = size === 'sm' ? 40 : size === 'lg' ? 56 : 50;
  const fontSize = size === 'sm' ? 14 : size === 'lg' ? 17 : 16;
  const radius = size === 'sm' ? 10 : 14;

  const triggerHaptics = useCallback(() => {
    try {
      const Haptics = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // expo-haptics not installed, skip
    }
  }, []);

  const handlePress = useCallback(() => {
    triggerHaptics();
    onPress();
  }, [onPress, triggerHaptics]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          borderRadius: radius,
          backgroundColor: pressed ? config.pressedBg : config.bg,
          borderColor: config.border || 'transparent',
          borderWidth: config.border ? 1.5 : 0,
          opacity: isDisabled ? 0.5 : pressed ? 0.9 : 1,
        },
        variant === 'primary' && styles.primaryShadow,
        variant === 'success' && styles.successShadow,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={config.text} size="small" />
      ) : (
        <Text style={[styles.text, { color: config.text, fontSize }, textStyle]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 24,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  primaryShadow: {
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  successShadow: {
    shadowColor: colors.green[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
