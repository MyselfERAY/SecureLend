import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Keyboard } from 'react-native';
import { colors } from '../theme/colors';

interface OtpInputProps {
  length?: number;
  onComplete: (code: string) => void;
  error?: boolean;
}

export function OtpInput({ length = 6, onComplete, error }: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const refs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (error) {
      setDigits(Array(length).fill(''));
      refs.current[0]?.focus();
    }
  }, [error]);

  const handleChange = (text: string, index: number) => {
    // Handle paste
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
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
    }
  };

  return (
    <View style={styles.container}>
      {digits.map((digit, i) => (
        <TextInput
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          style={[
            styles.box,
            digit ? styles.boxFilled : null,
            error ? styles.boxError : null,
          ]}
          value={digit}
          onChangeText={(text) => handleChange(text, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={i === 0 ? length : 1}
          selectTextOnFocus
          textContentType="oneTimeCode"
          autoComplete={i === 0 ? 'sms-otp' : 'off'}
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
    borderColor: colors.gray[300],
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.gray[900],
    backgroundColor: colors.white,
  },
  boxFilled: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  boxError: {
    borderColor: colors.red[500],
  },
});
