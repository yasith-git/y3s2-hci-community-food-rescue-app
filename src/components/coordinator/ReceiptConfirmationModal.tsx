/**
 * Receipt Confirmation Modal for Coordinators
 * Allows coordinators to acknowledge physical food delivery, verify quantity, and finalize rescue completion.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  GlassCard,
  GlassButton,
  GlassHeader,
  PrimaryTextInput,
} from '../ui';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { haptic } from '../../design-system/haptics';
import { Donation } from '../../types/donation';
import { RescueAssignment } from '../../types/rescue';

interface ReceiptConfirmationModalProps {
  visible: boolean;
  donation: Donation | null;
  assignment?: RescueAssignment | null;
  onClose: () => void;
  onConfirm: (donationId: string, quantityReceived: number, notes?: string) => Promise<void>;
  onReportIssue: (donation: Donation) => void;
}

export const ReceiptConfirmationModal: React.FC<ReceiptConfirmationModalProps> = ({
  visible,
  donation,
  assignment,
  onClose,
  onConfirm,
  onReportIssue,
}) => {
  if (!donation) return null;

  const [quantityReceived, setQuantityReceived] = useState(
    donation.food.quantity.toString()
  );
  const [notes, setNotes] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const expectedQuantity = donation.food.quantity;
  const parsedQty = parseFloat(quantityReceived) || expectedQuantity;
  const hasMismatch = parsedQty !== expectedQuantity;

  const handleComplete = async () => {
    if (hasMismatch) {
      Alert.alert(
        'Quantity Discrepancy Detected',
        `Expected ${expectedQuantity} ${donation.food.unit} but received ${parsedQty} ${donation.food.unit}. Would you like to report an issue or proceed with acknowledgement?`,
        [
          { text: 'Report Issue', onPress: () => onReportIssue(donation), style: 'destructive' },
          {
            text: 'Proceed Anyway',
            onPress: async () => {
              await performConfirmation();
            },
          },
        ]
      );
      return;
    }

    await performConfirmation();
  };

  const performConfirmation = async () => {
    setIsConfirming(true);
    haptic.selection();

    try {
      await onConfirm(donation.id, parsedQty, notes.trim());
      haptic.success();
      onClose();
      Alert.alert(
        'Rescue Completed 🎉',
        `Successfully acknowledged receipt of ${parsedQty} ${donation.food.unit} of ${donation.food.name}. The donor and volunteer have been notified.`
      );
    } catch (error: any) {
      console.warn('[ReceiptConfirmationModal] Error:', error);
      haptic.warning();
      Alert.alert('Acknowledgement Failed', error?.message || 'Could not complete receipt.');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        <GlassHeader
          title="Confirm Food Received?"
          subtitle="Community Authority Handover"
          onBack={onClose}
        />

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Card */}
          <GlassCard variant="elevated" style={styles.card}>
            <View style={styles.foodRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="cube-outline" size={28} color={colors.brand.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.headingSmall, styles.foodName]}>{donation.food.name}</Text>
                <Text style={[typography.caption, styles.metaText]}>
                  Quantity: {expectedQuantity} {donation.food.unit}
                </Text>
                <Text style={[typography.caption, styles.metaText]}>
                  Collection Center: {donation.communityPointName || 'Collection Center'}
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Quantity Handover Verification */}
          <GlassCard variant="standard" style={styles.card}>
            <Text style={[typography.labelLarge, styles.sectionTitle]}>
              Verify Received Quantity
            </Text>

            <PrimaryTextInput
              label={`Actual Quantity Received (${donation.food.unit})`}
              value={quantityReceived}
              onChangeText={setQuantityReceived}
              keyboardType="numeric"
              leftIcon="layers-outline"
            />

            {hasMismatch && (
              <View style={styles.mismatchNotice}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.status.warning} />
                <Text style={[typography.caption, styles.mismatchText]}>
                  Quantity differs from expected ({expectedQuantity} vs {parsedQty}).
                </Text>
              </View>
            )}

            <PrimaryTextInput
              label="Handover Notes (Optional)"
              placeholder="e.g. All packs received in good condition."
              value={notes}
              onChangeText={setNotes}
              leftIcon="document-text-outline"
            />
          </GlassCard>

          {/* Privacy & Trust Notice */}
          <View style={styles.trustCard}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.brand.primary} />
            <Text style={[typography.caption, styles.trustText]}>
              Confirm that the food has been handed over at this collection center. This completes the food rescue in real-time.
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.footer}>
            <GlassButton
              title="Confirm Received"
              variant="primary"
              icon="checkmark-done"
              loading={isConfirming}
              onPress={handleComplete}
            />

            <GlassButton
              title="Cancel"
              variant="tertiary"
              onPress={onClose}
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
    gap: spacing.sm,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodName: {
    color: colors.text.primary,
  },
  metaText: {
    color: colors.text.secondary,
    marginTop: 2,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  mismatchNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  mismatchText: {
    color: '#92400E',
    fontWeight: '600',
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.surface.secondary,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.md,
  },
  trustText: {
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
