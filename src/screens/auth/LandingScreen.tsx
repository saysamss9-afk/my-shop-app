import React from 'react';
import { ScrollView, StatusBar } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Center,
  Pressable,
  ChevronRightIcon,
  Spinner,
} from '@gluestack-ui/themed';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import AppIcon from '../../components/common/AppIcon';
import { getAppShadow } from '../../utils/platformStyles';
import { useAuthContext } from '../../auth/AuthContext';
import firebase from '../../firebase-config';

type Props = StackScreenProps<RootStackParamList, 'Landing'>;

const LandingScreen: React.FC<Props> = ({ navigation }) => {
  const { user, employeeData, isRestoringSession } = useAuthContext();

  React.useEffect(() => {
    if (!isRestoringSession && user) {
      const redirect = async () => {
        if (user.uid === "l2JP5nnzVSP6gd8aSDEqI60Tbfl2") {
          navigation.replace('AdminDashboard');
          return;
        }

        if (employeeData) {
          let shopName = 'Your Shop';
          try {
            const shopSnap = await firebase.firestore().collection('registered_shops').doc(employeeData.shopId).get();
            if (shopSnap.exists) {
              shopName = shopSnap.data()?.name || shopName;
            }
          } catch (error) {
            console.warn('LandingScreen: Failed to fetch shop name:', error);
          }

          navigation.replace('Dashboard', {
            shopId: employeeData.shopId,
            employeeId: user.uid,
            userRole: employeeData.role,
            shopName,
          });
        } else {
          navigation.replace('ShopSetup');
        }
      };
      redirect();
    }
  }, [user, employeeData, isRestoringSession, navigation]);

  const featureCards = [
    {
      title: 'Fast Sales',
      subtitle: 'Checkout in seconds',
      icon: 'cart',
      tint: '#EDE7FF',
      color: '#6E3BE6',
    },
    {
      title: 'Smart Inventory',
      subtitle: 'Track stock live',
      icon: 'package',
      tint: '#E3F2FD',
      color: '#1976D2',
    },
    {
      title: 'Clear Reports',
      subtitle: 'Measure trends',
      icon: 'chart',
      tint: '#E8F5E9',
      color: '#2E7D32',
    },
  ];

  if (isRestoringSession) {
    return (
      <Box flex={1} bg="$surfaceLavender">
        <Center flex={1}>
          <VStack space="md" alignItems="center">
            <AppIcon name="store" size={60} color="#6E3BE6" />
            <Spinner size="large" color="$primary600" />
            <Text size="sm" color="$text500">Restoring Session...</Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="$surfaceLavender">
      <StatusBar barStyle="dark-content" backgroundColor="#F3ECFF" />

      <Box
        h={320}
        borderBottomLeftRadius={52}
        borderBottomRightRadius={52}
        justifyContent="center"
        alignItems="center"
        style={{
          background: 'linear-gradient(135deg, #6E3BE6 0%, #7E5BFF 46%, #8F6BFF 100%)',
          ...getAppShadow({ offsetY: 18, radius: 32, color: 'rgba(110,59,230,0.20)' }),
        }}
      >
        <VStack space="md" alignItems="center" px="$8">
          <Center
            w={110}
            h={110}
            rounded="$full"
            bg="$white"
            style={{ boxShadow: '0 16px 26px rgba(44, 22, 88, 0.18)' }}
          >
            <AppIcon name="store" size={58} color="#6E3BE6" />
          </Center>

          <VStack alignItems="center" space="xs">
            <Text size="xs" color="rgba(255,255,255,0.8)" fontWeight="$bold" letterSpacing={2}>
              RETAIL OPERATIONS
            </Text>
            <Heading size="3xl" color="$white" fontWeight="$black" letterSpacing={1}>
              My Shop
            </Heading>
          </VStack>

          <Text
            color="rgba(255,255,255,0.92)"
            textAlign="center"
            size="md"
            fontWeight="$medium"
            maxWidth={280}
          >
            Modern retail management for smart businesses.
          </Text>
        </VStack>
      </Box>

      <ScrollView
        style={{ marginTop: 0, zIndex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <VStack space="xl">
          <Pressable
            onPress={() => navigation.navigate('Login')}
            bg="$white"
            rounded={30}
            px="$5"
            py="$4"
            style={{
              ...getAppShadow({ offsetY: 10, radius: 22, color: 'rgba(0,0,0,0.05)' }),
            }}
            sx={{
              ':active': {
                transform: [{ scale: 0.98 }],
                bg: '$backgroundLight50',
              },
            }}
          >
            <HStack alignItems="center" space="md">
              <Center w={62} h={62} rounded="$2xl" bg="$primary50">
                <AppIcon name="login" size={28} color="#6E3BE6" />
              </Center>

              <VStack flex={1} space="xs">
                <Heading size="md" color="$text900">Sign In</Heading>
                <Text size="xs" color="$text500">Access your store dashboard</Text>
              </VStack>

              <Icon as={ChevronRightIcon} color="$text300" />
            </HStack>
          </Pressable>

          <HStack space="md">
            <Pressable
              flex={1}
              onPress={() => navigation.navigate('ShopRequest')}
              bg="$white"
              h={160}
              rounded={30}
              style={{
                ...getAppShadow({ offsetY: 8, radius: 22, color: 'rgba(0,0,0,0.04)' }),
              }}
              sx={{ ':active': { transform: [{ scale: 0.96 }] } }}
            >
              <Center flex={1} p="$4">
                <VStack space="md" alignItems="center">
                  <Center w={58} h={58} rounded="$2xl" bg="#E0F7FA">
                    <AppIcon name="plus" size={28} color="#00ACC1" />
                  </Center>
                  <VStack alignItems="center" space="xs">
                    <Heading size="xs" color="$text900">New Shop</Heading>
                    <Text size="xxs" color="$text500" textAlign="center">Registration</Text>
                  </VStack>
                </VStack>
              </Center>
            </Pressable>

            <Pressable
              flex={1}
              onPress={() => navigation.navigate('JoinShop')}
              bg="$white"
              h={160}
              rounded={30}
              style={{
                ...getAppShadow({ offsetY: 8, radius: 22, color: 'rgba(0,0,0,0.04)' }),
              }}
              sx={{ ':active': { transform: [{ scale: 0.96 }] } }}
            >
              <Center flex={1} p="$4">
                <VStack space="md" alignItems="center">
                  <Center w={58} h={58} rounded="$2xl" bg="#FCE4EC">
                    <AppIcon name="group" size={28} color="#D81B60" />
                  </Center>
                  <VStack alignItems="center" space="xs">
                    <Heading size="xs" color="$text900">Join Team</Heading>
                    <Text size="xxs" color="$text500" textAlign="center">Staff Access</Text>
                  </VStack>
                </VStack>
              </Center>
            </Pressable>
          </HStack>

          <VStack space="md" mt="$2">
            <Text size="sm" color="$text500" fontWeight="$bold" letterSpacing={0.6}>
              EVERYTHING YOU NEED
            </Text>

            <VStack space="lg" px="$2">
              {featureCards.map((feature) => (
                <HStack key={feature.title} alignItems="center" space="md">
                  <Center w={40} h={40} rounded="$full" bg={feature.tint}>
                    <AppIcon name={feature.icon as any} size={20} color={feature.color} />
                  </Center>
                  <VStack>
                    <Heading size="xs" color="$text900">{feature.title}</Heading>
                    <Text size="xs" color="$text500">{feature.subtitle}</Text>
                  </VStack>
                </HStack>
              ))}
            </VStack>
          </VStack>

          <Center mt="$4">
            <VStack space="xs" alignItems="center">
              <Text size="xs" color="$text400" fontWeight="$bold">V 2.0 • BUILT FOR GROWTH</Text>
              <Box h={1} w={48} bg="$borderLight" />
            </VStack>
          </Center>
        </VStack>
      </ScrollView>
    </Box>
  );
};

export default LandingScreen;
