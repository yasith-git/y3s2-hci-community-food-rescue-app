/**
 * Role Selection Screen
 * Interactive role chooser assigning DONOR, VOLUNTEER, or COMMUNITY COORDINATOR
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
  GlassBadge,
} from '../../src/components/ui';
import { colors, typography, spacing, radius } from '../../src/design-system';
import { useAuth } from '../../src/contexts/AuthContext';
import { UserRole } from '../../src/types/auth';
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
    description: 'List surplus meals, groceries, and prepared food from restaurants, campus dining, and stores.',
    icon: 'restaurant-outline',
  },
  {
    key: 'VOLUNTEER',
    title: 'Food Rescue Volunteer',
    badge: 'Couriers & Students',
    description: 'Pick up available surplus donations along your daily routes and transport them to local community centers.',
    icon: 'bicycle-outline',
  },
  {
    key: 'COORDINATOR',
    title: 'Community Coordinator',
    badge: 'Requires Verification',
    description: 'Oversee community food pantry distribution, receive bulk deliveries, and manage collection points.',
    icon: 'business-outline',
    requiresOrg: true,
  },
];

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { selectRole } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('DONOR');
  const [organizationName, setOrganizationName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    setError(null);
    if (selectedRole === 'COORDINATOR' && !organizationName.trim()) {
      setError('Please provide your organization or pantry name.');
      return;
    }

    setIsLoading(true);
    try {
      await selectRole(selectedRole, {
        organizationName: organizationName.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
      });
      // Routing handled by central auth listener
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable={true} testID="role-selection-screen">
      <GlassHeader title="Select Role" />

      <View style={styles.content}>
        <View style={styles.headerBox}>
          <Text style={[typography.headingLarge, styles.title]}>
            How will you participate?
          </Text>
          <Text style={[typography.bodyMedium, styles.subtitle]}>
            Choose your primary role. This customizes your application tools and dashboard.
          </Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.status.error} />
            <Text style={[typography.bodySmall, styles.errorText]}>{error}</Text>
          </View>
        )}

        <View style={styles.rolesList}>
          {ROLES.map((role) => {
            const isSelected = selectedRole === role.key;

            return (
              <GlassCard
                key={role.key}
                variant={isSelected ? 'elevated' : 'interactive'}
                onPress={() => setSelectedRole(role.key)}
                style={[
                  styles.roleCard,
                  isSelected && styles.selectedRoleCard,
                ]}
              >
                <View style={styles.roleCardInner}>
                  <View style={styles.roleHeaderRow}>
                    <View
                      style={[
                        styles.iconCircle,
                        isSelected && styles.selectedIconCircle,
                      ]}
                    >
                      <Ionicons
                        name={role.icon}
                        size={24}
                        color={isSelected ? colors.text.inverse : colors.brand.primary}
                      />
                    </View>

                    <View style={styles.roleTitleColumn}>
                      <Text style={[typography.titleMedium, styles.roleTitle]}>
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
                        isSelected && styles.radioOuterSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </View>

                  <Text style={[typography.bodySmall, styles.roleDesc]}>
                    {role.description}
                  </Text>
                </View>
              </GlassCard>
            );
          })}
        </View>

        {/* Extra coordinator fields */}
        {selectedRole === 'COORDINATOR' && (
          <GlassCard variant="standard" style={styles.extraCard}>
            <Text style={[typography.titleSmall, styles.extraTitle]}>
              Organization Details
            </Text>
            <Text style={[typography.caption, styles.extraSubtitle]}>
              Coordinator accounts start with PENDING status while credentials are confirmed.
            </Text>

            <PrimaryTextInput
              label="Organization / Community Center"
              placeholder="e.g., Campus Food Bank"
              value={organizationName}
              onChangeText={setOrganizationName}
              required
            />

            <PrimaryTextInput
              label="Contact Phone Number"
              placeholder="+1 (555) 000-0000"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </GlassCard>
        )}

        <GlassButton
          title="Continue"
          variant="primary"
          size="large"
          icon="arrow-forward"
          iconPosition="right"
          loading={isLoading}
          onPress={handleContinue}
          style={styles.submitButton}
          fullWidth
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.xs,
  },
  headerBox: {
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
  },
  errorText: {
    color: colors.status.error,
    flex: 1,
  },
  rolesList: {
    gap: spacing.xs,
  },
  roleCard: {
    marginVertical: spacing.xs,
  },
  selectedRoleCard: {
    borderColor: colors.brand.primary,
    borderWidth: 1.5,
  },
  roleCardInner: {
    paddingVertical: 2,
  },
  roleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  selectedIconCircle: {
    backgroundColor: colors.brand.primary,
  },
  roleTitleColumn: {
    flex: 1,
    gap: 2,
  },
  roleTitle: {
    color: colors.text.primary,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: radius.round,
    borderWidth: 2,
    borderColor: colors.text.disabled,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.brand.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: radius.round,
    backgroundColor: colors.brand.primary,
  },
  roleDesc: {
    color: colors.text.secondary,
    lineHeight: 18,
    marginTop: 4,
  },
  extraCard: {
    marginTop: spacing.sm,
  },
  extraTitle: {
    color: colors.text.primary,
    marginBottom: 2,
  },
  extraSubtitle: {
    color: colors.text.muted,
    marginBottom: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
});
