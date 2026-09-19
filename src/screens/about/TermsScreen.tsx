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
import { Scale, ShieldAlert, FileText, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import { getAppShadow } from '../../utils/platformStyles';

const TermsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const sections = [
    {
      id: '1',
      title: '1. About My Shop',
      content: 'My Shop is a business-management software application designed to assist businesses with products, sales, customers, suppliers, expenses, business records and related operational activities. We provide the tools; you manage the business.',
    },
    {
      id: '2',
      title: '2. Eligibility and Authority',
      content: 'You must be legally permitted to enter into these Terms. If using My Shop for a business, you confirm you have the authority to bind that organization to these Terms.',
    },
    {
      id: '3',
      title: '3. Your Business Account',
      content: 'You are responsible for your account security. Use strong passwords, avoid sharing credentials, and manage staff access carefully. Report any unauthorized access immediately.',
    },
    {
      id: '4',
      title: '4. Your Data',
      content: 'Data entered belongs to you. We do not claim ownership. You are responsible for the accuracy and legality of the information you collect and process.',
    },
    {
      id: '5',
      title: '5. Personal Data and Privacy',
      content: 'We process personal information in accordance with applicable laws, including Ghana\'s Data Protection Act, 2012 (Act 843). Ensure you have a lawful basis for collecting customer or employee data.',
    },
    {
      id: '6',
      title: '6. Data Security',
      content: 'We use reasonable measures to protect your data, but no system is 100% secure. You are responsible for device security and maintaining strong passwords.',
    },
    {
      id: '7-9',
      title: '7-9. Offline, Sync & Backups',
      content: 'My Shop works offline and syncs when online. Syncing is not a substitute for independent backups. Maintain your own records for critical business data.',
    },
    {
      id: '10-11',
      title: '10-11. Records & Financials',
      content: 'My Shop is a tool, not a professional advisor. Verify all calculations and reports before making significant financial, tax, or legal decisions.',
    },
    {
      id: '18',
      title: '18. Limitation of Liability',
      content: 'To the maximum extent permitted by law, My Shop shall not be liable for indirect, incidental, or consequential losses, including loss of profits or business interruption.',
    },
    {
        id: '24',
        title: '24. Governing Law',
        content: 'These Terms are governed by the laws of the Republic of Ghana. Disputes should first be addressed through good-faith communication.',
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
            <Heading size="lg" color="$text900" fontWeight="$black">Terms & Conditions</Heading>
            <Text size="xs" color="$text500">Legal Agreement</Text>
          </VStack>
        </HStack>
      </Box>

      <VStack space="xl" p="$6" pb="$12">
        {/* Header */}
        <VStack space="xs">
          <HStack space="sm" alignItems="center">
            <Icon as={Scale} size="md" color="$primary600" />
            <Heading size="xl" color="$text900" fontWeight="$black">Terms & Conditions</Heading>
          </HStack>
          <Text size="sm" color="$text500">Effective Date: 16 September 2026</Text>
        </VStack>

        <Box bg="$primary50" p="$4" rounded="$xl" borderWidth={1} borderColor="$primary100">
          <HStack space="sm">
            <Icon as={ShieldAlert} size="sm" color="$primary700" mt="$0.5" />
            <Text size="xs" color="$primary800" flex={1} lineHeight="$sm">
              Please read these terms carefully. By using My Shop, you agree to be bound by these conditions governing access and use of our platform.
            </Text>
          </HStack>
        </Box>

        <Divider bg="$borderLight" />

        {/* Sections */}
        <VStack space="lg">
          {sections.map((section) => (
            <VStack key={section.id} space="xs">
              <Heading size="sm" color="$text900">{section.title}</Heading>
              <Text size="sm" color="$text600" lineHeight="$md">
                {section.content}
              </Text>
            </VStack>
          ))}
        </VStack>

        <Box bg="$backgroundLight50" p="$5" rounded="$2xl" borderStyle="dashed" borderWidth={1} borderColor="$borderLight">
          <VStack space="md">
            <HStack space="sm" alignItems="center">
              <Icon as={FileText} size="sm" color="$text500" />
              <Heading size="xs" color="$text900">Full Terms Reference</Heading>
            </HStack>
            <Text size="xs" color="$text500" lineHeight="$sm">
                This is a summarized view of our terms. The full agreement includes 27 sections covering intellectual property, acceptable use, termination, and more. For the complete legal text, please contact support or visit our official website.
            </Text>
          </VStack>
        </Box>

        <Center mt="$8">
          <VStack space="xs" alignItems="center">
            <Text size="xs" color="$text400" fontWeight="$bold">MY SHOP • BUSINESS MANAGEMENT</Text>
            <Text size="2xs" color="$text300">© 2026 My Shop. All rights reserved.</Text>
          </VStack>
        </Center>
      </VStack>
    </ScreenWrapper>
  );
};

export default TermsScreen;
