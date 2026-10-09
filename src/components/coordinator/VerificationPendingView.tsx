/**
 * Verification Pending Screen for Coordinators
 * Displayed when a coordinator account has status = PENDING.
 * Ensures sensitive operational data and reservation controls remain inaccessible until verified.
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ScreenContainer,
  GlassHeader,
  GlassCard,
  GlassButton,
} from '../ui';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { useAuth } from '../../contexts/AuthContext';

export const VerificationPendingView: React.FC = () => {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  return (
    <ScreenContainer scrollable={true} testID="verification-pending-screen">
      <GlassHeader
        title="Organization Verification"
        subtitle="Community Trust & Logistics"
      />

      <View style={styles.container}>
        <GlassCard variant="elevated" style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-half-outline" size={48} color={colors.brand.primary} />
          </View>

          <Text style={[typography.headingMedium, styles.title]}>
            Organization Verification Pending
          </Text>

          <Text style={[typography.bodyMedium, styles.description]}>
            Welcome, {profile?.fullName || 'Community Coordinator'}. Your organization profile ({profile?.organizationName || 'Community Hub'}) is currently under review by our campus community administrators.
          </Text>

          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.status.success} />
              <Text style={[typography.bodySmall, styles.infoText]}>
                Protects food safety and community logistics integrity.
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.status.success} />
              <Text style={[typography.bodySmall, styles.infoText]}>
                Unlocks real-time surplus food reservation and collection hub management.
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.status.success} />
              <Text style={[typography.bodySmall, styles.infoText]}>
                Enables verified delivery code presentation and handover receipt.
              </Text>
            </View>
          </View>

          <View style={styles.buttonGroup}>
            <GlassButton
              title="View Coordinator Profile"
              variant="secondary"
              icon="person-outline"
              onPress={() => router.push('/(coordinator)/profile')}
            />

            <GlassButton
              title="Sign Out"
              variant="tertiary"
              icon="log-out-outline"
              onPress={async () => {
                await signOut();
                router.replace('/(auth)/login');
              }}
            />
          </View>
        </GlassCard>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  card: {
    width: '100%',
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: radius.round,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.brand[100],
  },
  title: {
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  infoBox: {
    width: '100%',
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoText: {
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
  buttonGroup: {
    width: '100%',
    gap: spacing.sm,
  },
});
