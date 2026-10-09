/**
 * Status Presentation Mapper
 * Maps DonationStatus into coherent user-facing labels, icons, and colors
 */

import { Ionicons } from '@expo/vector-icons';
import { DonationStatus } from '../../types/donation';
import { colors } from '../../design-system/colors';

export interface StatusVisualConfig {
  label: string;
  sublabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  borderColor: string;
  badgeStatus: any;
}

export function getDonationStatusConfig(status: DonationStatus): StatusVisualConfig {
  switch (status) {
    case 'DRAFT':
      return {
        label: 'Draft',
        sublabel: 'Not yet published to the rescue network',
        icon: 'create-outline',
        color: colors.text.muted,
        bg: colors.surface.subtle,
        borderColor: colors.surface.borderStrong,
        badgeStatus: 'cancelled',
      };
    case 'PUBLISHED':
      return {
        label: 'Available',
        sublabel: 'Awaiting volunteer or coordinator match',
        icon: 'checkmark-circle-outline',
        color: colors.status.success,
        bg: colors.status.successBg,
        borderColor: colors.status.successBorder,
        badgeStatus: 'available',
      };
    case 'RESERVED':
      return {
        label: 'Reserved',
        sublabel: 'Matched with local community pantry',
        icon: 'time-outline',
        color: colors.status.warning,
        bg: colors.status.warningBg,
        borderColor: colors.status.warningBorder,
        badgeStatus: 'reserved',
      };
    case 'VOLUNTEER_ASSIGNED':
      return {
        label: 'Volunteer Assigned',
        sublabel: 'Volunteer courier is preparing for pickup',
        icon: 'person-outline',
        color: colors.status.info,
        bg: colors.status.infoBg,
        borderColor: colors.status.infoBorder,
        badgeStatus: 'assigned',
      };
    case 'PICKUP_EN_ROUTE':
      return {
        label: 'Volunteer Approaching',
        sublabel: 'Volunteer is en route to your pickup location',
        icon: 'navigate-outline',
        color: colors.brand.primary,
        bg: colors.brand[100],
        borderColor: 'rgba(35, 132, 113, 0.25)',
        badgeStatus: 'in_transit',
      };
    case 'PICKED_UP':
      return {
        label: 'Food Picked Up',
        sublabel: 'Surplus food collected successfully',
        icon: 'cube-outline',
        color: colors.status.info,
        bg: colors.status.infoBg,
        borderColor: colors.status.infoBorder,
        badgeStatus: 'picked_up',
      };
    case 'DELIVERY_EN_ROUTE':
      return {
        label: 'In Transit',
        sublabel: 'Heading to community distribution point',
        icon: 'bicycle-outline',
        color: colors.brand.primary,
        bg: colors.brand[100],
        borderColor: 'rgba(35, 132, 113, 0.25)',
        badgeStatus: 'in_transit',
      };
    case 'DELIVERED':
      return {
        label: 'Delivered',
        sublabel: 'Awaiting Community Authority confirmation',
        icon: 'location-outline',
        color: colors.status.success,
        bg: colors.status.successBg,
        borderColor: colors.status.successBorder,
        badgeStatus: 'delivered',
      };
    case 'ACKNOWLEDGED':
    case 'COMPLETED':
      return {
        label: 'Completed',
        sublabel: 'Donation receipt verified and logged',
        icon: 'shield-checkmark-outline',
        color: colors.status.success,
        bg: colors.status.successBg,
        borderColor: colors.status.successBorder,
        badgeStatus: 'completed',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        sublabel: 'Withdrawn by donor or system',
        icon: 'close-circle-outline',
        color: colors.text.muted,
        bg: colors.surface.subtle,
        borderColor: colors.surface.borderStrong,
        badgeStatus: 'cancelled',
      };
    case 'EXPIRED':
      return {
        label: 'Expired',
        sublabel: 'Passed pickup deadline without collection',
        icon: 'timer-outline',
        color: colors.status.error,
        bg: colors.status.errorBg,
        borderColor: colors.status.errorBorder,
        badgeStatus: 'expired',
      };
    case 'ISSUE_REPORTED':
      return {
        label: 'Issue Reported',
        sublabel: 'Under review by coordinator',
        icon: 'warning-outline',
        color: colors.status.error,
        bg: colors.status.errorBg,
        borderColor: colors.status.errorBorder,
        badgeStatus: 'issue_reported',
      };
    default:
      return {
        label: 'Available',
        sublabel: 'Awaiting rescue',
        icon: 'checkmark-circle-outline',
        color: colors.status.success,
        bg: colors.status.successBg,
        borderColor: colors.status.successBorder,
        badgeStatus: 'available',
      };
  }
}
