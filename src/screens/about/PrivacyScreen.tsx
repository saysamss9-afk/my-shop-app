import React from 'react';
import { StatusBar, ScrollView } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Divider,
  Center,
  Pressable,
  ArrowLeftIcon,
} from '@gluestack-ui/themed';
import { Eye, Lock, Database, Globe, UserCheck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import { getAppShadow } from '../../utils/platformStyles';

const PrivacyScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const points = [
    {
      icon: Database,
      title: 'What we store',
      content: 'We process business names, product info, stock records, sales records, and contact details for customers and suppliers to provide core app functionality.'
    },
    {
      icon: UserCheck,
      title: 'Your Ownership',
      content: 'Your business information remains yours. My Shop does not sell your database to third parties and does not claim ownership of your records.'
    },
    {
      icon: Lock,
      title: 'Security',
      content: 'We use reasonable technical measures to protect your data. However, users must also protect their devices, passwords, and account access.'
    },
    {
      icon: Globe,
      title: 'Data Protection (Ghana)',
      content: 'We respect the Data Protection Act, 2012 (Act 843). Individuals have rights to access, correction, and objection regarding their personal data.'
    }
  ];

  return (
    <ScreenWrapper withHeader scrollable>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Modern Header */}
      <Box pt={Math.max(insets.top, 10)} pb="$2" px="$4">
        <HStack space="md" alignItems="center">
          <Pressable onPress={() => navigation.goBack()} p="$2" bg="$white" rounded="$full" style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.05)' }) }}>
            <Icon as={ArrowLeftIcon} color="$text900" />
          </Pressable>
          <VStack>
            <Heading size="lg" color="$text900" fontWeight="$black">Privacy Statement</Heading>
            <Text size="xs" color="$text500">Data Protection</Text>
          </VStack>
        </HStack>
      </Box>

      <VStack space="xl" p="$6" pb="$12">
        {/* Header */}
        <VStack space="xs">
          <HStack space="sm" alignItems="center">
            <Icon as={Eye} size="md" color="$primary600" />
            <Heading size="xl" color="$text900" fontWeight="$black">Privacy Statement</Heading>
          </HStack>
          <Text size="sm" color="$text500">Effective Date: 16 September 2026</Text>
        </VStack>

        <Text size="sm" color="$text600" lineHeight="$md">
          My Shop respects the privacy of individuals and is committed to handling personal information responsibly. This statement explains how your data is handled.
        </Text>

        <Divider bg="$borderLight" />

        {/* Highlights */}
        <VStack space="lg">
          {points.map((item, index) => (
            <HStack key={index} space="md">
              <Center w={40} h={40} rounded="$full" bg="$primary50">
                <Icon as={item.icon} size="sm" color="$primary600" />
              </Center>
              <VStack flex={1} space="xs">
                <Heading size="sm" color="$text900">{item.title}</Heading>
                <Text size="sm" color="$text600" lineHeight="$md">{item.content}</Text>
              </VStack>
            </HStack>
          ))}
        </VStack>

        {/* Local vs Cloud */}
        <Box bg="$backgroundLight50" p="$5" rounded="$2xl" borderWidth={1} borderColor="$borderLight">
          <VStack space="md">
            <VStack space="xs">
              <Heading size="xs" color="$text900" textTransform="uppercase">Local Storage</Heading>
              <Text size="xs" color="$text500" lineHeight="$sm">
                Data is stored on your device to support offline use. Ensure your device is locked to prevent unauthorized access.
              </Text>
            </VStack>
            <VStack space="xs">
              <Heading size="xs" color="$text900" textTransform="uppercase">Cloud Sync</Heading>
              <Text size="xs" color="$text500" lineHeight="$sm">
                If enabled, data is transmitted to cloud infrastructure to keep your authorized devices in sync.
              </Text>
            </VStack>
          </VStack>
        </Box>

        <VStack space="md">
            <Heading size="sm" color="$text900">Data Retention & Rights</Heading>
            <Text size="sm" color="$text600" lineHeight="$md">
                Information is retained only as long as necessary for service delivery or legal compliance. Requests regarding personal data should be directed to our support channels.
            </Text>
        </VStack>

        <Center mt="$8">
          <VStack space="xs" alignItems="center">
            <Text size="xs" color="$text400" fontWeight="$bold">MY SHOP • DATA PROTECTION</Text>
            <Text size="2xs" color="$text300">Your business. Your records. Your control.</Text>
          </VStack>
        </Center>
      </VStack>
    </ScreenWrapper>
  );
};

export default PrivacyScreen;
