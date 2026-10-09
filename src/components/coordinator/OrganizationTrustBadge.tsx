/**
 * Organization Trust Badge Component
 * Displays verified coordinator status using shared glass design tokens.
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { radius } from '../../design-system/radius';

interface OrganizationTrustBadgeProps {
  organizationName?: string;
  isVerified?: boolean;
}

export const OrganizationTrustBadge: React.FC<OrganizationTrustBadgeProps> = ({
  organizationName,
  isVerified = true,
}) => {
  return (
    <View style={[styles.container, isVerified ? styles.verifiedBg : styles.pendingBg]}>
      <Ionicons
        name={isVerified ? 'shield-checkmark' : 'shield-half-outline'}
        size={14}
        color={isVerified ? colors.brand.primary : colors.status.warning}
      />
      <Text style={[typography.caption, isVerified ? styles.verifiedText : styles.pendingText]}>
        {isVerified ? 'Verified Community Partner' : 'Verification Pending'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  verifiedBg: {
    backgroundColor: colors.brand[50],
    borderWidth: 1,
    borderColor: colors.brand[100],
  },
  pendingBg: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  verifiedText: {
    color: colors.brand[900],
    fontWeight: '700',
  },
  pendingText: {
    color: colors.status.warning,
    fontWeight: '600',
  },
});
