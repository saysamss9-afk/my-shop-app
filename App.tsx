import React from 'react';
import { Provider as PaperProvider, MD3LightTheme, adaptNavigationTheme } from 'react-native-paper';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from './src/gluestack-ui.config';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import OfflineBanner from './src/components/common/OfflineBanner';
import { SyncProvider } from './src/sync/SyncContext';
import { AuthProvider } from './src/auth/AuthContext';

const { LightTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
});

const theme = {
  ...MD3LightTheme,
  ...LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...LightTheme.colors,
    primary: '#6E3BE6', // Vibrant Purple
    primaryContainer: '#F3ECFF',
    secondary: '#FF4081', // Pink Accent
    secondaryContainer: '#FFEAF6',
    tertiary: '#00E5FF', // Cyan
    tertiaryContainer: '#E0F7FA',
    background: '#F3ECFF', // Lavender Background
    surface: '#FFFFFF',
    error: '#D32F2F',
    success: '#388E3C',
    warning: '#FBC02D',
    info: '#0288D1',
  },
  roundness: 24,
};

const App = () => {
  console.log('App.tsx: Rendering root App component');
  return (
    <GluestackUIProvider config={config}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ErrorBoundary>
          <PaperProvider theme={theme}>
            <AuthProvider>
              <SyncProvider>
                <OfflineBanner />
                <NavigationContainer theme={theme}>
                  <AppNavigator />
                </NavigationContainer>
              </SyncProvider>
            </AuthProvider>
          </PaperProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GluestackUIProvider>
  );
};

export default App;
