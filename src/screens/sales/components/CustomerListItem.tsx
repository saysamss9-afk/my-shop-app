import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Center,
} from '@gluestack-ui/themed';
import { User, Phone, CloudOff, CheckCircle2, Wallet } from 'lucide-react-native';
import { Customer } from '../../../db/types';
import { platformShadow } from '../../../utils/platformStyles';
import { Pressable, Button, ButtonText, ButtonIcon } from '@gluestack-ui/themed';

interface Props {
  item: Customer;
  currency: string;
  onPay: (customer: Customer) => void;
}

const CustomerListItem: React.FC<Props> = ({ item, currency, onPay }) => {
  return (
    <Box
      bg="$white"
      p="$5"
      rounded="$3xl"
      mb="$4"
      borderWidth={1}
      borderColor="$borderLight"
      style={{ ...platformShadow({ offsetY: 4, radius: 12, color: 'rgba(0,0,0,0.03)' }) }}
    >
      <HStack space="md" alignItems="center">
        <Center w={52} h={52} rounded={16} bg="$primary50">
          <Icon as={User} color="$primary600" size="md" />
        </Center>
        <VStack flex={1} space="xs">
          <HStack space="xs" alignItems="center">
            <Heading size="sm" color="$text900" fontWeight="$bold">
              {item.name}
            </Heading>
            {item.syncStatus === 0 ? (
                <Icon as={CloudOff} size="xs" color="$amber600" />
            ) : (
                <Icon as={CheckCircle2} size="xs" color="$success600" />
            )}
          </HStack>
          <HStack space="xs" alignItems="center">
            <Icon as={Phone} size="xs" color="$text400" />
            <Text size="xs" color="$text500">{item.phone || 'No phone'}</Text>
          </HStack>
        </VStack>
        <VStack alignItems="flex-end" space="xs">
            <Text size="xs" fontWeight="$bold" color="$text500">Debt</Text>
            <Text size="md" color={item.currentBalance > 0 ? '$error600' : '$success600'} fontWeight="$black">
                {currency}{item.currentBalance.toFixed(2)}
            </Text>
        </VStack>
      </HStack>

      {item.currentBalance > 0 && (
        <Box mt="$4" pt="$4" borderTopWidth={1} borderTopColor="$backgroundLight100">
            <Button
                size="sm"
                action="positive"
                variant="outline"
                borderRadius={12}
                onPress={() => onPay(item)}
            >
                <ButtonIcon as={Wallet} mr="$2" />
                <ButtonText size="xs" fontWeight="$bold">Pay Installment</ButtonText>
            </Button>
        </Box>
      )}
    </Box>
  );
};

export default React.memo(CustomerListItem);
