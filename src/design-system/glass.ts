/**
 * Glass Material System Tokens
 * Community Food Rescue App - Shared Design Tokens
 */

export interface GlassTokenConfig {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  blurIntensity: number;
  androidFallbackBg: string;
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export const glass = {
  subtle: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.50)',
    borderWidth: 1,
    borderRadius: 16,
    blurIntensity: 15,
    androidFallbackBg: 'rgba(255, 255, 255, 0.88)',
    shadowColor: '#0B3D35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  standard: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderColor: 'rgba(255, 255, 255, 0.70)',
    borderWidth: 1,
    borderRadius: 20,
    blurIntensity: 25,
    androidFallbackBg: 'rgba(255, 255, 255, 0.92)',
    shadowColor: '#0B3D35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  elevated: {
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1.2,
    borderRadius: 24,
    blurIntensity: 35,
    androidFallbackBg: 'rgba(255, 255, 255, 0.96)',
    shadowColor: '#0B3D35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 22,
    elevation: 6,
  },
  navigation: {
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderRadius: 32,
    blurIntensity: 40,
    androidFallbackBg: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#0B3D35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  buttonPrimary: {
    backgroundColor: 'rgba(35, 132, 113, 0.88)',
    borderColor: 'rgba(221, 242, 235, 0.40)',
    borderWidth: 1,
    borderRadius: 16,
    blurIntensity: 20,
    androidFallbackBg: 'rgba(35, 132, 113, 0.95)',
    shadowColor: '#0B3D35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderColor: 'rgba(23, 61, 57, 0.12)',
    borderWidth: 1,
    borderRadius: 16,
    blurIntensity: 20,
    androidFallbackBg: 'rgba(255, 255, 255, 0.92)',
    shadowColor: '#0B3D35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  buttonTertiary: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: 16,
    blurIntensity: 10,
    androidFallbackBg: 'rgba(247, 248, 245, 0.50)',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  buttonDanger: {
    backgroundColor: 'rgba(200, 76, 76, 0.88)',
    borderColor: 'rgba(253, 236, 236, 0.40)',
    borderWidth: 1,
    borderRadius: 16,
    blurIntensity: 20,
    androidFallbackBg: 'rgba(200, 76, 76, 0.95)',
    shadowColor: '#C84C4C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 10,
    elevation: 4,
  },
  modal: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.90)',
    borderWidth: 1.2,
    borderRadius: 28,
    blurIntensity: 45,
    androidFallbackBg: 'rgba(255, 255, 255, 0.98)',
    shadowColor: '#0B3D35',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 36,
    elevation: 16,
  },
} as const;

export type GlassTokens = typeof glass;
export type GlassVariant = keyof typeof glass;
