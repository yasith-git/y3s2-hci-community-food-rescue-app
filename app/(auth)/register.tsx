/**
 * Registration Screen
 * Minimal, accessible registration with instant validation and error handling
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassCard,
  GlassButton,
  GlassHeader,
  PrimaryTextInput,
  FirebaseUnconfiguredBanner,
} from '../../src/components/ui';
import { colors, typography, spacing } from '../../src/design-system';
import { useAuth } from '../../src/contexts/AuthContext';
import {
  validateFullName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
} from '../../src/utils/validation';
import { mapFirebaseAuthError } from '../../src/utils/authErrors';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, isConfigured } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    setGeneralError(null);
    const nameVal = validateFullName(fullName);
    const emailVal = validateEmail(email);
    const passVal = validatePassword(password);
    const confirmVal = validateConfirmPassword(password, confirmPassword);

    const newErrors: { [key: string]: string } = {};
    if (!nameVal.isValid) newErrors.fullName = nameVal.error!;
    if (!emailVal.isValid) newErrors.email = emailVal.error!;
    if (!passVal.isValid) newErrors.password = passVal.error!;
    if (!confirmVal.isValid) newErrors.confirmPassword = confirmVal.error!;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);
    try {
      await signUp(fullName, email, password);
      router.replace('/(auth)/verify-email');
    } catch (err: any) {
      setGeneralError(mapFirebaseAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable={true} testID="register-screen">
      <GlassHeader
        title="Create Account"
        onBack={() => router.back()}
      />

      <View style={styles.content}>
        {!isConfigured && <FirebaseUnconfiguredBanner />}

        <GlassCard variant="standard" style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={[typography.headingLarge, styles.title]}>Join Food Rescue</Text>
            <Text style={[typography.bodyMedium, styles.subtitle]}>
              Create your account to start donating, rescuing, or coordinating surplus food.
            </Text>
          </View>

          {generalError && (
            <View style={styles.generalErrorBox}>
              <Ionicons name="alert-circle" size={18} color={colors.status.error} />
              <Text style={[typography.bodySmall, styles.generalErrorText]}>
                {generalError}
              </Text>
            </View>
          )}

          <PrimaryTextInput
            label="Full Name"
            placeholder="e.g. Alex Morgan"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
            }}
            leftIcon="person-outline"
            error={errors.fullName}
            required
            autoCapitalize="words"
            autoComplete="name"
          />

          <PrimaryTextInput
            label="Email Address"
            placeholder="name@university.edu"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
            }}
            leftIcon="mail-outline"
            error={errors.email}
            required
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <PrimaryTextInput
            label="Password"
            placeholder="At least 8 characters"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
            }}
            leftIcon="lock-closed-outline"
            rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowPassword(!showPassword)}
            secureTextEntry={!showPassword}
            error={errors.password}
            helperText="Must be at least 8 characters."
            required
            autoCapitalize="none"
          />

          <PrimaryTextInput
            label="Confirm Password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
            }}
            leftIcon="lock-closed-outline"
            secureTextEntry={!showPassword}
            error={errors.confirmPassword}
            required
            autoCapitalize="none"
          />

          <GlassButton
            title="Create Account"
            variant="primary"
            size="large"
            icon="arrow-forward"
            iconPosition="right"
            loading={isLoading}
            onPress={handleRegister}
            style={styles.submitButton}
            fullWidth
          />

          <View style={styles.footerRow}>
            <Text style={[typography.bodySmall, styles.footerText]}>
              Already have an account?
            </Text>
            <GlassButton
              title="Sign In"
              variant="tertiary"
              size="small"
              onPress={() => router.push('/(auth)/login')}
            />
          </View>
        </GlassCard>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.xs,
  },
  card: {
    marginVertical: spacing.xs,
  },
  cardHeader: {
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.text.muted,
    lineHeight: 20,
  },
  generalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.errorBg,
    padding: spacing.md,
    borderRadius: spacing.sm,
    borderColor: colors.status.errorBorder,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  generalErrorText: {
    color: colors.status.error,
    flex: 1,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: 4,
  },
  footerText: {
    color: colors.text.muted,
  },
});
