/**
 * Volunteer Profile Screen
 * Role-aware profile with credentials, statistics, personal details, preferences, and logout.
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
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
import { useAuth } from '../../src/contexts/AuthContext';
import { colors } from '../../src/design-system/colors';
import { typography } from '../../src/design-system/typography';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';
import { haptic } from '../../src/design-system/haptics';
import { EditProfileModal } from '../../src/components/profile/EditProfileModal';
import { formatDobLong, calculateAge } from '../../src/services/profile/profile.validation';

export default function VolunteerProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const displayName = profile?.fullName || user?.user_metadata?.full_name || user?.displayName || 'Active Volunteer';
  const email = profile?.email || user?.email || 'volunteer@foodrescue.lk';
  const dobLabel = profile?.dateOfBirth
    ? `${formatDobLong(profile.dateOfBirth)} (${calculateAge(profile.dateOfBirth)} yrs)`
    : 'Not added yet';

  const openEditProfile = () => {
    haptic.selection();
    setIsEditingProfile(true);
  };

  const handleSignOut = () => {
    haptic.warning();
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

  return (
    <ScreenContainer scrollable={true} testID="volunteer-profile-screen">
      <LoadingOverlay visible={isSigningOut} message="Signing out..." />

      <GlassHeader title="My Volunteer Profile" />

      <View style={styles.content}>
        {/* Hero User Card */}
        <GlassCard variant="elevated" style={styles.userCard}>
          <TouchableOpacity
            onPress={openEditProfile}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            testID="volunteer-profile-avatar"
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
            <GlassBadge label="Role: Volunteer" variant="brand" />
            <GlassBadge label="Active Responder" variant="success" />
          </View>

          <GlassButton
            title="Edit Profile"
            variant="secondary"
            size="small"
            icon="create-outline"
            onPress={openEditProfile}
            style={styles.editProfileButton}
            testID="volunteer-edit-profile-button"
          />
        </GlassCard>

        {/* Rescue Impact Highlights */}
        <SectionHeader title="Rescue Impact" />

        <GlassCard variant="standard" style={styles.impactCard}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={styles.statIconBadge}>
                <Ionicons name="bicycle" size={16} color={colors.brand.primary} />
              </View>
              <Text style={[typography.headingMedium, styles.statNumber]}>14</Text>
              <Text style={[typography.caption, styles.statLabel]}>Rescues</Text>
            </View>

            <View style={styles.statBox}>
              <View style={styles.statIconBadge}>
                <Ionicons name="restaurant" size={16} color={colors.brand.primary} />
              </View>
              <Text style={[typography.headingMedium, styles.statNumber]}>320</Text>
              <Text style={[typography.caption, styles.statLabel]}>Meals Saved</Text>
            </View>

            <View style={styles.statBox}>
              <View style={styles.statIconBadge}>
                <Ionicons name="leaf" size={16} color={colors.brand.primary} />
              </View>
              <Text style={[typography.headingMedium, styles.statNumber]}>48 kg</Text>
              <Text style={[typography.caption, styles.statLabel]}>CO₂ Prevented</Text>
            </View>
          </View>
        </GlassCard>

        {/* Personal & Contact Details Section */}
        <SectionHeader
          title="Personal Details"
          action={
            <TouchableOpacity onPress={openEditProfile} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[typography.labelMedium, styles.editActionLink]}>Edit</Text>
            </TouchableOpacity>
          }
        />

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
        </GlassCard>

        {/* Rescue Preferences & Navigation */}
        <SectionHeader title="Rescue Preferences" />

        <GlassCard variant="standard" style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => {
              haptic.selection();
              router.push('/(volunteer)/notification-preferences');
            }}
            accessibilityRole="button"
            accessibilityLabel="Notification and Quiet Hours"
          >
            <View style={styles.settingIconBox}>
              <Ionicons name="notifications-outline" size={20} color={colors.brand.primary} />
            </View>
            <View style={styles.settingTextColumn}>
              <Text style={[typography.labelMedium, styles.settingLabel]}>Notification & Quiet Hours</Text>
              <Text style={[typography.caption, styles.settingSubLabel]}>Alert sound & dispatch schedule</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
          </TouchableOpacity>

          <Divider spacingSize="none" />

          <TouchableOpacity
            style={styles.navRow}
            onPress={() => {
              haptic.selection();
              router.push('/(volunteer)/routes');
            }}
            accessibilityRole="button"
            accessibilityLabel="Saved Journey Trajectories"
          >
            <View style={styles.settingIconBox}>
              <Ionicons name="git-branch-outline" size={20} color={colors.brand.primary} />
            </View>
            <View style={styles.settingTextColumn}>
              <Text style={[typography.labelMedium, styles.settingLabel]}>Saved Journey Trajectories</Text>
              <Text style={[typography.caption, styles.settingSubLabel]}>Commute corridors for auto-matching</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
          </TouchableOpacity>
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

        <View style={{ height: 48 }} />
      </View>

      <EditProfileModal
        visible={isEditingProfile}
        onClose={() => setIsEditingProfile(false)}
        testID="volunteer-edit-profile-modal"
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
  avatarEditBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
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
  editProfileButton: {
    marginTop: spacing.md,
  },
  editActionLink: {
    color: colors.brand.primary,
    fontWeight: '700',
  },
  impactCard: {
    padding: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  statIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statNumber: {
    color: colors.brand.primary,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.text.muted,
    marginTop: 2,
    textAlign: 'center',
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
  settingSubLabel: {
    color: colors.text.muted,
    marginTop: 2,
  },
  settingsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  signOutButton: {
    marginTop: spacing.lg,
  },
});
