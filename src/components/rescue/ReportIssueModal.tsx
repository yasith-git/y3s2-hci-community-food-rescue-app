/**
 * Rescue Issue Reporting Modal / Sheet
 * Enables volunteers to report quantity mismatches, packaging concerns, or access problems.
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
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { GlassChip } from '../ui/GlassChip';
import { PrimaryTextInput } from '../ui/PrimaryTextInput';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { RescueIssueType } from '../../types/rescue';
import { reportRescueIssue } from '../../services/rescue/rescue.service';
import { haptic } from '../../design-system/haptics';

interface ReportIssueModalProps {
  visible: boolean;
  onClose: () => void;
  donationId: string;
  assignmentId?: string;
  volunteerId: string;
  volunteerName: string;
  expectedQuantity?: number;
  onIssueReported: () => void;
}

const ISSUE_TYPES: Array<{ key: RescueIssueType; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'QUANTITY_MISMATCH', label: 'Quantity Mismatch', icon: 'calculator' },
  { key: 'PACKAGING_CONCERN', label: 'Packaging Concern', icon: 'cube' },
  { key: 'DONOR_UNAVAILABLE', label: 'Donor Unavailable', icon: 'person' },
  { key: 'PICKUP_LOCATION_PROBLEM', label: 'Location Issue', icon: 'location' },
  { key: 'FOOD_INFORMATION_MISMATCH', label: 'Food Details Mismatch', icon: 'fast-food' },
  { key: 'OTHER', label: 'Other Issue', icon: 'help-circle' },
];

export function ReportIssueModal({
  visible,
  onClose,
  donationId,
  assignmentId,
  volunteerId,
  volunteerName,
  expectedQuantity,
  onIssueReported,
}: ReportIssueModalProps) {
  const [selectedType, setSelectedType] = useState<RescueIssueType>('QUANTITY_MISMATCH');
  const [actualQuantityText, setActualQuantityText] = useState(expectedQuantity ? String(expectedQuantity) : '');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      haptic.warning();
      Alert.alert('Details Required', 'Please provide a short note describing the situation.');
      return;
    }

    setIsSubmitting(true);
    haptic.selection();

    try {
      const parsedActualQty = actualQuantityText ? Number(actualQuantityText) : undefined;

      await reportRescueIssue(
        donationId,
        assignmentId,
        volunteerId,
        volunteerName,
        selectedType,
        description.trim(),
        expectedQuantity,
        parsedActualQty
      );

      haptic.success();
      Alert.alert(
        'Issue Reported',
        'Your operational report has been logged for coordinator review. Our team will assist with resolution.',
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
              onIssueReported();
            },
          },
        ]
      );
    } catch (error) {
      console.warn('[ReportIssue] Error:', error);
      haptic.warning();
      Alert.alert('Submission Error', 'Failed to submit issue report. Please check your connection and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.dismissOverlay} activeOpacity={1} onPress={onClose} />

        <GlassCard variant="elevated" style={styles.sheet}>
          <View style={styles.handleBar} />

          <View style={styles.header}>
            <Text style={[typography.headingSmall, styles.title]}>Report Rescue Problem</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={colors.text.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
            <Text style={[typography.labelMedium, styles.sectionTitle]}>Issue Type</Text>
            <View style={styles.chipGrid}>
              {ISSUE_TYPES.map((item) => {
                const isSelected = selectedType === item.key;
                return (
                  <GlassChip
                    key={item.key}
                    label={item.label}
                    selected={isSelected}
                    onPress={() => {
                      haptic.selection();
                      setSelectedType(item.key);
                    }}
                  />
                );
              })}
            </View>

            {selectedType === 'QUANTITY_MISMATCH' && (
              <View style={styles.quantitySection}>
                <Text style={[typography.bodySmall, styles.qtyNote]}>
                  Expected Quantity: <Text style={{ fontWeight: '700' }}>{expectedQuantity || 0}</Text>
                </Text>
                <PrimaryTextInput
                  label="Actual Quantity Count"
                  placeholder="e.g. 15"
                  value={actualQuantityText}
                  onChangeText={setActualQuantityText}
                  keyboardType="numeric"
                />
              </View>
            )}

            <PrimaryTextInput
              label="Observation / Situation Notes"
              placeholder="Describe what happened or why food cannot be collected..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              required
            />
          </ScrollView>

          <View style={styles.footer}>
            <GlassButton
              title="Submit Report to Coordinator"
              variant="danger"
              icon="alert-circle"
              loading={isSubmitting}
              onPress={handleSubmit}
            />
          </View>
        </GlassCard>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxHeight: '85%',
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text.primary,
  },
  scrollArea: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  quantitySection: {
    backgroundColor: colors.surface.secondary,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  qtyNote: {
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  footer: {
    marginTop: spacing.xs,
  },
});
