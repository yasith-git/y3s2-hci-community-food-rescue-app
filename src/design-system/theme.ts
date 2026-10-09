/**
 * Consolidated Design System Theme
 * Community Food Rescue App - Shared Design Tokens
 */

import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';
import { glass } from './glass';
import { motion } from './motion';
import { haptic } from './haptics';

export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  glass,
  motion,
  haptic,
} as const;

export type Theme = typeof theme;
