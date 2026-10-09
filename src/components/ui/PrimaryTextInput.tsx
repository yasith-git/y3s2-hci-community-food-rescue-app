/**
 * PrimaryTextInput Component
 * Accessible, state-aware form text input with glass surface and animated states
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  TextInputProps,
  StyleProp,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassSurface } from './GlassSurface';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';

export interface PrimaryTextInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  required?: boolean;
  testID?: string;
}

export const PrimaryTextInput: React.FC<PrimaryTextInputProps> = ({
  label,
  helperText,
  error,
  success,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  required,
  value,
  editable = true,
  onFocus,
  onBlur,
  testID,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const hasError = !!error;
  const isFilled = value !== undefined && value !== null && value.length > 0;

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getBorderColor = (): string => {
    if (hasError) return colors.status.error;
    if (isFocused) return colors.brand.primary;
    if (success) return colors.status.success;
    return 'rgba(23, 61, 57, 0.12)';
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={[typography.labelMedium, styles.label]}>
            {label}
            {required && <Text style={styles.requiredAsterisk}> *</Text>}
          </Text>
        </View>
      )}

      <GlassSurface
        variant="subtle"
        style={[
          styles.surface,
          {
            borderColor: getBorderColor(),
            borderWidth: isFocused || hasError ? 1.5 : 1,
            backgroundColor: !editable
              ? 'rgba(247, 248, 245, 0.85)'
              : isFocused
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(255, 255, 255, 0.78)',
          },
        ]}
      >
        <View style={styles.inputRow}>
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={20}
              color={
                hasError
                  ? colors.status.error
                  : isFocused
                  ? colors.brand.primary
                  : colors.text.muted
              }
              style={styles.leftIcon}
            />
          )}

          <TextInput
            testID={testID}
            value={value}
            editable={editable}
            placeholderTextColor={colors.text.disabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={[
              typography.bodyLarge,
              styles.input,
              !editable && styles.disabledInput,
              inputStyle,
            ]}
            accessibilityLabel={label || rest.placeholder}
            accessibilityState={{
              disabled: !editable,
            }}
            {...rest}
          />

          {hasError ? (
            <Ionicons
              name="alert-circle"
              size={20}
              color={colors.status.error}
              style={styles.rightIcon}
            />
          ) : success ? (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.status.success}
              style={styles.rightIcon}
            />
          ) : rightIcon ? (
            <Ionicons
              name={rightIcon}
              size={20}
              color={isFocused ? colors.brand.primary : colors.text.muted}
              style={styles.rightIcon}
              onPress={onRightIconPress}
            />
          ) : null}
        </View>
      </GlassSurface>

      {/* Helper text / Error text */}
      {hasError ? (
        <View style={styles.feedbackRow}>
          <Ionicons name="information-circle" size={14} color={colors.status.error} />
          <Text style={[typography.caption, styles.errorText]}>{error}</Text>
        </View>
      ) : helperText ? (
        <Text style={[typography.caption, styles.helperText]}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    width: '100%',
  },
  labelRow: {
    marginBottom: spacing.xs + 2,
  },
  label: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  requiredAsterisk: {
    color: colors.status.error,
  },
  surface: {
    borderRadius: radius.lg,
    minHeight: 52,
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    minHeight: 46,
  },
  disabledInput: {
    color: colors.text.disabled,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 2,
    gap: 4,
  },
  errorText: {
    color: colors.status.error,
  },
  helperText: {
    color: colors.text.muted,
    marginTop: 4,
    marginLeft: 2,
  },
});
