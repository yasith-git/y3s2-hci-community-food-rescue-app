/**
 * Motion & Animation Tokens
 * Community Food Rescue App - Shared Design Tokens
 */

import { Easing } from 'react-native-reanimated';

export const motion = {
  // Durations
  duration: {
    instant: 0,
    fast: 150,
    normal: 260,
    slow: 380,
    stagger: 60,
  },

  // Spring configurations
  spring: {
    gentle: {
      damping: 24,
      stiffness: 180,
      mass: 1,
    },
    snappy: {
      damping: 20,
      stiffness: 260,
      mass: 0.8,
    },
    bouncy: {
      damping: 14,
      stiffness: 220,
      mass: 0.9,
    },
    press: {
      damping: 18,
      stiffness: 350,
      mass: 0.6,
    },
  },

  // Easings
  easing: {
    standard: Easing.bezier(0.25, 0.1, 0.25, 1.0),
    accelerate: Easing.bezier(0.4, 0.0, 1.0, 1.0),
    decelerate: Easing.bezier(0.0, 0.0, 0.2, 1.0),
  },

  // Scale Presets
  scale: {
    pressed: 0.975,
    active: 0.985,
    highlight: 1.03,
  },
} as const;

export type MotionTokens = typeof motion;
