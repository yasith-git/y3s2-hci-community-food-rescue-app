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
  SupabaseUnconfiguredBanner,
  GlassBadge,
} from '../../src/components/ui';
import { colors, typography, spacing, radius } from '../../src/design-system';
import { useAuth } from '../../src/contexts/AuthContext';
import { UserRole } from '../../src/types/auth';
import {
  validateFullName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
} from '../../src/utils/validation';
import { mapAuthError } from '../../src/utils/authErrors';

interface RoleOption {
  key: UserRole;
  title: string;
  badge: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  requiresOrg?: boolean;
}

const ROLES: RoleOption[] = [
  {
    key: 'DONOR',
    title: 'Food Donor',
    badge: 'Businesses & Individuals',
    description: 'Offer surplus food from restaurants, dining halls, bakeries, or stores.',
    icon: 'restaurant-outline',
  },
  {
    key: 'VOLUNTEER',
    title: 'Food Rescue Volunteer',
    badge: 'Couriers & Students',
    description: 'Pick up and deliver food along your regular commuting routes.',
    icon: 'bicycle-outline',
  },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, isConfigured } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('DONOR');
  const [organizationName, setOrganizationName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

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
    if (selectedRole === 'COORDINATOR' && !organizationName.trim()) {
      newErrors.organizationName = 'Please enter your organization or community center name.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);
    try {
      await signUp(
        fullName.trim(),
        email.trim(),
        password,
        selectedRole,
        {
          organizationName: organizationName.trim() || undefined,
          phoneNumber: phoneNumber.trim() || undefined,
        }
      );
      if (selectedRole === 'DONOR') {
        router.replace('/(donor)');
      } else if (selectedRole === 'VOLUNTEER') {
        router.replace('/(volunteer)');
      } else if (selectedRole === 'COORDINATOR') {
        router.replace('/(coordinator)');
      } else {
        router.replace({
          pathname: '/(auth)/verify-email',
          params: { email: email.trim().toLowerCase() },
        });
      }
    } catch (err: any) {
      setGeneralError(mapAuthError(err));
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
        {!isConfigured && <SupabaseUnconfiguredBanner />}

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

          {/* Role Chooser */}
          <View style={styles.roleSection}>
            <Text style={[typography.titleMedium, styles.roleSectionTitle]}>
              I want to participate as: <Text style={styles.requiredStar}>*</Text>
            </Text>

            <View style={styles.roleCardsGrid}>
              {ROLES.map((role) => {
                const isSelected = selectedRole === role.key;
                return (
                  <GlassCard
                    key={role.key}
                    variant={isSelected ? 'elevated' : 'interactive'}
                    onPress={() => {
                      setSelectedRole(role.key);
                      if (errors.organizationName) {
                        setErrors((prev) => ({ ...prev, organizationName: '' }));
                      }
                    }}
                    style={[
                      styles.roleOptionCard,
                      isSelected && styles.selectedRoleCard,
                    ]}
                  >
                    <View style={styles.roleCardHeader}>
                      <View
                        style={[
                          styles.roleIconCircle,
                          isSelected && styles.selectedRoleIconCircle,
                        ]}
                      >
                        <Ionicons
                          name={role.icon}
                          size={22}
                          color={isSelected ? colors.text.inverse : colors.brand.primary}
                        />
                      </View>

                      <View style={styles.roleHeaderTitles}>
                        <Text style={[typography.titleSmall, styles.roleOptionTitle]}>
                          {role.title}
                        </Text>
                        <GlassBadge
                          label={role.badge}
                          variant={role.requiresOrg ? 'warning' : 'brand'}
                          size="small"
                        />
                      </View>

                      <View
                        style={[
                          styles.radioOuter,
                          isSelected && styles.selectedRadioOuter,
                        ]}
                      >
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </View>

                    <Text style={[typography.bodySmall, styles.roleOptionDescription]}>
                      {role.description}
                    </Text>
                  </GlassCard>
                );
              })}
            </View>
          </View>

          {/* Organization Details for Coordinator Role */}
          {selectedRole === 'COORDINATOR' && (
            <View style={styles.extraOrgSection}>
              <PrimaryTextInput
                label="Organization / Pantry Name"
                placeholder="e.g. University Student Food Bank"
                value={organizationName}
                onChangeText={(text) => {
                  setOrganizationName(text);
                  if (errors.organizationName) {
                    setErrors((prev) => ({ ...prev, organizationName: '' }));
                  }
                }}
                leftIcon="business-outline"
                error={errors.organizationName}
                required
                autoCapitalize="words"
              />

              <PrimaryTextInput
                label="Contact Phone Number"
                placeholder="e.g. +1 555-0199"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                leftIcon="call-outline"
                keyboardType="phone-pad"
              />
            </View>
          )}

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
    borderRadius: radius.md,
    borderColor: colors.status.errorBorder,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  generalErrorText: {
    color: colors.status.error,
    flex: 1,
  },
  roleSection: {
    marginVertical: spacing.md,
  },
  roleSectionTitle: {
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  requiredStar: {
    color: colors.status.error,
  },
  roleCardsGrid: {
    gap: spacing.sm,
  },
  roleOptionCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  selectedRoleCard: {
    borderColor: colors.brand.primary,
    backgroundColor: 'rgba(46, 125, 50, 0.06)',
  },
  roleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 6,
  },
  roleIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRoleIconCircle: {
    backgroundColor: colors.brand.primary,
  },
  roleHeaderTitles: {
    flex: 1,
    gap: 2,
  },
  roleOptionTitle: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.surface.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioOuter: {
    borderColor: colors.brand.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand.primary,
  },
  roleOptionDescription: {
    color: colors.text.secondary,
    lineHeight: 18,
    paddingLeft: 46,
  },
  extraOrgSection: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surface.divider,
  },
  submitButton: {
    marginTop: spacing.lg,
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

