/**
 * Withdrawal Modal Component
 * Allows donors to withdraw active listings with structured cancellation reasons
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  GlassSurface,
  GlassButton,
  GlassIconButton,
  AnimatedPressable,
} from '../ui';
import { colors, typography, spacing, radius } from '../../design-system';
import { CancellationReason } from '../../types/donation';

interface WithdrawalModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmWithdraw: (reason: CancellationReason) => Promise<void>;
}

const REASONS: CancellationReason[] = [
  'Food is no longer available',
  'Pickup time changed',
  'Incorrect information entered',
  'Unexpected issue / Emergency',
  'Other',
];

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  visible,
  onClose,
  onConfirmWithdraw,
}) => {
  const [selectedReason, setSelectedReason] = useState<CancellationReason>(
    'Food is no longer available'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirmWithdraw(selectedReason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <GlassSurface variant="modal" style={styles.dialog}>
          <View style={styles.headerRow}>
            <View style={styles.warningCircle}>
              <Ionicons name="warning-outline" size={24} color={colors.status.error} />
            </View>
            <View style={styles.titleColumn}>
              <Text style={[typography.titleLarge, styles.title]}>Withdraw Donation?</Text>
              <Text style={[typography.caption, styles.subtitle]}>
                This will remove the surplus food from the rescue network.
              </Text>
            </View>
            <GlassIconButton
              icon="close"
              size="small"
              variant="subtle"
              onPress={onClose}
              accessibilityLabel="Close dialog"
            />
          </View>

          <Text style={[typography.labelMedium, styles.reasonPrompt]}>
            Please select a reason:
          </Text>

          <ScrollView style={styles.reasonsList}>
            {REASONS.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <AnimatedPressable
                  key={reason}
                  onPress={() => setSelectedReason(reason)}
                  hapticType="light"
                  style={[
                    styles.reasonItem,
                    isSelected && styles.selectedReasonItem,
                  ]}
                >
                  <View style={[styles.radioCircle, isSelected && styles.selectedRadio]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                  <Text
                    style={[
                      typography.bodyMedium,
                      styles.reasonText,
                      isSelected && styles.selectedReasonText,
                    ]}
                  >
                    {reason}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>

          <View style={styles.buttonRow}>
            <GlassButton
              title="Keep Donation"
              variant="secondary"
              size="medium"
              onPress={onClose}
              style={styles.flexBtn}
            />
            <View style={{ width: spacing.sm }} />
            <GlassButton
              title="Withdraw"
              variant="danger"
              size="medium"
              loading={isSubmitting}
              onPress={handleConfirm}
              style={styles.flexBtn}
            />
          </View>
        </GlassSurface>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 61, 53, 0.40)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenHorizontal,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    padding: spacing.lg,
    borderRadius: radius['2xl'],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  warningCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    backgroundColor: colors.status.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  titleColumn: {
    flex: 1,
  },
  title: {
    color: colors.status.error,
  },
  subtitle: {
    color: colors.text.muted,
    marginTop: 2,
  },
  reasonPrompt: {
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  reasonsList: {
    maxHeight: 200,
    marginVertical: spacing.xs,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  selectedReasonItem: {
    backgroundColor: 'rgba(35, 132, 113, 0.1)',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.text.disabled,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  selectedRadio: {
    borderColor: colors.brand.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.primary,
  },
  reasonText: {
    color: colors.text.secondary,
    flex: 1,
  },
  selectedReasonText: {
    color: colors.brand[900],
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  flexBtn: {
    flex: 1,
  },
});
