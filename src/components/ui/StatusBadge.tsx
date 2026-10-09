/**
 * StatusBadge Component
 * Generic status indicator ensuring Accessible Triple-Encoding: (Icon + Text + Color)
 */

import React from 'react';
import { StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { radius } from '../../design-system/radius';

export type StatusType =
  | 'available'
  | 'published'
  | 'draft'
  | 'reserved'
  | 'assigned'
  | 'volunteer_assigned'
  | 'pickup_soon'
  | 'pickup_en_route'
  | 'picked_up'
  | 'in_transit'
  | 'delivery_en_route'
  | 'delivered'
  | 'acknowledged'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'issue_reported'
  | 'custom'
  | string;

export interface StatusConfig {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  borderColor: string;
}

const DEFAULT_STATUS_CONFIG: StatusConfig = {
  label: 'Available',
  icon: 'checkmark-circle-outline',
  color: colors.status.success,
  bg: colors.status.successBg,
  borderColor: colors.status.successBorder,
};

const statusMap: Record<string, StatusConfig> = {
  available: DEFAULT_STATUS_CONFIG,
  published: DEFAULT_STATUS_CONFIG,
  draft: {
    label: 'Draft',
    icon: 'create-outline',
    color: colors.text.muted,
    bg: colors.surface.subtle,
    borderColor: colors.surface.borderStrong,
  },
  reserved: {
    label: 'Reserved',
    icon: 'time-outline',
    color: colors.status.warning,
    bg: colors.status.warningBg,
    borderColor: colors.status.warningBorder,
  },
  assigned: {
    label: 'Assigned',
    icon: 'person-outline',
    color: colors.status.info,
    bg: colors.status.infoBg,
    borderColor: colors.status.infoBorder,
  },
  volunteer_assigned: {
    label: 'Volunteer Assigned',
    icon: 'person-outline',
    color: colors.status.info,
    bg: colors.status.infoBg,
    borderColor: colors.status.infoBorder,
  },
  pickup_soon: {
    label: 'Pickup Soon',
    icon: 'alarm-outline',
    color: colors.status.warning,
    bg: colors.status.warningBg,
    borderColor: colors.status.warningBorder,
  },
  pickup_en_route: {
    label: 'Volunteer Approaching',
    icon: 'navigate-outline',
    color: colors.brand.primary,
    bg: colors.brand[100],
    borderColor: 'rgba(35, 132, 113, 0.25)',
  },
  picked_up: {
    label: 'Picked Up',
    icon: 'cube-outline',
    color: colors.status.info,
    bg: colors.status.infoBg,
    borderColor: colors.status.infoBorder,
  },
  in_transit: {
    label: 'In Transit',
    icon: 'navigate-outline',
    color: colors.brand.primary,
    bg: colors.brand[100],
    borderColor: 'rgba(35, 132, 113, 0.25)',
  },
  delivery_en_route: {
    label: 'In Transit',
    icon: 'bicycle-outline',
    color: colors.brand.primary,
    bg: colors.brand[100],
    borderColor: 'rgba(35, 132, 113, 0.25)',
  },
  delivered: {
    label: 'Delivered',
    icon: 'location-outline',
    color: colors.status.success,
    bg: colors.status.successBg,
    borderColor: colors.status.successBorder,
  },
  acknowledged: {
    label: 'Acknowledged',
    icon: 'shield-checkmark-outline',
    color: colors.status.success,
    bg: colors.status.successBg,
    borderColor: colors.status.successBorder,
  },
  completed: {
    label: 'Completed',
    icon: 'shield-checkmark-outline',
    color: colors.status.success,
    bg: colors.status.successBg,
    borderColor: colors.status.successBorder,
  },
  cancelled: {
    label: 'Cancelled',
    icon: 'close-circle-outline',
    color: colors.text.muted,
    bg: colors.surface.subtle,
    borderColor: colors.surface.borderStrong,
  },
  expired: {
    label: 'Expired',
    icon: 'timer-outline',
    color: colors.status.error,
    bg: colors.status.errorBg,
    borderColor: colors.status.errorBorder,
  },
  issue_reported: {
    label: 'Issue Reported',
    icon: 'warning-outline',
    color: colors.status.error,
    bg: colors.status.errorBg,
    borderColor: colors.status.errorBorder,
  },
};

export interface StatusBadgeProps {
  status?: StatusType;
  customConfig?: StatusConfig;
  size?: 'small' | 'medium';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status = 'available',
  customConfig,
  size = 'small',
  style,
  testID,
}) => {
  const normalizedKey = (status || '').toLowerCase().trim();
  const config =
    customConfig ||
    statusMap[normalizedKey] ||
    DEFAULT_STATUS_CONFIG;

  const isSmall = size === 'small';

  return (
    <View
      testID={testID}
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.borderColor,
          paddingVertical: isSmall ? 3 : 6,
          paddingHorizontal: isSmall ? 8 : 12,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${config.label}`}
    >
      <Ionicons
        name={config.icon}
        size={isSmall ? 13 : 16}
        color={config.color}
        style={styles.icon}
      />
      <Text
        style={[
          isSmall ? typography.labelSmall : typography.labelMedium,
          { color: config.color, fontWeight: '600' },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
});
