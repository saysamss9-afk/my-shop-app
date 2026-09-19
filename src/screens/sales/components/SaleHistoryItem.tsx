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
import type { Sale } from '../../../db/types';
import { getAppShadow } from '../../../utils/platformStyles';

interface Props {
  item: any;
  currency: string;
  onRevert: (id: string) => void;
  onPress: (item: any) => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const SaleHistoryItem: React.FC<Props> = ({ item, currency, onRevert, onPress, isSelected = false, onToggleSelect }) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Pressable
      onPress={() => onPress(item)}
      bg="$white"
      p="$4"
      rounded="$xl"
      mb="$3"
      borderWidth={1}
      borderColor="$borderLight"
      style={{
        ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.02)' })
      }}
      sx={{
        ':active': { bg: '$backgroundLight50' }
      }}
    >
      <HStack space="md" alignItems="center">
        {onToggleSelect && (
          <Pressable onPress={(e: import('react-native').GestureResponderEvent) => { e.stopPropagation(); onToggleSelect(); }}>
            <Center w={24} h={24} rounded="$full" borderWidth={2} borderColor={isSelected ? "$primary600" : "$text300"} bg={isSelected ? "$primary600" : "transparent"}>
              {isSelected && <MaterialCommunityIcons name="check" size={14} color="white" />}
            </Center>
          </Pressable>
        )}
        <Center w={48} h={48} rounded="$full" bg="$primary50">
          <MaterialCommunityIcons name="receipt-text-outline" size={24} color="#1A237E" />
        </Center>
        <VStack flex={1} space="xs">
          <Heading size="xs" color="$text900">
            #{item.id.slice(-6).toUpperCase()}
          </Heading>
          <Text size="xs" color="$text500">
            {formatDate(item.timestamp)}
          </Text>
          <HStack space="xs" alignItems="center" mt="$1">
            <MaterialCommunityIcons name="account-tie" size={12} color="#666" />
            <Text size="xs" color="$text600">
                {item.staffName} ({item.staffRole})
            </Text>
          </HStack>
        </VStack>
        <VStack alignItems="flex-end" space="xs">
          <Text size="md" fontWeight="$black" color={item.isReverted === 1 ? "$text400" : "$text900"} style={item.isReverted === 1 ? { textDecorationLine: 'line-through' } : {}}>
            {currency}{item.totalAmount.toFixed(2)}
          </Text>
          {item.isReverted === 1 ? (
            <Box bg="$error50" px="$2" py="$0.5" rounded="$md">
              <Text size="xs" color="$error700" fontWeight="$bold">REVERTED</Text>
            </Box>
          ) : (
            <Pressable
              onPress={(e: import('react-native').GestureResponderEvent) => {
                  e.stopPropagation();
                  onRevert(item.id);
              }}
              px="$3"
              py="$1.5"
              bg="$error600"
              rounded="$lg"
              style={getAppShadow({ offsetY: 2, radius: 4, color: 'rgba(219,68,85,0.2)' })}
              sx={{
                ':active': { bg: '$error700' }
              }}
            >
              <HStack space="xs" alignItems="center">
                <Icon as={RotateCcw} color="$white" size="2xs" />
                <Text color="$white" size="2xs" fontWeight="$bold">Reverse</Text>
              </HStack>
            </Pressable>
          )}
        </VStack>
      </HStack>
    </Pressable>
  );
};

export default React.memo(SaleHistoryItem);
