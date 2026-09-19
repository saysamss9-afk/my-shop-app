import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, StatusBar, Dimensions, Easing, Image } from 'react-native';
import { Box, Center, VStack, Text, Heading } from '@gluestack-ui/themed';
import AppIcon from '../../components/common/AppIcon';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuthContext } from '../../auth/AuthContext';
import { resolveLandingRedirect } from './landingRedirect';
import firebase from '../../firebase-config';

const { width, height } = Dimensions.get('window');

type Props = StackScreenProps<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const { user, employeeData, isRestoringSession } = useAuthContext();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const logoBounce = useRef(new Animated.Value(0)).current;
  const liquidBlob1 = useRef(new Animated.Value(0)).current;
  const liquidBlob2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // Infinite "Liquid" Floating Animations
    const createFloatingAnim = (val: Animated.Value, duration: number) => {
        return Animated.loop(
            Animated.sequence([
                Animated.timing(val, {
                    toValue: 1,
                    duration: duration,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.sin),
                }),
                Animated.timing(val, {
                    toValue: 0,
                    duration: duration,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.sin),
                }),
            ])
        );
    };

    createFloatingAnim(logoBounce, 2000).start();
    createFloatingAnim(liquidBlob1, 4000).start();
    createFloatingAnim(liquidBlob2, 5500).start();

  }, []);

  useEffect(() => {
    if (isRestoringSession) return;

    const performNavigation = async () => {
      await new Promise(resolve => setTimeout(resolve, 3000));
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

  // Interpolations for liquid effects
  const blob1TranslateY = liquidBlob1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40]
  });
  const blob1Scale = liquidBlob1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2]
  });

  const blob2TranslateX = liquidBlob2.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 30]
  });
  const blob2Scale = liquidBlob2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15]
  });

  const logoFloat = logoBounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15]
  });

  return (
    <Box
      flex={1}
      bg="$primary600"
      style={[
        styles.container,
        { background: 'linear-gradient(135deg, #FF9800 0%, #E65100 100%)' } as any
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#E65100" />

      {/* Background Liquid Blobs */}
      <Animated.View style={[
        styles.blob,
        {
            top: -50,
            right: -50,
            width: 300,
            height: 300,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            transform: [{ translateY: blob1TranslateY }, { scale: blob1Scale }]
        }
      ]} />
      <Animated.View style={[
        styles.blob,
        {
            bottom: 100,
            left: -80,
            width: 250,
            height: 250,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            transform: [{ translateX: blob2TranslateX }, { scale: blob2Scale }]
        }
      ]} />

      <Center flex={1}>
        <VStack space="2xl" alignItems="center">

          {/* Logo Area */}
          <Animated.View style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: logoFloat }]
          }}>
            <Box
              w={140}
              h={140}
              rounded="$full"
              bg="$white"
              alignItems="center"
              justifyContent="center"
              style={styles.logoShadow}
            >
              <Image
                source={require('../../../myshop-logo.png')}
                style={{ width: 100, height: 100 }}
                resizeMode="contain"
              />

              {/* Internal pulse ring */}
              <Box
                position="absolute"
                w="100%"
                h="100%"
                rounded="$full"
                borderWidth={4}
                borderColor="rgba(230, 81, 0, 0.1)"
              />
            </Box>
          </Animated.View>

          {/* Text Area */}
          <VStack alignItems="center" space="xs">
            <Animated.View style={{ opacity: fadeAnim }}>
              <Heading
                size="4xl"
                color="$white"
                fontWeight="$black"
                style={styles.appName}
              >
                My Shop
              </Heading>
              <Text
                color="rgba(255,255,255,0.9)"
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

      {/* Footer Branding */}
      <Box position="absolute" bottom={50} left={0} right={0}>
        <Center>
          <Animated.View style={{ opacity: fadeAnim }}>
            <Box bg="rgba(0,0,0,0.1)" px="$4" py="$1" rounded="$full">
                <Text color="white" size="2xs" fontWeight="$bold" letterSpacing={1.5}>
                V 2.0 • POWERED BY SAYs CODEs
                </Text>
            </Box>
          </Animated.View>
        </Center>
      </Box>
    </Box>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E65100', // Deep Orange
  },
  blob: {
    position: 'absolute',
    borderRadius: 150,
  },
  logoShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 25,
  },
  appName: {
    letterSpacing: 3,
    textAlign: 'center',
  },
  tagline: {
    letterSpacing: 5,
    marginTop: 4,
    textTransform: 'uppercase',
  }
});

export default SplashScreen;
