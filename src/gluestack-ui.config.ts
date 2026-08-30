import { config as defaultExternalConfig } from '@gluestack-ui/config';
import { createConfig } from '@gluestack-ui/themed';

export const config = createConfig({
  ...defaultExternalConfig,
  tokens: {
    ...defaultExternalConfig.tokens,
    colors: {
      ...defaultExternalConfig.tokens.colors,
      primary0: '#E8EAF6',
      primary50: '#C5CAE9',
      primary100: '#9FA8DA',
      primary200: '#7986CB',
      primary300: '#5C6BC0',
      primary400: '#3F51B5',
      primary500: '#3949AB',
      primary600: '#303F9F',
      primary700: '#283593',
      primary800: '#1A237E', // Brand Deep Indigo
      primary900: '#12195E',
      secondary0: '#E0F7FA',
      secondary800: '#00E5FF', // Brand Electric Cyan
    },
  },
});

// Get the type of Config
type ConfigType = typeof config;

// Extend the internal UI config type
declare module '@gluestack-ui/themed' {
  interface GluestackUIConfig extends ConfigType {}
}
