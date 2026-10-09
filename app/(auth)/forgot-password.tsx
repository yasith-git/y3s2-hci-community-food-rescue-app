/**
 * Forgot Password Screen
 * Clean recovery request form with neutral security-conscious confirmation
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
  SuccessState,
} from '../../src/components/ui';
import { colors, typography, spacing } from '../../src/design-system';
import { useAuth } from '../../src/contexts/AuthContext';
import { validateEmail } from '../../src/utils/validation';
import { mapAuthError } from '../../src/utils/authErrors';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { sendPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleReset = async () => {
    setGeneralError(null);
    const emailVal = validateEmail(email);
    if (!emailVal.isValid) {
      setError(emailVal.error!);
      return;
    }
    setError(null);

    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      setIsSubmitted(true);
    } catch (err: any) {
      // For security, even on error we can show confirmation or mapped message
      setGeneralError(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <ScreenContainer scrollable={true} testID="forgot-password-success">
        <GlassHeader title="Reset Password" onBack={() => router.back()} />
        <View style={styles.content}>
          <SuccessState
            title="Check Your Inbox"
            description={`If an account exists for ${email}, password reset instructions have been sent.`}
            primaryActionTitle="Back to Sign In"
            onPrimaryAction={() => router.push('/(auth)/login')}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={true} testID="forgot-password-screen">
      <GlassHeader
        title="Reset Password"
        onBack={() => router.back()}
      />

      <View style={styles.content}>
        <GlassCard variant="standard" style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={[typography.headingLarge, styles.title]}>Forgot Password?</Text>
            <Text style={[typography.bodyMedium, styles.subtitle]}>
              Enter your registered email address and we'll send you instructions to reset your password.
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
            label="Email Address"
            placeholder="name@university.edu"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError(null);
            }}
            leftIcon="mail-outline"
            error={error || undefined}
            required
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <GlassButton
            title="Send Reset Instructions"
            variant="primary"
            size="large"
            icon="mail-unread-outline"
            loading={isLoading}
            onPress={handleReset}
            style={styles.submitButton}
            fullWidth
          />

          <View style={styles.footerRow}>
            <GlassButton
              title="Return to Sign In"
              variant="tertiary"
              size="medium"
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
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
});
