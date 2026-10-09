/**
 * Coordinator Rescue Issue Card
 * Displays reported rescue issues, quantity mismatches, and resolution workflow controls.
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GlassBadge, GlassButton } from '../ui';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { RescueIssue } from '../../types/rescue';
import { formatRelativeTime } from '../../utils/dateTime';

interface CoordinatorIssueCardProps {
  issue: RescueIssue;
  onResolve: (issue: RescueIssue) => void;
  onStatusChange?: (issue: RescueIssue, newStatus: 'REVIEWING' | 'RESOLVED') => void;
}

export const CoordinatorIssueCard: React.FC<CoordinatorIssueCardProps> = ({
  issue,
  onResolve,
  onStatusChange,
}) => {
  const isResolved = issue.status === 'RESOLVED' || issue.status === 'CLOSED';
  const isReviewing = issue.status === 'REVIEWING';

  const getStatusBadge = () => {
    switch (issue.status) {
      case 'OPEN':
        return <GlassBadge label="Open Issue" variant="error" size="small" />;
      case 'REVIEWING':
        return <GlassBadge label="In Review" variant="warning" size="small" />;
      case 'RESOLVED':
        return <GlassBadge label="Resolved" variant="success" size="small" />;
      case 'CLOSED':
        return <GlassBadge label="Closed" variant="neutral" size="small" />;
    }
  };

  return (
    <GlassCard variant="standard" style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.typeRow}>
          <Ionicons
            name="alert-circle"
            size={18}
            color={isResolved ? colors.status.success : colors.status.error}
          />
          <Text style={[typography.headingSmall, styles.issueType]}>
            {issue.issueType.replace(/_/g, ' ')}
          </Text>
        </View>

        {getStatusBadge()}
      </View>

      {/* Description */}
      <Text style={[typography.bodyMedium, styles.description]}>
        {issue.description}
      </Text>

      {/* Discrepancy details */}
      {issue.expectedQuantity !== undefined && issue.actualQuantity !== undefined && (
        <View style={styles.mismatchRow}>
          <Text style={[typography.caption, styles.mismatchLabel]}>
            Expected: <Text style={{ fontWeight: '700' }}>{issue.expectedQuantity}</Text> | Actual:{' '}
            <Text style={{ fontWeight: '700', color: colors.status.error }}>{issue.actualQuantity}</Text>
          </Text>
        </View>
      )}

      {/* Reporter Meta */}
      <View style={styles.metaRow}>
        <Ionicons name="person-outline" size={12} color={colors.text.muted} />
        <Text style={[typography.caption, styles.metaText]}>
          Reported by {issue.reporterName} ({issue.reporterRole}) • {formatRelativeTime(issue.createdAt)}
        </Text>
      </View>

      {/* Resolution Notes if present */}
      {issue.resolutionNotes ? (
        <View style={styles.resolutionBox}>
          <View style={styles.resolutionHeader}>
            <Ionicons name="checkmark-circle" size={14} color={colors.status.success} />
            <Text style={[typography.labelSmall, styles.resolutionLabel]}>Resolution Note:</Text>
          </View>
          <Text style={[typography.bodySmall, styles.resolutionText]}>
            {issue.resolutionNotes}
          </Text>
        </View>
      ) : null}

      {/* Actions */}
      {!isResolved && (
        <View style={styles.actionsRow}>
          {issue.status === 'OPEN' && onStatusChange && (
            <GlassButton
              title="Mark Reviewing"
              variant="secondary"
              size="small"
              onPress={() => onStatusChange(issue, 'REVIEWING')}
            />
          )}

          <GlassButton
            title="Resolve Issue"
            variant="primary"
            icon="checkmark-circle-outline"
            size="small"
            onPress={() => onResolve(issue)}
          />
        </View>
      )}
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
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  issueType: {
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  description: {
    color: colors.text.secondary,
    lineHeight: 20,
    marginTop: 2,
  },
  mismatchRow: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  mismatchLabel: {
    color: '#991B1B',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  metaText: {
    color: colors.text.muted,
  },
  resolutionBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  resolutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resolutionLabel: {
    color: colors.brand[900],
    fontWeight: '700',
  },
  resolutionText: {
    color: colors.text.primary,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
  },
});
