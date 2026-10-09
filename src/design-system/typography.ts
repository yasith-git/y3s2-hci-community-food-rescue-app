/**
 * Typography System
 * Community Food Rescue App - Shared Design Tokens
 */

import { TextStyle, Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography: Record<string, TextStyle> = {
  // Display
  displayLarge: {
    fontFamily,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  displayMedium: {
    fontFamily,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.4,
  },

  // Headings
  headingLarge: {
    fontFamily,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headingMedium: {
    fontFamily,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  headingSmall: {
    fontFamily,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.1,
  },

  // Titles
  titleLarge: {
    fontFamily,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '600',
  },
  titleMedium: {
    fontFamily,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  titleSmall: {
    fontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },

  // Body
  bodyLarge: {
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyMedium: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  bodySmall: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },

  // Labels
  labelLarge: {
    fontFamily,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  labelSmall: {
    fontFamily,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // Caption
  caption: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
};

export type TypographyTokens = typeof typography;
export type TypographyVariant = keyof typeof typography;
