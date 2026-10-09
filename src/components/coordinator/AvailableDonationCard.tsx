/**
 * Available Food Donation Card for Coordinator Feed
 * Displays food information, smart allocation fit badge, storage compatibility, allergen tags, and countdown timers.
 */

import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GlassBadge, GlassButton } from '../ui';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { Donation } from '../../types/donation';
import { Organization } from '../../types/coordinator';
import { formatTimeRemaining, formatRelativeTime } from '../../utils/dateTime';

export type AllocationFit = 'BEST_FIT' | 'SUITABLE' | 'POSSIBLE' | 'NOT_ELIGIBLE';

export interface FitAssessment {
  fit: AllocationFit;
  label: string;
  reasons: string[];
}

export function evaluateDonationFitForOrg(
  donation: Donation,
  org: Organization | null
): FitAssessment {
  if (!org) {
    return {
      fit: 'POSSIBLE',
      label: 'Possible Fit',
      reasons: ['Awaiting organization verification'],
    };
  }

  const reasons: string[] = [];
  let isFit = true;

  // 1. Storage Compatibility Check
  const reqStorage = donation.safety.storageCondition.toUpperCase();
  const orgCapabilities = (org.storageCapabilities || []).map((s) => s.toUpperCase());

  if (reqStorage.includes('REFRIGERAT') || reqStorage.includes('CHILLED')) {
    if (orgCapabilities.some((c) => c.includes('REFRIGERAT') || c.includes('CHILL'))) {
      reasons.push('Refrigerated storage available');
    } else {
      reasons.push('Requires refrigerated storage');
      isFit = false;
    }
  } else if (reqStorage.includes('FROZEN')) {
    if (orgCapabilities.some((c) => c.includes('FROZEN') || c.includes('FREEZER'))) {
      reasons.push('Freezer storage available');
    } else {
      reasons.push('Requires freezer storage');
      isFit = false;
    }
  } else {
    reasons.push('Ambient storage compatible');
  }

  // 2. Capacity Check
  if (donation.food.quantity <= org.distributionCapacityPeople) {
    reasons.push(`Within hub distribution capacity (${org.distributionCapacityPeople} people)`);
  } else {
    reasons.push(`Large quantity exceeds normal single batch (${org.distributionCapacityPeople} people)`);
  }

  // 3. Category Acceptance
  const orgCategories = org.acceptedFoodCategories || ['All'];
  if (orgCategories.includes('All') || orgCategories.includes(donation.food.category)) {
    reasons.push('Food category accepted');
  }

  if (!isFit) {
    return {
      fit: 'NOT_ELIGIBLE',
      label: 'Storage Incompatible',
      reasons,
    };
  }

  if (reasons.length >= 3) {
    return {
      fit: 'BEST_FIT',
      label: 'Best Fit',
      reasons,
    };
  }

  return {
    fit: 'SUITABLE',
    label: 'Suitable',
    reasons,
  };
}

interface AvailableDonationCardProps {
  donation: Donation;
  organization?: Organization | null;
  onReview: (donation: Donation) => void;
}

