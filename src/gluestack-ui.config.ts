import { config as defaultExternalConfig } from '@gluestack-ui/config';
import { createConfig } from '@gluestack-ui/themed';

export const config = createConfig({
  ...defaultExternalConfig,
  tokens: {
    ...defaultExternalConfig.tokens,
    colors: {
      ...defaultExternalConfig.tokens.colors,
      // Palette derived from reference image
      primary0: '#FBF7FF',
      primary50: '#F3ECFF',
      primary100: '#E7DBFF',
      primary200: '#D2BFFF',
      primary300: '#B99CFF',
      primary400: '#A079FF',
      primary500: '#8956FF',
      primary600: '#6E3BE6', // Main Purple
      primary700: '#5A2ECC',
      primary800: '#4A23B3',
      primary900: '#2D1B66',
      // Pink Accent
      secondary500: '#FF4081',
      secondary600: '#F50057',
      // Surface & shadow tokens
      surfaceLavender: '#F3ECFF',
      surfaceGradientStart: '#F3ECFF',
      surfaceGradientEnd: '#E7DBFF',
      cardBg: '#FFFFFF',
      shadowSoft: 'rgba(72, 52, 129, 0.08)',
    },
  },
});

// Get the type of Config
type ConfigType = typeof config;

// Extend the internal UI config type
declare module '@gluestack-ui/themed' {
  interface GluestackUIConfig extends ConfigType {}
}
