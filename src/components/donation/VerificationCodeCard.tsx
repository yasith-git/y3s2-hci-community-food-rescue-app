/**
 * Verification Code Card Component
 * Displays secure 4-digit code once volunteer is assigned
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GlassBadge } from '../ui';
import { colors, typography, spacing, radius } from '../../design-system';

interface VerificationCodeCardProps {
  code: string;
  isVolunteerAssigned: boolean;
}

export const VerificationCodeCard: React.FC<VerificationCodeCardProps> = ({
  code,
  isVolunteerAssigned,
}) => {
  return (
    <GlassCard variant="elevated" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconBox}>
          <Ionicons name="key-outline" size={20} color={colors.brand.primary} />
        </View>
        <View style={styles.titleColumn}>
          <Text style={[typography.titleMedium, styles.title]}>
            Pickup Verification Code
          </Text>
          <Text style={[typography.caption, styles.subtitle]}>
            Provide this PIN to the courier upon physical handover.
          </Text>
        </View>
        <GlassBadge
          label={isVolunteerAssigned ? 'Active' : 'Pending Match'}
          variant={isVolunteerAssigned ? 'success' : 'neutral'}
        />
      </View>

      {isVolunteerAssigned ? (
        <View style={styles.codeContainer}>
          <View style={styles.codeBox}>
            {code.split('').map((char, index) => (
              <View key={index} style={styles.digitBox}>
                <Text style={[typography.displayLarge, styles.digitText]}>{char}</Text>
              </View>
            ))}
          </View>
          <Text style={[typography.caption, styles.securityNote]}>
            Do NOT share this code over the phone or before the food is collected.
          </Text>
        </View>
      ) : (
        <View style={styles.lockedContainer}>
          <Ionicons name="lock-closed" size={20} color={colors.text.muted} />
          <Text style={[typography.bodySmall, styles.lockedText]}>
            PIN will unlock automatically when a volunteer accepts the rescue.
          </Text>
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.xs,
    borderColor: 'rgba(35, 132, 113, 0.25)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  titleColumn: {
    flex: 1,
  },
  title: {
    color: colors.text.primary,
  },
  subtitle: {
    color: colors.text.muted,
  },
  codeContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  codeBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  digitBox: {
    width: 52,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.primary,
    borderWidth: 1.5,
    borderColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  digitText: {
    color: colors.brand[900],
    fontWeight: '800',
  },
  securityNote: {
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  lockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.subtle,
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  lockedText: {
    color: colors.text.muted,
    flex: 1,
  },
});
