/**
 * Donor Profile & Settings Screen
 * Displays verified account details, role badge, organization, and functional Sign Out
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert, TouchableOpacity } from 'react-native';
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
import { EditProfileModal } from '../../src/components/profile/EditProfileModal';
import { formatDobLong, calculateAge } from '../../src/services/profile/profile.validation';
import { haptic } from '../../src/design-system/haptics';

export default function DonorProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const openEditProfile = () => {
    haptic.selection();
    setIsEditingProfile(true);
  };

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
  const dobLabel = profile?.dateOfBirth
    ? `${formatDobLong(profile.dateOfBirth)} (${calculateAge(profile.dateOfBirth)} yrs)`
    : 'Not added yet';

  return (
    <ScreenContainer scrollable={true} testID="donor-profile-screen">
      <LoadingOverlay visible={isSigningOut} message="Signing out..." />

      <GlassHeader title="My Profile" />

      <View style={styles.content}>
        {/* User Card */}
        <GlassCard variant="elevated" style={styles.userCard}>
          <TouchableOpacity
            onPress={openEditProfile}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            testID="donor-profile-avatar"
          >
            <Avatar
              name={displayName}
              source={profile?.avatarUrl || undefined}
              size="xlarge"
              statusIndicator="online"
            />
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={13} color={colors.text.inverse} />
            </View>
          </TouchableOpacity>

          <Text style={[typography.headingMedium, styles.nameText]}>
            {displayName}
          </Text>
          <Text style={[typography.bodySmall, styles.emailText]}>{email}</Text>

          <View style={styles.badgeRow}>
            <GlassBadge label={`Role: ${role}`} variant="brand" />
            <GlassBadge label="Verified Email" variant="success" />
          </View>

          <GlassButton
            title="Edit Profile"
            variant="secondary"
            size="small"
            icon="create-outline"
            onPress={openEditProfile}
            style={styles.editProfileButton}
            testID="donor-edit-profile-button"
          />
        </GlassCard>

        {/* Account Details Section */}
        <SectionHeader title="Account Details" />

        <GlassCard variant="standard">
          <View style={styles.settingRow}>
            <View style={styles.settingIconBox}>
              <Ionicons name="person-outline" size={20} color={colors.brand.primary} />
            </View>
            <View style={styles.settingTextColumn}>
              <Text style={[typography.labelMedium, styles.settingLabel]}>Full Name</Text>
              <Text style={[typography.bodySmall, styles.settingValue]}>{displayName}</Text>
            </View>
          </View>

          <Divider spacingSize="sm" />

          <View style={styles.settingRow}>
            <View style={styles.settingIconBox}>
              <Ionicons name="calendar-outline" size={20} color={colors.brand.primary} />
            </View>
            <View style={styles.settingTextColumn}>
              <Text style={[typography.labelMedium, styles.settingLabel]}>Date of Birth</Text>
              <Text style={[typography.bodySmall, styles.settingValue]}>{dobLabel}</Text>
            </View>
          </View>

          <Divider spacingSize="sm" />

          <View style={styles.settingRow}>
            <View style={styles.settingIconBox}>
              <Ionicons name="call-outline" size={20} color={colors.brand.primary} />
            </View>
            <View style={styles.settingTextColumn}>
              <Text style={[typography.labelMedium, styles.settingLabel]}>Mobile Number</Text>
              <Text style={[typography.bodySmall, styles.settingValue]}>
                {profile?.phoneNumber || 'Not added yet'}
              </Text>
            </View>
          </View>

          <Divider spacingSize="sm" />

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
              <Text style={[typography.bodySmall, styles.settingValue]}>Supabase Auth Protected</Text>
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

      <EditProfileModal
        visible={isEditingProfile}
        onClose={() => setIsEditingProfile(false)}
        testID="donor-edit-profile-modal"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  userCard: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  nameText: {
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: 4,
    textAlign: 'center',
  },
  emailText: {
    color: colors.text.muted,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    left: -2,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  editProfileButton: {
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
