/**
 * Global Color System
 * Community Food Rescue App - Shared Design Tokens
 */

export const colors = {
  // Backgrounds
  background: {
    app: '#F7F8F5',
    warm: '#FAF8F3',
    pure: '#FFFFFF',
    overlay: 'rgba(11, 61, 53, 0.4)',
    scrim: 'rgba(0, 0, 0, 0.35)',
  },

  // Surfaces
  surface: {
    primary: '#FFFFFF',
    secondary: '#FAF8F3',
    subtle: '#F2F5F3',
    elevated: '#FFFFFF',
    border: 'rgba(23, 61, 57, 0.08)',
    borderStrong: 'rgba(23, 61, 57, 0.16)',
    borderFocus: '#238471',
    divider: 'rgba(23, 61, 57, 0.06)',
  },

  // Primary Brand Hierarchy
  brand: {
    900: '#0B3D35',
    800: '#0F4B41',
    700: '#115B4E',
    600: '#176F60',
    500: '#238471',
    100: '#DDF2EB',
    50: '#F0F9F6',
    primary: '#238471',
    dark: '#0B3D35',
    light: '#DDF2EB',
  },

  // Typography / Ink
  text: {
    primary: '#173D39',
    secondary: '#4F625B',
    muted: '#718079',
    disabled: '#A1AAA6',
    inverse: '#FFFFFF',
    inverseMuted: 'rgba(255, 255, 255, 0.75)',
  },

  // Accent & Warm Tones
  accent: {
    warm: '#F4A261',
    softPeach: '#F8D9C4',
    softMint: '#E3F0E7',
    amber: '#E76F51',
  },

  // Semantic Status Colors
  status: {
    success: '#238471',
    successBg: '#E3F0E7',
    successBorder: 'rgba(35, 132, 113, 0.25)',

    warning: '#D89032',
    warningBg: '#FFF4E5',
    warningBorder: 'rgba(216, 144, 50, 0.25)',

    error: '#C84C4C',
    errorBg: '#FDECEC',
    errorBorder: 'rgba(200, 76, 76, 0.25)',

    info: '#477E9F',
    infoBg: '#EAF3F8',
    infoBorder: 'rgba(71, 126, 159, 0.25)',
  },

  // Glass Material Tints
  glass: {
    lightBg: 'rgba(255, 255, 255, 0.72)',
    lightBorder: 'rgba(255, 255, 255, 0.65)',
    cardBg: 'rgba(255, 255, 255, 0.82)',
    cardBorder: 'rgba(255, 255, 255, 0.85)',
    elevatedBg: 'rgba(255, 255, 255, 0.90)',
    brandBg: 'rgba(35, 132, 113, 0.88)',
    brandBorder: 'rgba(221, 242, 235, 0.45)',
    dangerBg: 'rgba(200, 76, 76, 0.88)',
    dangerBorder: 'rgba(253, 236, 236, 0.45)',
    subtleBg: 'rgba(247, 248, 245, 0.65)',
    navigationBg: 'rgba(255, 255, 255, 0.88)',
    modalBg: 'rgba(255, 255, 255, 0.94)',
  },
} as const;

export type ColorTokens = typeof colors;
