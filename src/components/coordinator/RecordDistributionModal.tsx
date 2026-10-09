/**
 * Beneficiary Distribution Recording Modal
 * Allows verified coordinators to record group-level distribution after food is acknowledged.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  GlassCard,
  GlassButton,
  PrimaryTextInput,
  GlassChip,
  LoadingOverlay,
} from '../ui';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { haptic } from '../../design-system/haptics';
import { Donation } from '../../types/donation';
import { RecipientGroup } from '../../types/coordinator';
import { recordBeneficiaryDistribution } from '../../services/distribution/distribution.service';

const RECIPIENT_GROUPS: RecipientGroup[] = [
  'Families',
  'Children',
  'Elderly People',
  'Community Shelter',
  'Students',
  'Low-Income Households',
  'Emergency Relief Group',
  'Other',
];

interface RecordDistributionModalProps {
  visible: boolean;
  donation: Donation | null;
  onClose: () => void;
  onSuccess: (distRef: string, isComplete: boolean) => void;
}

export const RecordDistributionModal: React.FC<RecordDistributionModalProps> = ({
  visible,
  donation,
  onClose,
  onSuccess,
}) => {
  if (!donation) return null;

  const [selectedGroup, setSelectedGroup] = useState<RecipientGroup>('Families');
  const [peopleServed, setPeopleServed] = useState('25');
  const [quantityDistributed, setQuantityDistributed] = useState(String(donation.food.quantity));
  const [location, setLocation] = useState(donation.communityPointAddress || donation.pickup.address);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    const people = parseInt(peopleServed, 10);
    const qty = parseFloat(quantityDistributed);

    if (isNaN(people) || people <= 0) {
      setError('Number of people served must be greater than zero.');
      return;
    }

    if (isNaN(qty) || qty <= 0) {
      setError('Distributed quantity must be greater than zero.');
      return;
    }

    if (qty > donation.food.quantity) {
      setError(`Distributed quantity cannot exceed received quantity (${donation.food.quantity} ${donation.food.unit}).`);
      return;
    }

    if (!location.trim()) {
      setError('Please provide the distribution location.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await recordBeneficiaryDistribution({
        donationId: donation.id,
        recipientGroup: selectedGroup,
        peopleServed: people,
        quantityDistributed: qty,
        unit: donation.food.unit,
        distributionLocation: location.trim(),
        notes: notes.trim() || undefined,
      });

      haptic.success();
      Alert.alert(
        'Distribution Logged! 🎉',
        `Reference ${res.distributionReference} recorded.\n${res.isCompleted ? 'All items accounted for — rescue is now COMPLETED!' : 'Partial distribution recorded.'}`,
        [{ text: 'OK', onPress: () => onSuccess(res.distributionReference, res.isCompleted) }]
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to record distribution.');
      haptic.error();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <LoadingOverlay visible={isSubmitting} message="Recording distribution record..." />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={[typography.headingSmall, styles.title]}>Record Beneficiary Distribution</Text>
              <Text style={[typography.caption, styles.subtitle]}>
                {donation.food.name} • {donation.food.quantity} {donation.food.unit}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={colors.status.error} />
                <Text style={[typography.bodySmall, styles.errorText]}>{error}</Text>
              </View>
            )}

            {/* Recipient Group Selection */}
            <Text style={[typography.labelMedium, styles.fieldLabel]}>Beneficiary Group</Text>
            <View style={styles.chipGrid}>
              {RECIPIENT_GROUPS.map((group) => (
                <GlassChip
                  key={group}
                  label={group}
                  selected={selectedGroup === group}
                  onPress={() => {
                    haptic.selection();
                    setSelectedGroup(group);
                  }}
                />
              ))}
            </View>

            {/* People Served */}
            <PrimaryTextInput
              label="Estimated People Served"
              placeholder="e.g. 25"
              value={peopleServed}
              onChangeText={setPeopleServed}
              keyboardType="number-pad"
              leftIcon="people-outline"
              required
            />

            {/* Quantity Distributed */}
            <PrimaryTextInput
              label={`Quantity Distributed (${donation.food.unit})`}
              placeholder={`Max ${donation.food.quantity}`}
              value={quantityDistributed}
              onChangeText={setQuantityDistributed}
              keyboardType="decimal-pad"
              leftIcon="cube-outline"
              required
            />

            {/* Distribution Location */}
            <PrimaryTextInput
              label="Distribution Location / Hub Area"
              placeholder="e.g. Community Center Hall, Colombo"
              value={location}
              onChangeText={setLocation}
              leftIcon="location-outline"
              required
            />

            {/* Optional Notes */}
            <PrimaryTextInput
              label="Distribution Notes (Optional)"
              placeholder="e.g. Distributed during evening meal support."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />

            {/* Privacy Safeguard Callout */}
            <GlassCard variant="standard" style={styles.privacyCallout}>
              <Ionicons name="lock-closed" size={18} color={colors.brand.primary} />
              <Text style={[typography.caption, styles.privacyText]}>
                Privacy Assurance: No beneficiary names, photos, or personal identities are collected or stored.
              </Text>
            </GlassCard>
          </ScrollView>

          {/* Action Row */}
          <View style={styles.footerRow}>
            <View style={styles.footerBtnHalf}>
              <GlassButton title="Cancel" variant="secondary" onPress={onClose} />
            </View>
            <View style={styles.footerBtnHalf}>
              <GlassButton title="Log Distribution" variant="primary" onPress={handleSubmit} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.text.secondary,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  scrollBody: {
    paddingBottom: spacing.md,
  },
  fieldLabel: {
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FEE2E2',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.status.error,
    flex: 1,
  },
  privacyCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  privacyText: {
    color: colors.text.secondary,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
  },
  footerBtnHalf: {
    flex: 1,
  },
});
