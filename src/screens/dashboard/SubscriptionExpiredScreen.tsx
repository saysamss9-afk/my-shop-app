import React from 'react';
import { StatusBar } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  ButtonText,
  Center,
  Icon,
} from '@gluestack-ui/themed';
import { AlertTriangle, LogOut, RefreshCw, Globe } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import { getAppShadow } from '../../utils/platformStyles';

interface Props {
  shopName: string;
  planExpiresAt: string;
  onRenew: () => void;
  onSwitchBranch?: () => void;
  onLogout: () => void;
}

export const SubscriptionExpiredScreen: React.FC<Props> = ({
  shopName,
  planExpiresAt,
  onRenew,
  onSwitchBranch,
  onLogout,
}) => {
  return (
    <ScreenWrapper>
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />
      <Box flex={1} bg="$backgroundLight50" justifyContent="center" alignItems="center" p="$6">
        <Box
          bg="$white"
          p="$8"
          rounded="$3xl"
          w="$full"
          maxWidth={420}
          borderWidth={1}
          borderColor="$borderLight"
          style={{ ...getAppShadow({ offsetY: 10, radius: 30, color: 'rgba(220,38,38,0.15)' }) }}
          alignItems="center"
        >
          <Center w={80} h={80} rounded="$full" bg="$error100" mb="$5">
            <Icon as={AlertTriangle} size="xl" color="$error600" />
          </Center>

          <Heading size="xl" color="$text900" fontWeight="$black" textAlign="center" mb="$2">
            Subscription Expired
          </Heading>

          <Text size="sm" color="$text500" textAlign="center" mb="$6">
            The subscription plan for <Text fontWeight="$bold" color="$text800">{shopName}</Text> expired on <Text fontWeight="$bold" color="$error600">{planExpiresAt}</Text>. Access to POS sales, inventory, and reports is currently locked.
          </Text>

          <VStack space="md" w="$full">
            <Button
              size="lg"
              bg="$error600"
              rounded="$xl"
              onPress={onRenew}
              style={{ ...getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(220,38,38,0.2)' }) }}
            >
              <HStack space="xs" alignItems="center">
                <Icon as={RefreshCw} color="$white" size="sm" />
                <ButtonText fontWeight="$bold">Request Plan Renewal</ButtonText>
              </HStack>
            </Button>

            {onSwitchBranch && (
              <Button
                size="lg"
                variant="outline"
                action="secondary"
                rounded="$xl"
                onPress={onSwitchBranch}
              >
                <HStack space="xs" alignItems="center">
                  <Icon as={Globe} color="$text700" size="sm" />
                  <ButtonText fontWeight="$bold" color="$text700">Switch to Another Branch</ButtonText>
                </HStack>
              </Button>
            )}

            <Button
              size="md"
              variant="link"
              onPress={onLogout}
              mt="$2"
            >
              <HStack space="xs" alignItems="center">
                <Icon as={LogOut} color="$error600" size="xs" />
                <ButtonText size="sm" color="$error600" fontWeight="$bold">Log Out</ButtonText>
              </HStack>
            </Button>
          </VStack>
        </Box>
      </Box>
    </ScreenWrapper>
  );
};

export default SubscriptionExpiredScreen;
