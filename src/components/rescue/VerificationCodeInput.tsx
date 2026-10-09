/**
 * VerificationCodeInput Component
 * Accessible, styled 4-digit code entry with auto-focus and tactile haptics.
 */

import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { GlassSurface } from '../ui/GlassSurface';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { radius } from '../../design-system/radius';
import { spacing } from '../../design-system/spacing';
import { haptic } from '../../design-system/haptics';

interface VerificationCodeInputProps {
  length?: number;
  value: string;
  onChange: (code: string) => void;
  error?: string | null;
  disabled?: boolean;
}

export function VerificationCodeInput({
  length = 4,
  value,
  onChange,
  error,
  disabled = false,
}: VerificationCodeInputProps) {
  const inputRef = useRef<TextInput>(null);

  const handleDigitChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, length);
    haptic.selection();
    onChange(cleaned);
  };

  const handlePress = () => {
    if (disabled) return;
    inputRef.current?.focus();
  };

  const digits = value.split('');

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      style={styles.container}
    >
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleDigitChange}
        keyboardType="number-pad"
        maxLength={length}
        style={styles.hiddenInput}
        editable={!disabled}
        caretHidden
      />

      <View style={styles.digitRow}>
        {Array.from({ length }).map((_, index) => {
          const digit = digits[index] || '';
          const isCurrent = index === digits.length && !disabled;
          const isFilled = digit.length > 0;

          return (
            <GlassSurface
              key={index}
              variant="subtle"
              style={[
                styles.digitBox,
                isCurrent && styles.digitBoxCurrent,
                isFilled && styles.digitBoxFilled,
                error ? styles.digitBoxError : null,
              ]}
            >
              <Text style={[typography.headingMedium, styles.digitText]}>
                {digit}
              </Text>
            </GlassSurface>
          );
        })}
      </View>

      {error && (
        <Text style={[typography.caption, styles.errorText]}>{error}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  digitRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  digitBox: {
    width: 60,
    height: 64,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.surface.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  digitBoxCurrent: {
    borderColor: colors.brand.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  digitBoxFilled: {
    borderColor: colors.brand.primary,
  },
  digitBoxError: {
    borderColor: colors.status.error,
  },
  digitText: {
    color: colors.text.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorText: {
    color: colors.status.error,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
