/**
 * RescueAIDonorAssistCard Component
 * Embeds inside Smart Donation Step 1 to suggest title, category, unit, and description from food photos.
 */

import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { DonationPhotoAnalysisResult } from '../../types/rescue-ai';

export interface RescueAIDonorAssistCardProps {
  hasPhoto: boolean;
  isAnalyzing: boolean;
  analysisResult: DonationPhotoAnalysisResult | null;
  errorMessage: string | null;
  onAnalyze: () => void;
  onApplyAll: () => void;
  onApplyField: (field: 'name' | 'category' | 'unit' | 'description', value: any) => void;
  onDismiss: () => void;
}

export const RescueAIDonorAssistCard: React.FC<RescueAIDonorAssistCardProps> = ({
  hasPhoto,
  isAnalyzing,
  analysisResult,
  errorMessage,
  onAnalyze,
  onApplyAll,
  onApplyField,
  onDismiss,
}) => {
  if (!hasPhoto) return null;

  const hasConcreteSuggestions = Boolean(
    analysisResult?.suggestedName ||
    analysisResult?.suggestedCategory ||
    analysisResult?.suggestedUnit ||
    analysisResult?.suggestedDescription
  );

  return (
    <GlassCard variant="elevated" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="sparkles" size={18} color={colors.brand.primary} />
          <Text style={[typography.titleSmall, styles.title]}>RescueAI Assist</Text>
        </View>

        {analysisResult && (
          <GlassButton
            title="Dismiss"
            variant="tertiary"
            size="small"
            onPress={onDismiss}
          />
        )}
      </View>

      {!analysisResult && !isAnalyzing && !errorMessage && (
        <View style={styles.promptBody}>
          <Text style={[typography.bodySmall, styles.promptText]}>
            Save time by letting RescueAI suggest food details from your photo.
          </Text>
          <Text style={[typography.caption, styles.guardrailNotice]}>
            Suggestions must be reviewed before publishing.
          </Text>
          <GlassButton
            title="Analyze Photo"
            variant="secondary"
            size="small"
            icon="sparkles"
            onPress={onAnalyze}
            style={styles.actionBtn}
          />
        </View>
      )}

      {isAnalyzing && (
        <View style={styles.loadingBody}>
          <ActivityIndicator size="small" color={colors.brand.primary} />
          <Text style={[typography.bodySmall, styles.loadingText]}>
            RescueAI analyzing photo details...
          </Text>
        </View>
      )}

      {errorMessage && !isAnalyzing && (
        <View style={styles.errorBody}>
          <Ionicons name="information-circle-outline" size={16} color={colors.text.muted} />
          <Text style={[typography.bodySmall, styles.errorText]}>
            {errorMessage}
          </Text>
          <GlassButton
            title="Try Again"
            variant="tertiary"
            size="small"
            onPress={onAnalyze}
          />
        </View>
      )}

      {analysisResult && !isAnalyzing && (
        <View style={styles.resultBody}>
          {hasConcreteSuggestions ? (
            <>
              <Text style={[typography.caption, styles.resultHeader]}>SUGGESTED DETAILS</Text>

              {analysisResult.suggestedName && (
                <View style={styles.suggestionRow}>
                  <View style={styles.suggestionTextCol}>
                    <Text style={[typography.caption, styles.fieldLabel]}>Food Name</Text>
                    <Text style={[typography.bodySmall, styles.fieldValue]}>{analysisResult.suggestedName}</Text>
                  </View>
                  <GlassButton
                    title="Use"
                    variant="tertiary"
                    size="small"
                    onPress={() => onApplyField('name', analysisResult.suggestedName)}
                  />
                </View>
              )}

              {analysisResult.suggestedCategory && (
                <View style={styles.suggestionRow}>
                  <View style={styles.suggestionTextCol}>
                    <Text style={[typography.caption, styles.fieldLabel]}>Category</Text>
                    <Text style={[typography.bodySmall, styles.fieldValue]}>{analysisResult.suggestedCategory}</Text>
                  </View>
                  <GlassButton
                    title="Use"
                    variant="tertiary"
                    size="small"
                    onPress={() => onApplyField('category', analysisResult.suggestedCategory)}
                  />
                </View>
              )}

              {analysisResult.suggestedUnit && (
                <View style={styles.suggestionRow}>
                  <View style={styles.suggestionTextCol}>
                    <Text style={[typography.caption, styles.fieldLabel]}>Unit</Text>
                    <Text style={[typography.bodySmall, styles.fieldValue]}>{analysisResult.suggestedUnit}</Text>
                  </View>
                  <GlassButton
                    title="Use"
                    variant="tertiary"
                    size="small"
                    onPress={() => onApplyField('unit', analysisResult.suggestedUnit)}
                  />
                </View>
              )}

              <View style={styles.applyAllRow}>
                <GlassButton
                  title="Apply All Suggestions"
                  variant="primary"
                  size="small"
                  icon="checkmark-done"
                  onPress={onApplyAll}
                  fullWidth
                />
              </View>
            </>
          ) : (
            <View style={styles.unconfiguredNoticeBox}>
              <Ionicons name="information-circle-outline" size={18} color={colors.brand.primary} />
              <Text style={[typography.bodySmall, styles.unconfiguredNoticeText]}>
                {analysisResult.confidenceNotice ||
                  'External AI image analysis is not configured on this server. You can continue entering donation details manually below.'}
              </Text>
            </View>
          )}
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.sm,
    padding: spacing.md,
    borderColor: 'rgba(46, 125, 50, 0.25)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: colors.brand.dark,
    fontWeight: '700',
  },
  promptBody: {
    gap: 6,
  },
  promptText: {
    color: colors.text.secondary,
    lineHeight: 18,
  },
  guardrailNotice: {
    color: colors.text.muted,
    fontStyle: 'italic',
  },
  actionBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  loadingBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.xs,
  },
  loadingText: {
    color: colors.text.muted,
  },
  errorBody: {
    gap: 4,
  },
  errorText: {
    color: colors.text.muted,
    lineHeight: 18,
  },
  resultBody: {
    gap: spacing.xs,
    marginTop: 4,
  },
  resultHeader: {
    color: colors.brand.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.divider,
  },
  suggestionTextCol: {
    flex: 1,
  },
  fieldLabel: {
    color: colors.text.muted,
  },
  fieldValue: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  applyAllRow: {
    marginTop: spacing.xs,
  },
  unconfiguredNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(35, 132, 113, 0.08)',
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: 4,
  },
  unconfiguredNoticeText: {
    color: colors.brand[900],
    flex: 1,
    lineHeight: 18,
  },
});
