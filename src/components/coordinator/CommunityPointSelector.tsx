/**
 * Community Point Selector Component
 * Enables coordinators to select a destination hub during the reservation workflow.
 */

import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { GlassButton, EmptyState } from '../ui';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { CommunityPoint } from '../../types/coordinator';
import { CommunityPointCard } from './CommunityPointCard';

interface CommunityPointSelectorProps {
  points: CommunityPoint[];
  selectedPointId: string | null;
  onSelectPoint: (point: CommunityPoint) => void;
  onAddNewPoint: () => void;
}

export const CommunityPointSelector: React.FC<CommunityPointSelectorProps> = ({
  points,
  selectedPointId,
  onSelectPoint,
  onAddNewPoint,
}) => {
  const activePoints = points.filter((p) => p.isActive);

  if (activePoints.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          icon="business-outline"
          title="No Active Collection Points"
          description="You need at least one active community drop-off hub before reserving food donations."
          primaryActionTitle="Create Collection Hub"
          onPrimaryAction={onAddNewPoint}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[typography.labelLarge, styles.heading]}>
          Select Delivery Destination Hub
        </Text>
        <GlassButton
          title="+ Add Hub"
          variant="tertiary"
          size="small"
          onPress={onAddNewPoint}
        />
      </View>

      <ScrollView style={styles.list} nestedScrollEnabled={true}>
        {activePoints.map((point) => (
          <CommunityPointCard
            key={point.id}
            point={point}
            selectable={true}
            isSelected={selectedPointId === point.id}
            onSelect={onSelectPoint}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  heading: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  list: {
    maxHeight: 280,
  },
  emptyContainer: {
    padding: spacing.md,
  },
});
