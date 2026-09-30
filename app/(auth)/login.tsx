/**
 * Login Screen
 * High-contrast, glassmorphic sign in screen with human-friendly error mapping
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
import { colors, typography, spacing, radius } from '../../src/design-system';
import { useAuth } from '../../src/contexts/AuthContext';
import { validateEmail, validatePassword } from '../../src/utils/validation';
import { mapFirebaseAuthError } from '../../src/utils/authErrors';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setGeneralError(null);
    const emailVal = validateEmail(email);
    const passVal = validatePassword(password);

    const newErrors: { [key: string]: string } = {};
    if (!emailVal.isValid) newErrors.email = emailVal.error!;
    if (!passVal.isValid) newErrors.password = passVal.error!;

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);
    try {
      await signIn(email, password);
      // Central auth state listener in _layout handles routing
    } catch (err: any) {
      setGeneralError(mapFirebaseAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable={true} testID="login-screen">
      <GlassHeader
        title="Sign In"
        onBack={() => router.back()}
      />

      <View style={styles.content}>
        {!isConfigured && <FirebaseUnconfiguredBanner />}

        <GlassCard variant="standard" style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.logoBadge}>
              <Ionicons name="leaf" size={24} color={colors.brand.primary} />
            </View>
            <Text style={[typography.headingLarge, styles.title]}>Welcome Back</Text>
            <Text style={[typography.bodyMedium, styles.subtitle]}>
              Sign in to continue making a difference in your community.
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
            placeholder="Your account password"
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
            required
            autoCapitalize="none"
          />

          <View style={styles.forgotPasswordRow}>
            <GlassButton
              title="Forgot Password?"
              variant="tertiary"
              size="small"
              onPress={() => router.push('/(auth)/forgot-password')}
            />
          </View>

          <GlassButton
            title="Sign In"
            variant="primary"
            size="large"
            icon="log-in-outline"
            loading={isLoading}
            onPress={handleLogin}
            style={styles.submitButton}
            fullWidth
          />

          <View style={styles.footerRow}>
            <Text style={[typography.bodySmall, styles.footerText]}>
              Don't have an account?
            </Text>
            <GlassButton
              title="Create Account"
              variant="tertiary"
              size="small"
              onPress={() => router.push('/(auth)/register')}
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
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
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
  forgotPasswordRow: {
    alignItems: 'flex-end',
    marginTop: -4,
    marginBottom: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.xs,
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
