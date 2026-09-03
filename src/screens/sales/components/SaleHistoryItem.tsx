import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Heading,
  Icon,
  Pressable,
  Center,
} from '@gluestack-ui/themed';
import { RotateCcw } from 'lucide-react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Sale } from '../../../db/types';

interface Props {
  item: Sale;
  currency: string;
  onRevert: (id: string) => void;
}

const SaleHistoryItem: React.FC<Props> = ({ item, currency, onRevert }) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box
      bg="$white"
      p="$4"
      rounded="$xl"
      mb="$3"
      borderWidth={1}
      borderColor="$borderLight"
    >
      <HStack space="md" alignItems="center">
        <Center w={48} h={48} rounded="$full" bg="$primary50">
          <MaterialCommunityIcons name="receipt-text-outline" size={24} color="#1A237E" />
        </Center>
        <VStack flex={1} space="xs">
          <Heading size="xs" color="$text900">
            Transaction #{item.id.slice(-6).toUpperCase()}
          </Heading>
          <Text size="xs" color="$text500">
            {formatDate(item.timestamp)}
          </Text>
          <Text size="xs" fontWeight="$bold" color="$primary800">
            Payment: {item.paymentMethod}
          </Text>
        </VStack>
        <VStack alignItems="flex-end" space="xs">
          <Text size="md" fontWeight="$black" color="$text900">
            {currency}{item.totalAmount.toFixed(2)}
          </Text>
          <Pressable onPress={() => onRevert(item.id)} p="$1">
             <Icon as={RotateCcw} color="$error600" size="sm" />
          </Pressable>
        </VStack>
      </HStack>
    </Box>
  );
};

export default React.memo(SaleHistoryItem);
