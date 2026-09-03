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
} from '@gluestack-ui/themed';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import AppIcon from '../../components/common/AppIcon';
import { platformShadow } from '../../utils/platformStyles';

type Props = StackScreenProps<RootStackParamList, 'Landing'>;

const LandingScreen: React.FC<Props> = ({ navigation }) => {
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

  return (
    <Box flex={1} bg="$surfaceLavender">
      <StatusBar barStyle="dark-content" backgroundColor="#F3ECFF" />

      <Box
        h={360}
        borderBottomLeftRadius={52}
        borderBottomRightRadius={52}
        justifyContent="center"
        alignItems="center"
        pt="$10"
        style={{
          background: 'linear-gradient(135deg, #6E3BE6 0%, #7E5BFF 46%, #8F6BFF 100%)',
          ...platformShadow({ offsetY: 18, radius: 32, color: 'rgba(110,59,230,0.20)' }),
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
        style={{ marginTop: -20, zIndex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 }}
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
              ...platformShadow({ offsetY: 10, radius: 22, color: 'rgba(0,0,0,0.05)' }),
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
                ...platformShadow({ offsetY: 8, radius: 22, color: 'rgba(0,0,0,0.04)' }),
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
                ...platformShadow({ offsetY: 8, radius: 22, color: 'rgba(0,0,0,0.04)' }),
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

            {featureCards.map((feature) => (
              <Box
                key={feature.title}
                bg="$white"
                rounded={24}
                px="$4"
                py="$3"
                style={{
                  ...platformShadow({ offsetY: 6, radius: 16, color: 'rgba(110,59,230,0.05)' }),
                }}
              >
                <HStack alignItems="center" space="md">
                  <Center w={52} h={52} rounded={18} bg={feature.tint}>
                    <AppIcon name={feature.icon as any} size={24} color={feature.color} />
                  </Center>

                  <VStack flex={1} space="xs">
                    <Heading size="sm" color="$text900">{feature.title}</Heading>
                    <Text size="xs" color="$text500">{feature.subtitle}</Text>
                  </VStack>

                  <Icon as={ChevronRightIcon} color="$text300" />
                </HStack>
              </Box>
            ))}
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