export const AvailableDonationCard: React.FC<AvailableDonationCardProps> = ({
  donation,
  organization = null,
  onReview,
}) => {
  const timeRemaining = formatTimeRemaining(donation.pickup.pickupDeadlineAt);
  const prepTimeFormatted = donation.safety.preparedAt ? formatRelativeTime(donation.safety.preparedAt) : 'Today';

  const deadlineMs = new Date(donation.pickup.pickupDeadlineAt).getTime();
  const isUrgent = deadlineMs - Date.now() < 2 * 60 * 60 * 1000; // Less than 2 hours

  const assessment = evaluateDonationFitForOrg(donation, organization);

  return (
    <GlassCard variant="elevated" style={styles.card} testID={`available-card-${donation.id}`}>
      {/* Top Meta Bar */}
      <View style={styles.topRow}>
        <View style={styles.categoryBadgeRow}>
          <GlassBadge label={donation.food.category} variant="brand" size="small" />
          {/* Smart Allocation Fit Badge */}
          <View
            style={[
              styles.fitBadge,
              assessment.fit === 'BEST_FIT' && styles.fitBadgeBest,
              assessment.fit === 'SUITABLE' && styles.fitBadgeSuitable,
              assessment.fit === 'NOT_ELIGIBLE' && styles.fitBadgeIneligible,
            ]}
          >
            <Ionicons
              name={
                assessment.fit === 'BEST_FIT'
                  ? 'sparkles'
                  : assessment.fit === 'SUITABLE'
                  ? 'checkmark-circle'
                  : 'information-circle'
              }
              size={11}
              color={
                assessment.fit === 'BEST_FIT'
                  ? '#059669'
                  : assessment.fit === 'SUITABLE'
                  ? '#2563EB'
                  : '#D97706'
              }
            />
            <Text
              style={[
                typography.caption,
                styles.fitBadgeText,
                assessment.fit === 'BEST_FIT' && styles.fitTextBest,
                assessment.fit === 'SUITABLE' && styles.fitTextSuitable,
                assessment.fit === 'NOT_ELIGIBLE' && styles.fitTextIneligible,
              ]}
            >
              {assessment.label}
            </Text>
          </View>
        </View>

        <View style={styles.countdownBadge}>
          <Ionicons name="time-outline" size={12} color={isUrgent ? '#DC2626' : colors.status.warning} />
          <Text style={[typography.caption, isUrgent ? styles.urgentCountdown : styles.normalCountdown]}>
            {timeRemaining}
          </Text>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.bodyRow}>
        {donation.food.imageUrl ? (
          <Image source={{ uri: donation.food.imageUrl }} style={styles.thumbnail} />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <Ionicons name="restaurant" size={28} color={colors.brand.primary} />
          </View>
        )}

        <View style={styles.detailsCol}>
          <Text style={[typography.headingSmall, styles.foodName]} numberOfLines={1}>
            {donation.food.name}
          </Text>

          <Text style={[typography.labelLarge, styles.quantityText]}>
            📦 {donation.food.quantity} {donation.food.unit}
          </Text>

          <Text style={[typography.caption, styles.donorText]} numberOfLines={1}>
            From {donation.donorOrganization || donation.donorName}
          </Text>
        </View>
      </View>

      {/* Smart Fit Reasons Pill */}
      {assessment.reasons.length > 0 && (
        <View style={styles.reasonsContainer}>
          <Text style={[typography.caption, styles.reasonText]}>
            ✓ {assessment.reasons[0]}
          </Text>
        </View>
      )}

      {/* Operational Chips: Prep Time, Storage, Allergens */}
      <View style={styles.chipRow}>
        <View style={styles.metaChip}>
          <Ionicons name="timer-outline" size={12} color={colors.text.secondary} />
          <Text style={[typography.caption, styles.metaChipText]}>Prep: {prepTimeFormatted}</Text>
        </View>

        <View style={styles.metaChip}>
          <Ionicons name="snow-outline" size={12} color={colors.text.secondary} />
          <Text style={[typography.caption, styles.metaChipText]}>{donation.safety.storageCondition}</Text>
        </View>

        {donation.safety.allergens && donation.safety.allergens.length > 0 && !donation.safety.allergens.includes('None') && (
          <View style={[styles.metaChip, styles.allergenChip]}>
            <Ionicons name="warning-outline" size={12} color="#D97706" />
            <Text style={[typography.caption, styles.allergenText]}>
              {donation.safety.allergens.length} Allergens
            </Text>
          </View>
        )}
      </View>

      {/* Location Row */}
      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={14} color={colors.text.muted} />
        <Text style={[typography.caption, styles.locationText]} numberOfLines={1}>
          {donation.pickup.address}
        </Text>
      </View>

      {/* Action Bar */}
      <View style={styles.actionRow}>
        <GlassButton
          title="Review & Reserve"
          variant="primary"
          icon="arrow-forward"
          onPress={() => onReview(donation)}
        />
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    backgroundColor: '#F3F4F6',
  },
  fitBadgeBest: {
    backgroundColor: '#ECFDF5',
  },
  fitBadgeSuitable: {
    backgroundColor: '#EFF6FF',
  },
  fitBadgeIneligible: {
    backgroundColor: '#FEF3C7',
  },
  fitBadgeText: {
    fontWeight: '700',
    fontSize: 10,
  },
  fitTextBest: {
    color: '#059669',
  },
  fitTextSuitable: {
    color: '#2563EB',
  },
  fitTextIneligible: {
    color: '#D97706',
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  urgentCountdown: {
    color: '#DC2626',
    fontWeight: '700',
  },
  normalCountdown: {
    color: colors.status.warning,
    fontWeight: '600',
  },
  bodyRow: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
    gap: spacing.sm,
    alignItems: 'center',
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surface.secondary,
  },
  placeholderThumbnail: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCol: {
    flex: 1,
  },
  foodName: {
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: 2,
  },
  quantityText: {
    color: colors.brand.primary,
    fontWeight: '700',
    marginBottom: 2,
  },
  donorText: {
    color: colors.text.muted,
  },
  reasonsContainer: {
    backgroundColor: colors.surface.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
    marginVertical: 4,
  },
  reasonText: {
    color: colors.text.secondary,
    fontSize: 11,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
  },
  metaChipText: {
    color: colors.text.secondary,
  },
  allergenChip: {
    backgroundColor: '#FEF3C7',
  },
  allergenText: {
    color: '#D97706',
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  locationText: {
    color: colors.text.muted,
    flex: 1,
  },
  actionRow: {
    marginTop: spacing.xs,
  },
});
