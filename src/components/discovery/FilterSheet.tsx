/**
 * FilterSheet Component
 * Glass bottom sheet for filtering discovery results by mode, categories, and radius.
 */

import React from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../ui/GlassCard';
import { GlassChip } from '../ui/GlassChip';
import { GlassButton } from '../ui/GlassButton';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { haptic } from '../../design-system/haptics';
import { DiscoveryFilterState, DiscoveryFilterOption } from '../../types/route';
import { FoodCategory } from '../../types/donation';

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: DiscoveryFilterState;
  onApplyFilters: (filters: DiscoveryFilterState) => void;
}

const CATEGORIES: Array<FoodCategory | 'All'> = [
  'All',
  'Bakery',
  'Prepared Meals',
  'Rice & Curry',
  'Vegetables',
  'Fruit',
  'Dairy',
  'Packaged Food',
];

const FILTER_MODES: Array<{ key: DiscoveryFilterOption; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'ALL', label: 'All Opportunities', icon: 'apps' },
  { key: 'FITS_ROUTE', label: 'Fits Active Route', icon: 'git-branch' },
  { key: 'NEARBY', label: 'Nearby My Location', icon: 'navigate' },
  { key: 'URGENT', label: 'Pickup Soon (<3h)', icon: 'flame' },
];

export function FilterSheet({
  visible,
  onClose,
  filters,
  onApplyFilters,
}: FilterSheetProps) {
  const [localFilters, setLocalFilters] = React.useState<DiscoveryFilterState>(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters, visible]);

  const handleApply = () => {
    haptic.success();
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    haptic.selection();
    const reset: DiscoveryFilterState = {
      mode: 'ALL',
      selectedCategory: 'All',
      maxDistanceKm: 15,
    };
    setLocalFilters(reset);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissOverlay} activeOpacity={1} onPress={onClose} />

        <GlassCard variant="elevated" style={styles.sheet}>
          <View style={styles.handleBar} />

          <View style={styles.header}>
            <Text style={[typography.headingSmall, styles.title]}>Discovery Filters</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={[typography.labelSmall, styles.resetText]}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Matching Mode */}
            <Text style={[typography.labelMedium, styles.sectionTitle]}>Discovery Mode</Text>
            <View style={styles.chipRow}>
              {FILTER_MODES.map((m) => {
                const isSelected = localFilters.mode === m.key;
                return (
                  <GlassChip
                    key={m.key}
                    label={m.label}
                    selected={isSelected}
                    onPress={() => {
                      haptic.selection();
                      setLocalFilters((prev) => ({ ...prev, mode: m.key }));
                    }}
                  />
                );
              })}
            </View>

            {/* Food Category */}
            <Text style={[typography.labelMedium, styles.sectionTitle]}>Food Category</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((cat) => {
                const isSelected = (localFilters.selectedCategory || 'All') === cat;
                return (
                  <GlassChip
                    key={cat}
                    label={cat}
                    selected={isSelected}
                    onPress={() => {
                      haptic.selection();
                      setLocalFilters((prev) => ({ ...prev, selectedCategory: cat }));
                    }}
                  />
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <GlassButton title="Apply Filters" variant="primary" onPress={handleApply} />
          </View>
        </GlassCard>
      </View>
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
    maxHeight: '75%',
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
  resetText: {
    color: colors.brand.primary,
    fontWeight: '600',
  },
  scrollArea: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontWeight: '600',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  footer: {
    marginTop: spacing.xs,
  },
});
