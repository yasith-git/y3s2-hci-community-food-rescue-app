/**
 * Comprehensive Donation Review Modal for Coordinators
 * Displays full food safety details, donor declaration disclaimer, pickup requirements,
 * and allows requesting clarification or atomic reservation.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  GlassCard,
  GlassBadge,
  GlassButton,
  GlassHeader,
  GlassChip,
} from '../ui';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { haptic } from '../../design-system/haptics';
import { Donation } from '../../types/donation';
import { CommunityPoint } from '../../types/coordinator';
import { CommunityPointSelector } from './CommunityPointSelector';
import { formatTimeWindow, formatTimeRemaining, formatRelativeTime } from '../../utils/dateTime';

interface DonationReviewModalProps {
  visible: boolean;
  donation: Donation | null;
  communityPoints: CommunityPoint[];
  onClose: () => void;
  onRequestClarification: (donation: Donation) => void;
  onReserve: (donation: Donation, communityPointId: string) => Promise<void>;
  onAddNewCommunityPoint: () => void;
}

export const DonationReviewModal: React.FC<DonationReviewModalProps> = ({
  visible,
  donation,
  communityPoints,
  onClose,
  onRequestClarification,
  onReserve,
  onAddNewCommunityPoint,
}) => {
  const [selectedPointId, setSelectedPointId] = useState<string | null>(
    communityPoints.find((p) => p.isActive)?.id || null
  );
  const [isReserving, setIsReserving] = useState(false);

  if (!donation) return null;

  const timeRemaining = formatTimeRemaining(donation.pickup.pickupDeadlineAt);
  const timeWindow = formatTimeWindow(donation.pickup.pickupStartAt, donation.pickup.pickupDeadlineAt);
  const prepTimeStr = donation.safety.preparedAt ? formatRelativeTime(donation.safety.preparedAt) : 'Recorded by donor';

  const handleConfirmReservation = async () => {
    if (!selectedPointId) {
      Alert.alert('Collection Hub Required', 'Please select a community drop-off hub for this food delivery.');
      return;
    }

    setIsReserving(true);
    haptic.selection();

    try {
      await onReserve(donation, selectedPointId);
      haptic.success();
      onClose();
    } catch (error: any) {
      console.warn('[DonationReviewModal] Reservation error:', error);
      haptic.warning();
      Alert.alert(
        'Reservation Failed',
        error?.message || 'This donation is no longer available.'
      );
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        <GlassHeader
          title="Review Donation"
          subtitle="Food Info & Safety Review"
          onBack={onClose}
        />

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Food Summary Card */}
          <GlassCard variant="elevated" style={styles.card}>
            <View style={styles.badgeRow}>
              <GlassBadge label={donation.food.category} variant="brand" size="small" />
              <View style={styles.timeBadge}>
                <Ionicons name="time-outline" size={12} color={colors.status.warning} />
                <Text style={[typography.caption, styles.timeText]}>{timeRemaining}</Text>
              </View>
            </View>

            <View style={styles.foodRow}>
              {donation.food.imageUrl ? (
                <Image source={{ uri: donation.food.imageUrl }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="restaurant" size={36} color={colors.brand.primary} />
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text style={[typography.headingMedium, styles.foodName]}>{donation.food.name}</Text>
                <Text style={[typography.labelLarge, styles.qtyText]}>
                  📦 {donation.food.quantity} {donation.food.unit}
                </Text>
                <Text style={[typography.caption, styles.donorText]}>
                  Offered by {donation.donorOrganization || donation.donorName}
                </Text>
              </View>
            </View>

            {donation.food.description ? (
              <Text style={[typography.bodyMedium, styles.descriptionText]}>
                {donation.food.description}
              </Text>
            ) : null}
          </GlassCard>

          {/* Food Information & Preparation Card */}
          <GlassCard variant="standard" style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="nutrition-outline" size={18} color={colors.brand.primary} />
              <Text style={[typography.labelLarge, styles.sectionTitle]}>Food Information</Text>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoCol}>
                <Text style={[typography.caption, styles.infoLabel]}>Prepared</Text>
                <Text style={[typography.bodyMedium, styles.infoValue]}>{prepTimeStr}</Text>
              </View>

              <View style={styles.infoCol}>
                <Text style={[typography.caption, styles.infoLabel]}>Storage Condition</Text>
                <Text style={[typography.bodyMedium, styles.infoValue]}>{donation.safety.storageCondition}</Text>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoCol}>
                <Text style={[typography.caption, styles.infoLabel]}>Packaging</Text>
                <Text style={[typography.bodyMedium, styles.infoValue]}>{donation.safety.packagingCondition}</Text>
              </View>

              <View style={styles.infoCol}>
                <Text style={[typography.caption, styles.infoLabel]}>Allergens</Text>
                <Text style={[typography.bodyMedium, styles.infoValue]}>
                  {donation.safety.allergens.length > 0 ? donation.safety.allergens.join(', ') : 'None listed'}
                </Text>
              </View>
            </View>

            {donation.safety.ingredients ? (
              <View style={styles.ingredientBox}>
                <Text style={[typography.caption, styles.infoLabel]}>Ingredients</Text>
                <Text style={[typography.bodySmall, styles.ingredientText]}>
                  {donation.safety.ingredients}
                </Text>
              </View>
            ) : null}
          </GlassCard>

          {/* Pickup Logistics Card */}
          <GlassCard variant="standard" style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={18} color={colors.status.info} />
              <Text style={[typography.labelLarge, styles.sectionTitle]}>Pickup Window & Location</Text>
            </View>

            <Text style={[typography.bodyMedium, styles.addressText]}>
              {donation.pickup.address}
            </Text>

            <Text style={[typography.caption, styles.metaText]}>
              Pickup Window: {timeWindow}
            </Text>

            {donation.pickup.instructions ? (
              <Text style={[typography.bodySmall, styles.instructionsText]}>
                Donor Notes: "{donation.pickup.instructions}"
              </Text>
            ) : null}
          </GlassCard>

          {/* Mandatory Donor Declaration Disclaimer */}
          <View style={styles.disclaimerCard}>
            <Ionicons name="information-circle" size={18} color={colors.text.secondary} />
            <Text style={[typography.caption, styles.disclaimerText]}>
              Information is provided directly by the donor and is not a certified food-safety inspection. Community coordinators should verify packaging and storage condition upon delivery.
            </Text>
          </View>

          {/* Community Collection Point Selection */}
          <CommunityPointSelector
            points={communityPoints}
            selectedPointId={selectedPointId}
            onSelectPoint={(p) => setSelectedPointId(p.id)}
            onAddNewPoint={onAddNewCommunityPoint}
          />

          {/* Action Row: Clarification or Reserve */}
          <View style={styles.actionSection}>
            <GlassButton
              title="Request Clarification"
              variant="secondary"
              icon="help-circle-outline"
              onPress={() => onRequestClarification(donation)}
            />

            <GlassButton
              title="Reserve Food for Hub"
              variant="primary"
              icon="checkmark-circle"
              loading={isReserving}
              disabled={!selectedPointId || communityPoints.filter((p) => p.isActive).length === 0}
              onPress={handleConfirmReservation}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.primary,
  },
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
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  timeText: {
    color: colors.status.warning,
    fontWeight: '600',
  },
  foodRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.brand[100],
  },
  foodName: {
    color: colors.text.primary,
  },
  qtyText: {
    color: colors.brand.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  donorText: {
    color: colors.text.muted,
    marginTop: 2,
  },
  descriptionText: {
    color: colors.text.secondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    color: colors.text.muted,
    fontSize: 11,
    marginBottom: 2,
  },
  infoValue: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  ingredientBox: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
  },
  ingredientText: {
    color: colors.text.secondary,
    marginTop: 2,
  },
  addressText: {
    color: colors.text.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  metaText: {
    color: colors.text.secondary,
    marginTop: 2,
  },
  instructionsText: {
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  disclaimerText: {
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
  actionSection: {
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
