import React from 'react';
import { ScrollView, Dimensions, StatusBar } from 'react-native';
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
  ArrowRightIcon,
} from '@gluestack-ui/themed';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import AppIcon from '../../components/common/AppIcon';

type Props = StackScreenProps<RootStackParamList, 'Landing'>;

const { width } = Dimensions.get('window');

const LandingScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <Box flex={1} bg="$surfaceLavender">
      <StatusBar barStyle="dark-content" backgroundColor="#F3ECFF" />

      {/* Premium Hero Section */}
      <Box
        bg="$primary600"
        h={340}
        borderBottomLeftRadius={60}
        borderBottomRightRadius={60}
        justifyContent="center"
        alignItems="center"
        pt="$10"
        style={{
          background: 'linear-gradient(135deg, #6E3BE6 0%, #8956FF 100%)',
          boxShadow: '0 20px 40px rgba(110,59,230,0.15)'
        }}
      >
        <VStack space="md" alignItems="center" px="$8">
            <Center
                w={100}
                h={100}
                rounded="$full"
                bg="$white"
                style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
            >
                <AppIcon name="store" size={54} color="#6E3BE6" />
            </Center>
            <Heading size="3xl" color="$white" fontWeight="$black" letterSpacing={1}>
                My Shop
            </Heading>
            <Text color="rgba(255, 255, 255, 0.9)" textAlign="center" size="md" fontWeight="$medium">
                Modern retail management for smart businesses.
            </Text>
        </VStack>
      </Box>

      <ScrollView
        style={{ marginTop: -20, zIndex: 1 }}
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <VStack space="xl">
            <Pressable
                onPress={() => navigation.navigate('Login')}
                bg="$white"
                rounded={32}
                style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}
                sx={{
                  ':active': {
                    transform: [{ scale: 0.98 }],
                    bg: '$backgroundLight50'
                  }
                }}
            >
                <HStack p="$6" alignItems="center" space="md">
                    <Center w={60} h={60} rounded="$2xl" bg="$primary50">
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
                    rounded={32}
                    style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}
                    sx={{ ':active': { transform: [{ scale: 0.95 }] } }}
                >
                    <Center flex={1} p="$4">
                        <VStack space="md" alignItems="center">
                            <Center w={56} h={56} rounded="$2xl" bg="#E0F7FA">
                                <AppIcon name="plus" size={28} color="#00ACC1" />
                            </Center>
                            <VStack alignItems="center">
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
                    rounded={32}
                    style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}
                    sx={{ ':active': { transform: [{ scale: 0.95 }] } }}
                >
                    <Center flex={1} p="$4">
                        <VStack space="md" alignItems="center">
                            <Center w={56} h={56} rounded="$2xl" bg="#FCE4EC">
                                <AppIcon name="group" size={28} color="#D81B60" />
                            </Center>
                            <VStack alignItems="center">
                                <Heading size="xs" color="$text900">Join Team</Heading>
                                <Text size="xxs" color="$text500" textAlign="center">Staff Access</Text>
                            </VStack>
                        </VStack>
                    </Center>
                </Pressable>
            </HStack>

            <Center mt="$10">
                <VStack space="xs" alignItems="center">
                    <Text size="xs" color="$text400" fontWeight="$bold">V 2.0 • BUILT FOR GROWTH</Text>
                    <Box h={1} w={40} bg="$borderLight" />
                </VStack>
            </Center>
        </VStack>
      </ScrollView>
    </Box>
  );
};

export default LandingScreen;
