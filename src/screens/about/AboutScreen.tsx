import React from 'react';
import { ScrollView, StatusBar, Image } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Center,
  Divider,
  Pressable,
  ArrowLeftIcon,
} from '@gluestack-ui/themed';
import { Info, ShieldCheck, Rocket, Heart, CheckCircle2, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import AppIcon from '../../components/common/AppIcon';
import { getAppShadow } from '../../utils/platformStyles';

const AboutScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  return (
    <ScreenWrapper withHeader scrollable>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Modern Header */}
      <Box pt={Math.max(insets.top, 10)} pb="$2" px="$4">
        <HStack space="md" alignItems="center">
          <Pressable onPress={() => navigation.goBack()} p="$2.5" bg="$white" rounded="$full" style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.05)' }) }}>
            <ArrowLeft size={22} color="#111827" />
          </Pressable>
          <VStack>
            <Heading size="lg" color="$text900" fontWeight="$black">About My Shop</Heading>
            <Text size="xs" color="$text500">Retail Operations</Text>
          </VStack>
        </HStack>
      </Box>

      <VStack space="xl" p="$6" pb="$12">
        {/* Hero Section */}
        <Center
          bg="$white"
          p="$8"
          rounded="$3xl"
          style={{ ...getAppShadow({ offsetY: 10, radius: 24, color: 'rgba(0,0,0,0.06)' }) }}
        >
          <VStack space="md" alignItems="center">
            <Center w={80} h={80} rounded="$2xl" bg="$primary50">
              <Image
                source={require('../../../myshop-logo.png')}
                style={{ width: 60, height: 60 }}
                resizeMode="contain"
              />
            </Center>
            <VStack alignItems="center">
              <Heading size="xl" color="$text900" fontWeight="$black">My Shop</Heading>
              <Text size="sm" color="$text500" fontWeight="$medium">Version 2.0.0</Text>
            </VStack>
          </VStack>
        </Center>

        {/* Introduction */}
        <VStack space="md">
          <HStack space="sm" alignItems="center">
            <Icon as={Info} size="sm" color="$primary600" />
            <Heading size="sm" color="$text900" textTransform="uppercase" letterSpacing={1}>About My Shop</Heading>
          </HStack>
          <Box bg="$white" p="$5" rounded="$2xl" style={{ ...getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(0,0,0,0.04)' }) }}>
            <Text size="md" color="$text700" lineHeight="$md">
              My Shop is a business management application designed to help shop owners, retailers, traders and other businesses manage their day-to-day operations more efficiently.
            </Text>
          </Box>
        </VStack>

        {/* Features List */}
        <VStack space="md">
          <Heading size="xs" color="$text500" textTransform="uppercase" px="$1">Tools for Managing</Heading>
          <Box bg="$white" p="$4" rounded="$2xl" style={{ ...getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(0,0,0,0.04)' }) }}>
            <VStack space="sm">
              {[
                'Products and Catalog',
                'Sales and transactions',
                'Customers and Suppliers',
                'Stock movement and Expenses',
                'Business records and Pricing',
                'Barcode identification',
                'Reports and summaries',
                'User access management',
                'Offline operations'
              ].map((item, index) => (
                <HStack key={index} space="sm" alignItems="center">
                  <Icon as={CheckCircle2} size="xs" color="$success600" />
                  <Text size="sm" color="$text700">{item}</Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        </VStack>

        {/* Offline First */}
        <VStack space="md">
          <HStack space="sm" alignItems="center">
            <Icon as={Rocket} size="sm" color="$primary600" />
            <Heading size="sm" color="$text900">Offline-First Approach</Heading>
          </HStack>
          <Box bg="$primary50" p="$5" rounded="$2xl" borderWidth={1} borderColor="$primary100">
            <Text size="sm" color="$primary900" lineHeight="$md">
              My Shop is designed to allow users to continue many business activities even without internet. When enabled, information synchronizes with supported cloud services once you're back online.
            </Text>
          </Box>
        </VStack>

        <Divider bg="$borderLight" />

        {/* Data Ownership */}
        <VStack space="md">
          <HStack space="sm" alignItems="center">
            <Icon as={ShieldCheck} size="sm" color="$primary600" />
            <Heading size="sm" color="$text900">Your Business, Your Data</Heading>
          </HStack>
          <VStack space="sm" px="$1">
            <Text size="sm" color="$text600" lineHeight="$md">
              Information entered into My Shop belongs to the business or individual that provided it. The application does not take ownership of your records simply because they are processed through the app.
            </Text>
            <Text size="sm" color="$text600" fontStyle="italic">
              Users remain responsible for ensuring that the information they enter is accurate, lawful and appropriate.
            </Text>
          </VStack>
        </VStack>

        {/* Real Businesses */}
        <VStack space="md">
          <HStack space="sm" alignItems="center">
            <Icon as={Heart} size="sm" color="$error600" />
            <Heading size="sm" color="$text900">Designed for Real Businesses</Heading>
          </HStack>
          <VStack space="sm" px="$1">
            <Text size="sm" color="$text600" lineHeight="$md">
              My Shop is built to simplify management and reduce dependence on manual records. However, it is a software tool and does not replace professional accounting, tax, legal, or business advice.
            </Text>
          </VStack>
        </VStack>

        {/* Continuous Development */}
        <Box bg="$backgroundLight50" p="$5" rounded="$2xl" borderWidth={1} borderColor="$borderLight">
          <VStack space="sm">
            <Heading size="xs" color="$text900">Continuous Development</Heading>
            <Text size="xs" color="$text500" lineHeight="$sm">
              My Shop is continuously improved. Features, security, and requirements may change over time. By using the app, you acknowledge that technical limitations or maintenance periods may occasionally occur.
            </Text>
          </VStack>
        </Box>

        {/* Commitment */}
        <Center py="$6">
          <VStack space="xs" alignItems="center" maxWidth={280}>
            <Heading size="sm" color="$text900" textAlign="center">Our Commitment</Heading>
            <Text size="sm" color="$text600" textAlign="center" lineHeight="$md">
              To give businesses a practical, reliable and accessible digital tool for managing their everyday operations.
            </Text>
          </VStack>
        </Center>

        <Center mt="$4">
          <VStack space="sm" alignItems="center">
            <HStack space="md" alignItems="center">
              <Pressable onPress={() => navigation.navigate('Terms')}>
                <Text size="xs" color="$primary600" fontWeight="$bold">Terms</Text>
              </Pressable>
              <Divider orientation="vertical" h={12} />
              <Pressable onPress={() => navigation.navigate('Privacy')}>
                <Text size="xs" color="$primary600" fontWeight="$bold">Privacy</Text>
              </Pressable>
            </HStack>
            <Text size="2xs" color="$text400">© 2026 My Shop. All rights reserved.</Text>
          </VStack>
        </Center>
      </VStack>
    </ScreenWrapper>
  );
};

export default AboutScreen;
