/**
 * Clarification Request Card
 * Displays the question status, category, question text, and donor's answer.
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GlassBadge } from '../ui';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { ClarificationRequest } from '../../types/coordinator';
import { formatRelativeTime } from '../../utils/dateTime';

interface ClarificationCardProps {
  clarification: ClarificationRequest;
}

export const ClarificationCard: React.FC<ClarificationCardProps> = ({ clarification }) => {
  const isResponded = clarification.status === 'RESPONDED';

  return (
    <GlassCard variant="standard" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.categoryRow}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.brand.primary} />
          <Text style={[typography.caption, styles.categoryText]}>
            {clarification.category.replace(/_/g, ' ')}
          </Text>
        </View>

        <GlassBadge
          label={isResponded ? 'Responded' : 'Awaiting Donor'}
          variant={isResponded ? 'success' : 'warning'}
          size="small"
        />
      </View>

      <Text style={[typography.labelMedium, styles.donationName]}>
        Donation: {clarification.donationName}
      </Text>

      <View style={styles.questionBox}>
        <Text style={[typography.caption, styles.authorLabel]}>Your Question:</Text>
        <Text style={[typography.bodyMedium, styles.messageText]}>{clarification.message}</Text>
      </View>

      {isResponded && clarification.response ? (
        <View style={styles.responseBox}>
          <View style={styles.responseHeader}>
            <Ionicons name="checkmark-circle" size={16} color={colors.status.success} />
            <Text style={[typography.labelSmall, styles.responseLabel]}>Donor Response:</Text>
          </View>
          <Text style={[typography.bodyMedium, styles.responseText]}>{clarification.response}</Text>
          {clarification.respondedAt && (
            <Text style={[typography.caption, styles.timeText]}>
              Answered {formatRelativeTime(clarification.respondedAt)}
            </Text>
          )}
        </View>
      ) : null}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryText: {
    color: colors.brand.primary,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  donationName: {
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  questionBox: {
    backgroundColor: colors.surface.secondary,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: 2,
  },
  authorLabel: {
    color: colors.text.muted,
    marginBottom: 2,
  },
  messageText: {
    color: colors.text.primary,
  },
  responseBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  responseLabel: {
    color: colors.brand[900],
    fontWeight: '700',
  },
  responseText: {
    color: colors.text.primary,
    marginTop: 2,
  },
  timeText: {
    color: colors.text.muted,
    fontSize: 11,
    marginTop: 4,
  },
});
