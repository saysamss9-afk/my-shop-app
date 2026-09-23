import { config as defaultExternalConfig } from '@gluestack-ui/config';
import { createConfig } from '@gluestack-ui/themed';

export const config = createConfig({
  ...defaultExternalConfig,
  tokens: {
    ...defaultExternalConfig.tokens,
    colors: {
      ...defaultExternalConfig.tokens.colors,
      // Palette derived from high-contrast Orange, Black, and White theme
      primary0: '#FFFFFF',
      primary50: '#FFF3E0',
      primary100: '#FFE0B2',
      primary200: '#FFCC80',
      primary300: '#FFB74D',
      primary400: '#FFA726',
      primary500: '#FF9800', // Main Vibrant Orange
      primary600: '#E65100', // High-contrast Deep Orange
      primary700: '#D84315',
      primary800: '#BF360C',
      primary900: '#1A1A1A', // Rich Near-Black
      // Dark Accents
      secondary500: '#000000', // Black Accent
      secondary600: '#222222',
      // Surface & shadow tokens
      surfaceLavender: '#F2EFE9', // Eye-friendly warm soft sand neutral background for day & night legibility
      surfaceGradientStart: '#F2EFE9',
      surfaceGradientEnd: '#E8E5DF',
      cardBg: '#FFFFFF',
      shadowSoft: 'rgba(0, 0, 0, 0.15)',
    },
  },
});

// Get the type of Config
type ConfigType = typeof config;

// Extend the internal UI config type
declare module '@gluestack-ui/themed' {
  interface GluestackUIConfig extends ConfigType {}
}
