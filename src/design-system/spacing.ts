/**
 * Spacing Scale System
 * Community Food Rescue App - Shared Design Tokens
 */

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,

  // Screen level standard paddings
  screenHorizontal: 20,
  screenVertical: 16,
  cardPadding: 16,
  cardPaddingCompact: 12,
  cardPaddingLarge: 20,
} as const;

export type SpacingTokens = typeof spacing;
export type SpacingKey = keyof typeof spacing;
