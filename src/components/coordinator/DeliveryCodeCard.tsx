/**
 * Secure Delivery Verification Code Card for Coordinators
 * Displays the 4-digit handover verification code with security guidelines.
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../ui';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';

interface DeliveryCodeCardProps {
  code: string;
}

export const DeliveryCodeCard: React.FC<DeliveryCodeCardProps> = ({ code }) => {
  const formattedCode = code.split('').join('  ');

  return (
    <GlassCard variant="elevated" style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="key-outline" size={20} color={colors.brand.primary} />
        <Text style={[typography.headingSmall, styles.title]}>
          Delivery Handover Code
        </Text>
      </View>

      <Text style={[typography.caption, styles.subtitle]}>
        Share this code with the volunteer only after verifying physical delivery at your collection hub.
      </Text>

      <View style={styles.codeContainer}>
        <Text style={[typography.headingLarge, styles.codeText]}>
          {formattedCode}
        </Text>
      </View>

      <View style={styles.noticeBox}>
        <Ionicons name="shield-checkmark-outline" size={16} color={colors.status.success} />
        <Text style={[typography.caption, styles.noticeText]}>
          Entering this code allows the volunteer to log arrival. You will then confirm receipt to complete the mission.
        </Text>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    color: colors.text.primary,
  },
  subtitle: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  codeContainer: {
    backgroundColor: colors.surface.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.brand[100],
    marginBottom: spacing.md,
    minWidth: 200,
    alignItems: 'center',
  },
  codeText: {
    color: colors.brand[900],
    fontWeight: '800',
    letterSpacing: 4,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: spacing.sm,
    borderRadius: radius.md,
    width: '100%',
  },
  noticeText: {
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 16,
  },
});
