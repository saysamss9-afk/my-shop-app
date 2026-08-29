import React from 'react';
import { Provider as PaperProvider, MD3LightTheme, adaptNavigationTheme } from 'react-native-paper';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

const { LightTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
});

const theme = {
  ...MD3LightTheme,
  ...LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...LightTheme.colors,
    primary: '#1A237E', // Professional Deep Indigo
    primaryContainer: '#E8EAF6',
    secondary: '#00E5FF', // Electric Cyan
    secondaryContainer: '#E0F7FA',
    tertiary: '#FF4081', // Pink Accent
    tertiaryContainer: '#FCE4EC',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    error: '#D32F2F',
    success: '#388E3C',
    warning: '#FBC02D',
    info: '#0288D1',
  },
  roundness: 12,
};

const App = () => {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <PaperProvider theme={theme}>
        <NavigationContainer theme={theme}>
          <AppNavigator />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

export default App;
