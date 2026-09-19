import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, StatusBar, Dimensions } from 'react-native';
import { Box, Center, VStack, Text, Heading } from '@gluestack-ui/themed';
import AppIcon from '../../components/common/AppIcon';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuthContext } from '../../auth/AuthContext';
import { resolveLandingRedirect } from './landingRedirect';
import firebase from '../../firebase-config';

const { width } = Dimensions.get('window');

type Props = StackScreenProps<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const { user, employeeData, isRestoringSession } = useAuthContext();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Start initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, slideAnim]);

  useEffect(() => {
    // Wait for auth to initialize AND the minimum splash time
    if (isRestoringSession) return;

    const performNavigation = async () => {
      // Minimum time to show splash (for branding)
      await new Promise(resolve => setTimeout(resolve, 2500));

      const redirect = resolveLandingRedirect({ user, employeeData, isRestoringSession });

      if (!redirect || redirect.name === 'Landing') {
        navigation.replace('Landing');
        return;
      }

      if (redirect.name === 'Dashboard' && redirect.params?.shopId) {
        let shopName = 'Your Shop';
        try {
          const shopSnap = await firebase.firestore().collection('registered_shops').doc(redirect.params.shopId).get();
          if (shopSnap.exists) {
            shopName = shopSnap.data()?.name || shopName;
          }
        } catch (error) {
          console.warn('Splash: Failed to fetch shop name:', error);
        }

        navigation.replace('Dashboard', {
          shopId: redirect.params.shopId,
          employeeId: redirect.params.employeeId as string,
          userRole: redirect.params.userRole as string,
          shopName,
        });
      } else {
        navigation.replace(redirect.name as any, redirect.params as any);
      }
    };

    performNavigation();
  }, [user, employeeData, isRestoringSession, navigation]);

  return (
    <Box
      flex={1}
      style={[
        styles.container,
        { background: 'linear-gradient(135deg, #000000 0%, #222222 100%)' } as any
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <Center flex={1}>
        <VStack space="xl" alignItems="center">
          <Box position="absolute">
             <Animated.View style={{
               opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.15] }),
               transform: [{ scale: scaleAnim.interpolate({ inputRange: [0.8, 1], outputRange: [1, 2.8] }) }]
             }}>
                <Box w={240} h={240} rounded="$full" bg="$white" />
             </Animated.View>
          </Box>
          <Animated.View style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }}>
            <Box
              w={120}
              h={120}
              rounded="$full"
              bg="$white"
              alignItems="center"
              justifyContent="center"
              style={styles.logoShadow}
            >
              <AppIcon name="store" size={64} color="#E65100" />
            </Box>
          </Animated.View>

          <VStack alignItems="center" space="xs">
            <Animated.View style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}>
              <Heading
                size="4xl"
                color="$white"
                fontWeight="$black"
                style={styles.appName}
              >
                My Shop
              </Heading>
              <Text
                color="rgba(255,255,255,0.8)"
                fontWeight="$bold"
                size="sm"
                textAlign="center"
                style={styles.tagline}
              >
                SMART RETAIL • SIMPLIFIED
              </Text>
            </Animated.View>
          </VStack>
        </VStack>
      </Center>

      <Box position="absolute" bottom={40} left={0} right={0}>
        <Center>
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text color="rgba(255,255,255,0.5)" size="xs" fontWeight="$bold" letterSpacing={1}>
              V 2.0 • POWERED BY ABIJAHSHOPS
            </Text>
          </Animated.View>
        </Center>
      </Box>
    </Box>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    // Fallback for non-web or simple background
  },
  logoShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 20,
  },
  appName: {
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  tagline: {
    letterSpacing: 4,
    marginTop: 4,
  }
});

export default SplashScreen;
