/**
 * RescueAIInsightSheet Component
 * Modal sheet providing transparent, explainable breakdown of AI priority and logistics matching.
 */

import React from 'react';
import { StyleSheet, View, Text, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { RescueAIBadge } from './RescueAIBadge';
import { RescueAIReasonList } from './RescueAIReasonList';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { ExplainableInsight } from '../../types/rescue-ai';

export interface RescueAIInsightSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  badgeLabel?: string;
  badgeLevel?: string;
  insight: ExplainableInsight | null;
}

export const RescueAIInsightSheet: React.FC<RescueAIInsightSheetProps> = ({
  visible,
  onClose,
  title = 'RescueAI Analysis',
  badgeLabel,
  badgeLevel,
  insight,
}) => {
  if (!insight) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <GlassCard variant="elevated" style={styles.card}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Ionicons name="sparkles" size={20} color={colors.brand.primary} />
                <Text style={[typography.titleMedium, styles.sheetTitle]}>{title}</Text>
              </View>

              {badgeLabel && (
                <RescueAIBadge label={badgeLabel} level={badgeLevel} size="small" />
              )}
            </View>

            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
              <Text style={[typography.bodyMedium, styles.summaryText]}>
                {insight.summary}
              </Text>

              <View style={styles.section}>
                <Text style={[typography.caption, styles.sectionTitle]}>WHY THIS RECOMMENDATION</Text>
                <RescueAIReasonList
                  reasons={insight.reasons}
                  warnings={insight.warnings}
                  attention={insight.attention}
                  maxItems={8}
                />
              </View>

              <View style={styles.metaRow}>
                <Text style={[typography.caption, styles.metaText]}>
                  Engine: {insight.engineVersion}
                </Text>
                <Text style={[typography.caption, styles.metaText]}>
                  Updated: Just now
                </Text>
              </View>
            </ScrollView>

            <GlassButton
              title="Got It"
              variant="primary"
              size="medium"
              onPress={onClose}
              style={styles.closeBtn}
              fullWidth
            />
          </GlassCard>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    padding: spacing.md,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius['2xl'],
    maxHeight: 520,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.divider,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sheetTitle: {
    color: colors.brand.dark,
    fontWeight: '700',
  },
  scrollArea: {
    marginVertical: spacing.xs,
  },
  summaryText: {
    color: colors.text.primary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  section: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text.muted,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surface.divider,
  },
  metaText: {
    color: colors.text.disabled,
  },
  closeBtn: {
    marginTop: spacing.sm,
  },
});
