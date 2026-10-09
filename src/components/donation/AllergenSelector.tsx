/**
 * Allergen Selector Component
 * Multi-select allergen chips with explicit None and Unknown guards
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { GlassChip } from '../ui';
import { Allergen } from '../../types/donation';
import { typography, spacing } from '../../design-system';

interface AllergenSelectorProps {
  selectedAllergens: Allergen[];
  onToggleAllergen: (allergen: Allergen) => void;
}

const ALLERGEN_OPTIONS: Allergen[] = [
  'Gluten/Wheat',
  'Milk/Dairy',
  'Egg',
  'Peanuts',
  'Tree Nuts',
  'Soy',
  'Fish',
  'Shellfish',
  'Sesame',
  'None',
  'Unknown',
];

export const AllergenSelector: React.FC<AllergenSelectorProps> = ({
  selectedAllergens,
  onToggleAllergen,
}) => {
  return (
    <View style={styles.container}>
      <Text style={[typography.labelMedium, styles.label]}>
        Known Allergens <Text style={{ fontWeight: '400' }}>(Select all that apply)</Text>
      </Text>

      <View style={styles.chipsWrap}>
        {ALLERGEN_OPTIONS.map((allergen) => {
          const isSelected = selectedAllergens.includes(allergen);
          return (
            <GlassChip
              key={allergen}
              label={allergen}
              selected={isSelected}
              onPress={() => onToggleAllergen(allergen)}
              icon="alert-circle-outline"
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  label: {
    color: '#173D39',
    marginBottom: spacing.xs,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
