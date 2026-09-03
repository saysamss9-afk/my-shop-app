import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Icon,
  Pressable,
  RemoveIcon,
  AddIcon,
  TrashIcon,
} from '@gluestack-ui/themed';
import { CartItem } from '../../../hooks/useCheckout';

interface Props {
  item: CartItem;
  currency: string;
  onUpdateQuantity: (id: string, quantity: number, isBulk: boolean) => void;
  onRemove: (id: string, isBulk: boolean) => void;
}

const CartItemRow: React.FC<Props> = ({ item, currency, onUpdateQuantity, onRemove }) => {
  return (
    <Box bg="$white" p="$4" rounded="$2xl" mb="$3" borderWidth={1} borderColor="$borderLight">
        <HStack space="md" alignItems="center">
            <VStack flex={1} space="xs">
                <Text fontWeight="$bold" color="$text900">{item.product.name}</Text>
                <Text size="xs" color="$text500">{currency}{item.product.price.toFixed(2)} / unit</Text>
            </VStack>
            <HStack alignItems="center" space="sm" bg="$backgroundLight50" p="$1" rounded="$lg">
                <Pressable p="$1" onPress={() => onUpdateQuantity(item.product.id, item.quantity - 1, item.isBulk)}>
                    <Icon as={RemoveIcon} size="xs" />
                </Pressable>
                <Text fontWeight="$bold" minWidth={20} textAlign="center">{item.quantity}</Text>
                <Pressable p="$1" onPress={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.isBulk)}>
                    <Icon as={AddIcon} size="xs" />
                </Pressable>
            </HStack>
            <VStack alignItems="flex-end" minWidth={70}>
                <Text fontWeight="$bold" color="$primary800">{currency}{(item.product.price * item.quantity).toFixed(2)}</Text>
                <Pressable onPress={() => onRemove(item.product.id, item.isBulk)} mt="$1">
                    <Icon as={TrashIcon} size="sm" color="$error600" />
                </Pressable>
            </VStack>
        </HStack>
    </Box>
  );
};

export default React.memo(CartItemRow);
