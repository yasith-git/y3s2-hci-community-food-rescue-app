/**
 * Issue Resolution Modal
 * Allows coordinator to resolve reported rescue issues with clear audit notes.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { RescueIssue } from '../../types/rescue';

interface IssueResolutionModalProps {
  visible: boolean;
  issue: RescueIssue | null;
  onClose: () => void;
  onResolve: (issueId: string, resolutionNotes: string) => Promise<void>;
}

export const IssueResolutionModal: React.FC<IssueResolutionModalProps> = ({
  visible,
  issue,
  onClose,
  onResolve,
}) => {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  if (!issue) return null;

  const handleSubmit = async () => {
    if (!resolutionNotes.trim()) {
      Alert.alert('Resolution Notes Required', 'Please enter a brief note explaining how this issue was resolved.');
      return;
    }

    setIsResolving(true);
    haptic.selection();

    try {
      await onResolve(issue.id, resolutionNotes.trim());
      haptic.success();
      setResolutionNotes('');
      onClose();
      Alert.alert('Issue Resolved', 'The rescue issue has been marked as resolved.');
    } catch (error: any) {
      console.warn('[IssueResolutionModal] Error:', error);
      haptic.warning();
      Alert.alert('Resolution Error', error?.message || 'Could not resolve issue.');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <GlassHeader
          title="Resolve Issue"
          subtitle={issue.issueType.replace(/_/g, ' ')}
          onBack={onClose}
        />

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Issue Summary */}
          <GlassCard variant="standard" style={styles.card}>
            <Text style={[typography.labelLarge, styles.sectionTitle]}>Issue Report</Text>
            <Text style={[typography.bodyMedium, styles.issueDesc]}>{issue.description}</Text>

            {issue.expectedQuantity !== undefined && issue.actualQuantity !== undefined && (
              <View style={styles.quantityBox}>
                <Text style={[typography.caption, styles.qtyText]}>
                  Expected Quantity: {issue.expectedQuantity} | Actual Quantity: {issue.actualQuantity}
                </Text>
              </View>
            )}
          </GlassCard>

          {/* Resolution Input */}
          <GlassCard variant="standard" style={styles.card}>
            <Text style={[typography.labelLarge, styles.sectionTitle]}>Resolution Notes</Text>
            <PrimaryTextInput
              label="Action Taken / Resolution Explanation"
              placeholder="e.g. Accepted 18 portions as sufficient for today's pantry distribution. Mismatch noted."
              value={resolutionNotes}
              onChangeText={setResolutionNotes}
              multiline={true}
              numberOfLines={4}
              leftIcon="checkmark-circle-outline"
            />
          </GlassCard>

          <View style={styles.footer}>
            <GlassButton
              title="Mark Issue Resolved"
              variant="primary"
              icon="checkmark-done"
              loading={isResolving}
              onPress={handleSubmit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  sectionTitle: {
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  issueDesc: {
    color: colors.text.secondary,
    lineHeight: 20,
  },
  quantityBox: {
    backgroundColor: '#FEF2F2',
    padding: spacing.xs,
    borderRadius: radius.xs,
    marginTop: spacing.xs,
  },
  qtyText: {
    color: '#991B1B',
    fontWeight: '600',
  },
  footer: {
    padding: spacing.md,
    marginTop: spacing.md,
  },
});
