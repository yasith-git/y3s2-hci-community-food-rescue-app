/**
 * MapListToggle Component
 * Smooth segmented control for switching between Map View and List View.
 */

import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassSurface } from '../ui/GlassSurface';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { radius } from '../../design-system/radius';
import { spacing } from '../../design-system/spacing';
import { haptic } from '../../design-system/haptics';
import { DiscoveryViewMode } from '../../types/route';

interface MapListToggleProps {
  mode: DiscoveryViewMode;
  onChange: (mode: DiscoveryViewMode) => void;
}

export function MapListToggle({ mode, onChange }: MapListToggleProps) {
  return (
    <GlassSurface variant="subtle" style={styles.container}>
      <TouchableOpacity
        style={[styles.segment, mode === 'MAP' && styles.activeSegment]}
        onPress={() => {
          if (mode !== 'MAP') {
            haptic.selection();
            onChange('MAP');
          }
        }}
        activeOpacity={0.8}
      >
        <Ionicons
          name="map"
          size={16}
          color={mode === 'MAP' ? '#FFFFFF' : colors.text.secondary}
        />
        <Text style={[typography.labelSmall, mode === 'MAP' ? styles.activeText : styles.inactiveText]}>
          Map View
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.segment, mode === 'LIST' && styles.activeSegment]}
        onPress={() => {
          if (mode !== 'LIST') {
            haptic.selection();
            onChange('LIST');
          }
        }}
        activeOpacity={0.8}
      >
        <Ionicons
          name="list"
          size={16}
          color={mode === 'LIST' ? '#FFFFFF' : colors.text.secondary}
        />
        <Text style={[typography.labelSmall, mode === 'LIST' ? styles.activeText : styles.inactiveText]}>
          List View
        </Text>
      </TouchableOpacity>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    padding: 3,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
  },
  activeSegment: {
    backgroundColor: colors.brand.primary,
  },
  activeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inactiveText: {
    color: colors.text.secondary,
    fontWeight: '600',
  },
});
