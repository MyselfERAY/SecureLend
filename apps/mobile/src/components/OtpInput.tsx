import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, TextInput, StyleSheet, Keyboard, Platform } from 'react-native';
import { colors } from '../theme/colors';

interface OtpInputProps {
  length?: number;
  onComplete: (code: string) => void;
  error?: boolean;
}

export function OtpInput({ length = 6, onComplete, error }: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const refs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (error) {
      setDigits(Array(length).fill(''));
      setTimeout(() => {
        refs.current[0]?.focus();
      }, 100);
    }
  }, [error, length]);

  // Auto-focus first box on mount
  useEffect(() => {
    setTimeout(() => {
      refs.current[0]?.focus();
    }, 300);
  }, []);

  const handleChange = useCallback((text: string, index: number) => {
    // Handle paste of full code
    if (text.length > 1) {
      const pasted = text.replace(/\D/g, '').slice(0, length);
      if (pasted.length === length) {
        const newDigits = pasted.split('');
        setDigits(newDigits);
        Keyboard.dismiss();
        onComplete(newDigits.join(''));
        return;
      }
    }

    const digit = text.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus();
    }

    const code = newDigits.join('');
    if (code.length === length && !newDigits.includes('')) {
      Keyboard.dismiss();
      onComplete(code);
    }
  }, [digits, length, onComplete]);

  const handleKeyPress = useCallback((e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
    }
  }, [digits]);

  return (
    <View style={styles.container}>
      {digits.map((digit, i) => (
        <TextInput
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          style={[
            styles.box,
            digit ? styles.boxFilled : null,
            focusedIndex === i && !error ? styles.boxFocused : null,
            error ? styles.boxError : null,
          ]}
          value={digit}
          onChangeText={(text) => handleChange(text, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          onFocus={() => setFocusedIndex(i)}
          keyboardType="number-pad"
          maxLength={i === 0 ? length : 1}
          selectTextOnFocus
          textContentType="oneTimeCode"
          autoComplete={i === 0 ? 'sms-otp' : 'off'}
          caretHidden
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  box: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.brand.dark,
    backgroundColor: colors.white,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  boxFilled: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  boxFocused: {
    borderColor: colors.primary[600],
    backgroundColor: '#f0f5ff',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary[600],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  boxError: {
    borderColor: colors.red[500],
    backgroundColor: colors.red[50],
  },
});
