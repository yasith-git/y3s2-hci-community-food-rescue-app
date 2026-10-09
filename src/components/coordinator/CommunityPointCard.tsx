/**
 * Community Collection Point Card
 * Displays collection hub details and operational status for coordinators.
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GlassButton, GlassBadge } from '../ui';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { CommunityPoint } from '../../types/coordinator';

interface CommunityPointCardProps {
  point: CommunityPoint;
  onEdit?: (point: CommunityPoint) => void;
  onDeactivate?: (point: CommunityPoint) => void;
  onSelect?: (point: CommunityPoint) => void;
  isSelected?: boolean;
  selectable?: boolean;
}

export const CommunityPointCard: React.FC<CommunityPointCardProps> = ({
  point,
  onEdit,
  onDeactivate,
  onSelect,
  isSelected = false,
  selectable = false,
}) => {
  return (
    <GlassCard
      variant={isSelected ? 'elevated' : 'standard'}
      style={[
        styles.card,
        isSelected && styles.selectedBorder,
        !point.isActive && styles.inactiveCard,
      ]}
      onPress={selectable ? () => onSelect?.(point) : undefined}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleArea}>
          <View style={styles.iconCircle}>
            <Ionicons name="business" size={18} color={colors.brand.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.headingSmall, styles.label]}>{point.label}</Text>
            <Text style={[typography.caption, styles.orgText]}>{point.organizationName}</Text>
          </View>
        </View>

        <View style={styles.badgeArea}>
          {point.isActive ? (
            <GlassBadge label="Active Hub" variant="success" size="small" />
          ) : (
            <GlassBadge label="Inactive" variant="neutral" size="small" />
          )}
          {selectable && isSelected && (
            <Ionicons name="checkmark-circle" size={22} color={colors.brand.primary} />
          )}
        </View>
      </View>

      <View style={styles.addressRow}>
        <Ionicons name="location-outline" size={16} color={colors.text.secondary} />
        <Text style={[typography.bodyMedium, styles.addressText]}>{point.address}</Text>
      </View>

      {point.operatingHours ? (
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color={colors.text.muted} />
          <Text style={[typography.caption, styles.metaText]}>Hours: {point.operatingHours}</Text>
        </View>
      ) : null}

      <View style={styles.contactRow}>
        <Ionicons name="person-outline" size={14} color={colors.text.muted} />
        <Text style={[typography.caption, styles.metaText]}>
          Contact: {point.contactName} ({point.contactPhone})
        </Text>
      </View>

      {point.instructions ? (
        <Text style={[typography.caption, styles.instructionsText]}>
          Note: "{point.instructions}"
        </Text>
      ) : null}

      {!selectable && (onEdit || onDeactivate) && (
        <View style={styles.actionsRow}>
          {onEdit && (
            <GlassButton
              title="Edit Center"
              variant="secondary"
              icon="create-outline"
              size="small"
              onPress={() => onEdit(point)}
            />
          )}

          {onDeactivate && (
            <GlassButton
              title={point.isActive ? 'Deactivate' : 'Activate'}
              variant={point.isActive ? 'tertiary' : 'primary'}
              icon={point.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
              size="small"
              onPress={() => onDeactivate(point)}
            />
          )}
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  selectedBorder: {
    borderWidth: 2,
    borderColor: colors.brand.primary,
  },
  inactiveCard: {
    opacity: 0.6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.text.primary,
  },
  orgText: {
    color: colors.text.muted,
  },
  badgeArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginVertical: spacing.xs,
  },
  addressText: {
    color: colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  metaText: {
    color: colors.text.secondary,
  },
  instructionsText: {
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
  },
});
