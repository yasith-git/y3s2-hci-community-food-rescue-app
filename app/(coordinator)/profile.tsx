/**
 * Coordinator Profile Screen
 * Organization details, collection points management, notification settings, and privacy controls.
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassHeader,
  GlassCard,
  GlassButton,
} from '../../src/components/ui';
import {
  OrganizationTrustBadge,
  PrivacyTrustCard,
} from '../../src/components/coordinator';
import { colors } from '../../src/design-system/colors';
import { typography } from '../../src/design-system/typography';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';
import { haptic } from '../../src/design-system/haptics';
import { useAuth } from '../../src/contexts/AuthContext';

export default function CoordinatorProfileScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          haptic.medium();
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const isVerified = profile?.verificationStatus === 'VERIFIED';

  return (
    <ScreenContainer scrollable={false} testID="coordinator-profile-screen">
      <GlassHeader
        title="Coordinator Profile"
        subtitle="Community Organization Hub"
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Organization Card */}
        <GlassCard variant="elevated" style={styles.card}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarCircle}>
              <Ionicons name="business" size={32} color={colors.brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.headingMedium, styles.nameText]}>
                {profile?.fullName || 'Community Coordinator'}
              </Text>
              <Text style={[typography.bodyMedium, styles.orgText]}>
                {profile?.organizationName || 'Community Food Hub'}
              </Text>
              <Text style={[typography.caption, styles.emailText]}>
                {profile?.email}
              </Text>
            </View>
          </View>

          <View style={styles.badgeRow}>
            <OrganizationTrustBadge
              isVerified={isVerified}
              organizationName={profile?.organizationName}
            />
          </View>
        </GlassCard>

        {/* Navigation Menu Options */}
        <GlassCard variant="standard" style={styles.card}>
          <Text style={[typography.labelLarge, styles.sectionTitle]}>Hub Management</Text>

          {/* 1. Collection Hubs */}
          <GlassButton
            title="Manage Collection Drop-off Hubs"
            variant="secondary"
            icon="location-outline"
            onPress={() => router.push('/(coordinator)/community-points')}
          />

          {/* 2. Notification Preferences */}
          <GlassButton
            title="Notification Preferences"
            variant="secondary"
            icon="notifications-outline"
            onPress={() => router.push('/(coordinator)/notification-preferences')}
          />

          {/* 3. Privacy & Security */}
          <GlassButton
            title="Privacy & Data Minimization"
            variant="secondary"
            icon="lock-closed-outline"
            onPress={() => router.push('/(coordinator)/privacy')}
          />
        </GlassCard>

        {/* Informational Privacy Card */}
        <PrivacyTrustCard />

        {/* Sign Out Button */}
        <View style={styles.footer}>
          <GlassButton
            title="Sign Out"
            variant="tertiary"
            icon="log-out-outline"
            onPress={handleSignOut}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.round,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.brand[100],
  },
  nameText: {
    color: colors.text.primary,
  },
  orgText: {
    color: colors.brand.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  emailText: {
    color: colors.text.muted,
    marginTop: 2,
  },
  badgeRow: {
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  footer: {
    padding: spacing.md,
    marginTop: spacing.sm,
  },
});
