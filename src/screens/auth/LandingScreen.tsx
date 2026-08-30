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
    <Box flex={1} bg="$backgroundLight50">
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />

      {/* Premium Hero Section */}
      <Box
        bg="$primary800"
        h={320}
        borderBottomLeftRadius={40}
        borderBottomRightRadius={40}
        justifyContent="center"
        alignItems="center"
        pt="$10"
      >
        <VStack space="md" alignItems="center" px="$8">
            <Center
                w={90}
                h={90}
                rounded="$full"
                bg="$white"
                shadowColor="$black"
            >
                <AppIcon name="store" size={50} color="#1A237E" />
            </Center>
            <Heading size="3xl" color="$white" fontWeight="$black" letterSpacing={1}>
                My Shop
            </Heading>
            <Text color="rgba(255, 255, 255, 0.8)" textAlign="center" size="md">
                The all-in-one platform for smart retail management.
            </Text>
        </VStack>
      </Box>

      <ScrollView
        style={{ marginTop: -10, zIndex: 1 }}
        contentContainerStyle={{ flexGrow: 1, padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <VStack space="xl">
            <VStack space="xs" px="$1">
              <Text size="xs" fontWeight="$bold" color="$text500" textTransform="uppercase" letterSpacing={1}>
                Get Started
              </Text>
            </VStack>

            <Pressable
                onPress={() => navigation.navigate('Login')}
                bg="$white"
                rounded={24}
                borderWidth={1}
                borderColor="$borderLight"
                shadowColor="$primary800"
                sx={{
                  ':active': {
                    transform: [{ scale: 0.98 }],
                    bg: '$backgroundLight50'
                  }
                }}
            >
                <HStack p="$5" alignItems="center" space="md">
                    <Center w={56} h={56} rounded="$full" bg="$primary50">
                        <AppIcon name="login" size={28} color="#1A237E" />
                    </Center>
                    <VStack flex={1} space="xs">
                        <Heading size="md" color="$primary800">Sign In</Heading>
                        <Text size="sm" color="$text500">Log back into your store dashboard</Text>
                    </VStack>
                    <Icon as={ChevronRightIcon} color="$text400" />
                </HStack>
            </Pressable>

            <HStack space="md">
                <Pressable
                    flex={1}
                    onPress={() => navigation.navigate('ShopRequest')}
                    bg="$teal100"
                    h={140}
                    rounded={24}
                    sx={{ ':active': { transform: [{ scale: 0.95 }] } }}
                >
                    <Center flex={1} p="$4">
                        <VStack space="xs" alignItems="center">
                            <AppIcon name="plus" size={32} color="#00796B" />
                            <Heading size="xs" color="#004D40">New Shop</Heading>
                            <Text size="xs" color="#00796B" textAlign="center">Register business</Text>
                        </VStack>
                    </Center>
                </Pressable>

                <Pressable
                    flex={1}
                    onPress={() => navigation.navigate('JoinShop')}
                    bg="$pink100"
                    h={140}
                    rounded={24}
                    sx={{ ':active': { transform: [{ scale: 0.95 }] } }}
                >
                    <Center flex={1} p="$4">
                        <VStack space="xs" alignItems="center">
                            <AppIcon name="group" size={32} color="#C2185B" />
                            <Heading size="xs" color="#880E4F">Join Team</Heading>
                            <Text size="xs" color="#C2185B" textAlign="center">Staff & Managers</Text>
                        </VStack>
                    </Center>
                </Pressable>
            </HStack>

            <VStack space="xs" mt="$8" alignItems="center">
                <Text size="xs" color="$text400" fontWeight="$bold">Version 2.0 • Production Ready</Text>
                <Text size="xs" color="$text300">© 2026 Abijah Shops POS</Text>
            </VStack>
        </VStack>
      </ScrollView>
    </Box>
  );
};

export default LandingScreen;
