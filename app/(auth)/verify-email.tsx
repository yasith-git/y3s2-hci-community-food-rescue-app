/**
 * Email Verification Screen
 * Verification gate with cooldown timer, refresh button, and account switch action
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassCard,
  GlassButton,
  GlassHeader,
  PrimaryTextInput,
} from '../../src/components/ui';
import { colors, typography, spacing, radius } from '../../src/design-system';
import { useAuth } from '../../src/contexts/AuthContext';
import { mapAuthError } from '../../src/utils/authErrors';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { user, profile, verifyEmailOtp, sendVerificationEmail, signOut } = useAuth();

  const registeredEmail = params.email || user?.email || '';

  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(45);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerifyOtp = async () => {
    setError(null);
    setFeedback(null);

    const cleanToken = otpCode.trim();
    if (!cleanToken) {
      setError('Please enter the verification code sent to your email.');
      return;
    }

    if (!registeredEmail) {
      setError('Missing registered email. Please return to login.');
      return;
    }

    setIsVerifying(true);
    try {
      await verifyEmailOtp(registeredEmail, cleanToken);
      setFeedback('Email verified successfully!');
      setTimeout(() => {
        const targetRole = profile?.role || user?.user_metadata?.role;
        if (targetRole === 'DONOR') {
          router.replace('/(donor)');
        } else if (targetRole === 'VOLUNTEER') {
          router.replace('/(volunteer)');
        } else if (targetRole === 'COORDINATOR') {
          router.replace('/(coordinator)');
        } else {
          router.replace('/(auth)/login');
        }
      }, 600);
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || !registeredEmail) return;
    setError(null);
    setIsResending(true);
    try {
      await sendVerificationEmail(registeredEmail);
      setFeedback('A new verification code was sent to your email.');
      setCooldown(45);
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = async () => {
    try {
      await signOut();
    } catch {}
    router.replace('/(auth)/login');
  };

  return (
    <ScreenContainer scrollable={true} testID="verify-email-screen">
      <GlassHeader title="Verify Email" onBack={handleBackToLogin} />

      <View style={styles.content}>
        <GlassCard variant="elevated" style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark-outline" size={44} color={colors.brand.primary} />
          </View>

          <Text style={[typography.headingLarge, styles.title]}>
            Enter Verification Code
          </Text>

          <Text style={[typography.bodyMedium, styles.subtitle]}>
            We sent a verification code to:
          </Text>

          {registeredEmail ? (
            <View style={styles.emailBadge}>
              <Text style={[typography.titleSmall, styles.emailText]}>
                {registeredEmail}
              </Text>
            </View>
          ) : null}

          <Text style={[typography.bodySmall, styles.instructions]}>
            Please enter the code from your confirmation email to activate your account.
          </Text>

          {feedback && (
            <View style={styles.feedbackBox}>
              <Ionicons name="checkmark-circle" size={18} color={colors.status.success} />
              <Text style={[typography.bodySmall, styles.feedbackText]}>
                {feedback}
              </Text>
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={colors.status.error} />
              <Text style={[typography.bodySmall, styles.errorText]}>
                {error}
              </Text>
            </View>
          )}

          <View style={styles.otpInputContainer}>
            <PrimaryTextInput
              label="Verification Code"
              placeholder="e.g. 123456"
              value={otpCode}
              onChangeText={(text) => {
                setOtpCode(text);
                if (error) setError(null);
              }}
              keyboardType="number-pad"
              maxLength={12}
              autoFocus
              leftIcon="key-outline"
              inputStyle={styles.otpInput}
            />
          </View>

          <View style={styles.actionColumn}>
            <GlassButton
              title="Verify Email"
              variant="primary"
              size="large"
              icon="checkmark-done"
              loading={isVerifying}
              onPress={handleVerifyOtp}
              fullWidth
            />

            <GlassButton
              title={cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Verification Code'}
              variant="secondary"
              size="medium"
              icon="send-outline"
              loading={isResending}
              disabled={cooldown > 0}
              onPress={handleResendOtp}
              style={styles.resendButton}
              fullWidth
            />

            <GlassButton
              title="Back to Sign In"
              variant="tertiary"
              size="small"
              onPress={handleBackToLogin}
              style={styles.switchButton}
            />
          </View>
        </GlassCard>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.sm,
  },
  card: {
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: radius.round,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.text.muted,
    textAlign: 'center',
  },
  emailBadge: {
    backgroundColor: 'rgba(35, 132, 113, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    marginVertical: spacing.xs,
  },
  emailText: {
    color: colors.brand[900],
    fontWeight: '600',
  },
  instructions: {
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.sm,
    maxWidth: 300,
  },
  otpInputContainer: {
    width: '100%',
    marginVertical: spacing.xs,
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 4,
    fontSize: 20,
    fontWeight: 'bold',
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.successBg,
    padding: spacing.md,
    borderRadius: radius.md,
    borderColor: colors.status.successBorder,
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: spacing.xs,
    width: '100%',
  },
  feedbackText: {
    color: colors.status.success,
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.errorBg,
    padding: spacing.md,
    borderRadius: radius.md,
    borderColor: colors.status.errorBorder,
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: spacing.xs,
    width: '100%',
  },
  errorText: {
    color: colors.status.error,
    flex: 1,
  },
  actionColumn: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  resendButton: {
    marginTop: 2,
  },
  switchButton: {
    marginTop: spacing.xs,
  },
});

