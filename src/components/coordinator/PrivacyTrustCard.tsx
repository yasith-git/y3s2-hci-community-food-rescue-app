/**
 * Privacy & Trust Informational Card
 * Details data minimization principles and community collection point privacy standards.
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../ui';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';

export const PrivacyTrustCard: React.FC = () => {
  return (
    <GlassCard variant="elevated" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed" size={20} color={colors.brand.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.headingSmall, styles.title]}>
            Privacy & Trust Architecture
          </Text>
          <Text style={[typography.caption, styles.subtitle]}>
            Privacy by Design • Operational Logistics Only
          </Text>
        </View>
      </View>

      <View style={styles.pointsList}>
        <View style={styles.pointItem}>
          <Ionicons name="eye-off-outline" size={18} color={colors.brand.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.labelSmall, styles.pointHeading]}>
              No Beneficiary Data Collection
            </Text>
            <Text style={[typography.caption, styles.pointText]}>
              The platform never asks for, displays, or stores recipient personal profiles, beneficiary names, photos, or residential addresses.
            </Text>
          </View>
        </View>

        <View style={styles.pointItem}>
          <Ionicons name="business-outline" size={18} color={colors.brand.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.labelSmall, styles.pointHeading]}>
              Community Hub Receiving Layer
            </Text>
            <Text style={[typography.caption, styles.pointText]}>
              Deliveries route exclusively to verified community collection points and pantries managed by authorized coordinators.
            </Text>
          </View>
        </View>

        <View style={styles.pointItem}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.brand.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.labelSmall, styles.pointHeading]}>
              Cryptographic Delivery Handover
            </Text>
            <Text style={[typography.caption, styles.pointText]}>
              Secure 4-digit verification codes guarantee physical inspection and custody transfer before final rescue completion.
            </Text>
          </View>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text.primary,
  },
  subtitle: {
    color: colors.text.muted,
  },
  pointsList: {
    gap: spacing.md,
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  pointHeading: {
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: 2,
  },
  pointText: {
    color: colors.text.secondary,
    lineHeight: 18,
  },
});
