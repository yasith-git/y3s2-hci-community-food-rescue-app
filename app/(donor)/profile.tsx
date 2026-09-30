/**
 * Donor Profile & Settings Screen
 * Displays verified account details, role badge, organization, and functional Sign Out
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassHeader,
  GlassCard,
  GlassButton,
  GlassBadge,
  Avatar,
  Divider,
  SectionHeader,
  LoadingOverlay,
} from '../../src/components/ui';
import { colors, typography, spacing, radius } from '../../src/design-system';
import { useAuth } from '../../src/contexts/AuthContext';

export default function DonorProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Food Rescue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsSigningOut(true);
            try {
              await signOut();
              router.replace('/(auth)/login');
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const displayName = profile?.fullName || user?.displayName || 'Donor Member';
  const email = profile?.email || user?.email || 'email@university.edu';
  const role = profile?.role || 'DONOR';

  return (
    <ScreenContainer scrollable={true} testID="donor-profile-screen">
      <LoadingOverlay visible={isSigningOut} message="Signing out..." />

      <GlassHeader title="My Profile" />

      <View style={styles.content}>
        {/* User Card */}
        <GlassCard variant="elevated" style={styles.userCard}>
          <Avatar name={displayName} size="xlarge" statusIndicator="online" />

          <Text style={[typography.headingMedium, styles.nameText]}>
            {displayName}
          </Text>
          <Text style={[typography.bodySmall, styles.emailText]}>{email}</Text>

          <View style={styles.badgeRow}>
            <GlassBadge label={`Role: ${role}`} variant="brand" />
            <GlassBadge label="Verified Email" variant="success" />
          </View>
        </GlassCard>

        {/* Account Details Section */}
        <SectionHeader title="Account Details" />

        <GlassCard variant="standard">
          <View style={styles.settingRow}>
            <View style={styles.settingIconBox}>
              <Ionicons name="mail-outline" size={20} color={colors.brand.primary} />
            </View>
            <View style={styles.settingTextColumn}>
              <Text style={[typography.labelMedium, styles.settingLabel]}>Email</Text>
              <Text style={[typography.bodySmall, styles.settingValue]}>{email}</Text>
            </View>
          </View>

          <Divider spacingSize="sm" />

          <View style={styles.settingRow}>
            <View style={styles.settingIconBox}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.brand.primary} />
            </View>
            <View style={styles.settingTextColumn}>
              <Text style={[typography.labelMedium, styles.settingLabel]}>Account Status</Text>
              <Text style={[typography.bodySmall, styles.settingValue]}>Active Donor</Text>
            </View>
          </View>

          {profile?.organizationName && (
            <>
              <Divider spacingSize="sm" />
              <View style={styles.settingRow}>
                <View style={styles.settingIconBox}>
                  <Ionicons name="business-outline" size={20} color={colors.brand.primary} />
                </View>
                <View style={styles.settingTextColumn}>
                  <Text style={[typography.labelMedium, styles.settingLabel]}>Organization</Text>
                  <Text style={[typography.bodySmall, styles.settingValue]}>
                    {profile.organizationName}
                  </Text>
                </View>
              </View>
            </>
          )}
        </GlassCard>

        {/* Security & Support Section */}
        <SectionHeader title="Security & About" />

        <GlassCard variant="standard">
          <View style={styles.settingRow}>
            <View style={styles.settingIconBox}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.brand.primary} />
            </View>
            <View style={styles.settingTextColumn}>
              <Text style={[typography.labelMedium, styles.settingLabel]}>Authentication</Text>
              <Text style={[typography.bodySmall, styles.settingValue]}>Firebase Auth Protected</Text>
            </View>
          </View>

          <Divider spacingSize="sm" />

          <View style={styles.settingRow}>
            <View style={styles.settingIconBox}>
              <Ionicons name="information-circle-outline" size={20} color={colors.brand.primary} />
            </View>
            <View style={styles.settingTextColumn}>
              <Text style={[typography.labelMedium, styles.settingLabel]}>App Version</Text>
              <Text style={[typography.bodySmall, styles.settingValue]}>1.0.0 (Phase 1 Foundation)</Text>
            </View>
          </View>
        </GlassCard>

        {/* Sign Out CTA */}
        <GlassButton
          title="Sign Out"
          variant="danger"
          size="medium"
          icon="log-out-outline"
          onPress={handleSignOut}
          style={styles.signOutButton}
          fullWidth
        />

        <View style={{ height: 40 }} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  userCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  nameText: {
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginBottom: 2,
  },
  emailText: {
    color: colors.text.muted,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  settingTextColumn: {
    flex: 1,
  },
  settingLabel: {
    color: colors.text.primary,
  },
  settingValue: {
    color: colors.text.muted,
    marginTop: 1,
  },
  signOutButton: {
    marginTop: spacing.lg,
  },
});
