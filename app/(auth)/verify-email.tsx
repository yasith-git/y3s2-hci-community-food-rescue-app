/**
 * Email Verification Screen
 * Verification gate with cooldown timer, refresh button, and account switch action
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassCard,
  GlassButton,
  GlassHeader,
} from '../../src/components/ui';
import { colors, typography, spacing, radius } from '../../src/design-system';
import { useAuth } from '../../src/contexts/AuthContext';
import { mapFirebaseAuthError } from '../../src/utils/authErrors';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { user, checkEmailVerified, sendVerificationEmail, signOut } = useAuth();

  const [isChecking, setIsChecking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleCheckVerification = async () => {
    setError(null);
    setFeedback(null);
    setIsChecking(true);
    try {
      const isVerified = await checkEmailVerified();
      if (isVerified) {
        setFeedback('Email successfully verified! Proceeding...');
        // Routing handled by central auth listener
      } else {
        setError("Email is not verified yet. Please click the link in your inbox, then press 'I've Verified My Email'.");
      }
    } catch (err: any) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setIsChecking(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(null);
    setIsSending(true);
    try {
      await sendVerificationEmail();
      setFeedback('Verification link resent to your email.');
      setCooldown(45);
    } catch (err: any) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setIsSending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <ScreenContainer scrollable={true} testID="verify-email-screen">
      <GlassHeader title="Verify Email" />

      <View style={styles.content}>
        <GlassCard variant="elevated" style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-open-outline" size={48} color={colors.brand.primary} />
          </View>

          <Text style={[typography.headingLarge, styles.title]}>
            Verify Your Email
          </Text>

          <Text style={[typography.bodyMedium, styles.subtitle]}>
            We sent a verification link to:
          </Text>

          <View style={styles.emailBadge}>
            <Text style={[typography.titleSmall, styles.emailText]}>
              {user?.email || 'your registered email'}
            </Text>
          </View>

          <Text style={[typography.bodySmall, styles.instructions]}>
            Please tap the verification link in your inbox, then return here and confirm.
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

          <View style={styles.actionColumn}>
            <GlassButton
              title="I've Verified My Email"
              variant="primary"
              size="large"
              icon="checkmark-done"
              loading={isChecking}
              onPress={handleCheckVerification}
              fullWidth
            />

            <GlassButton
              title={cooldown > 0 ? `Resend Email (${cooldown}s)` : 'Resend Verification Email'}
              variant="secondary"
              size="medium"
              icon="send-outline"
              loading={isSending}
              disabled={cooldown > 0}
              onPress={handleResend}
              style={styles.resendButton}
              fullWidth
            />

            <GlassButton
              title="Sign Out / Use Another Account"
              variant="tertiary"
              size="small"
              onPress={handleSignOut}
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
    paddingVertical: spacing.md,
  },
  card: {
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: radius.round,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
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
    marginVertical: spacing.sm,
  },
  emailText: {
    color: colors.brand[900],
  },
  instructions: {
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
    maxWidth: 290,
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.successBg,
    padding: spacing.md,
    borderRadius: radius.md,
    borderColor: colors.status.successBorder,
    borderWidth: 1,
    marginBottom: spacing.md,
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
    marginBottom: spacing.md,
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
