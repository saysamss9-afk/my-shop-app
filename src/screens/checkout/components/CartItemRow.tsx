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
import type { CartItem } from '../../../hooks/useCheckout';
import { useTranslation } from 'react-i18next';

interface Props {
  item: CartItem;
  currency: string;
  onUpdateQuantity: (id: string, quantity: number, isBulk: boolean) => void;
  onRemove: (id: string, isBulk: boolean) => void;
}

const CartItemRow: React.FC<Props> = ({ item, currency, onUpdateQuantity, onRemove }) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const flexDir = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' : 'left';

  const price = item.isBulk ? item.product.bulkPrice : item.product.price;
  const unitLabel = item.isBulk ? (item.product.bulkUnit || 'Bulk') : 'Unit';

  return (
    <Box bg="$white" p="$4" rounded="$2xl" mb="$3" borderWidth={1} borderColor="$borderLight">
        <HStack space="md" alignItems="center" flexDirection={flexDir}>
            <VStack flex={1} space="xs">
                <HStack space="xs" alignItems="center" flexDirection={flexDir}>
                    <Text fontWeight="$bold" color="$text900" textAlign={textAlign}>{item.product.name}</Text>
                    {item.isBulk && (
                        <Box bg="$warning50" px="$2" py="$0.5" rounded="$md">
                            <Text size="2xs" color="$warning700" fontWeight="$bold">{item.product.bulkUnit?.toUpperCase() || 'BULK'}</Text>
                        </Box>
                    )}
                </HStack>
                <Text size="xs" color="$text500" textAlign={textAlign}>{currency}{price.toFixed(2)} / {unitLabel}</Text>
            </VStack>
            <HStack alignItems="center" space="xs" bg="$backgroundLight50" p="$1" rounded="$xl" flexDirection={flexDir}>
                <Pressable
                    p="$2"
                    minWidth={36}
                    minHeight={36}
                    justifyContent="center"
                    alignItems="center"
                    onPress={() => onUpdateQuantity(item.product.id, item.quantity - 1, item.isBulk)}
                    accessibilityLabel="Decrease quantity"
                    accessibilityRole="button"
                >
                    <Icon as={RemoveIcon} size="xs" color="$text700" />
                </Pressable>
                <Text fontWeight="$bold" minWidth={24} textAlign="center" color="$text900">{item.quantity}</Text>
                <Pressable
                    p="$2"
                    minWidth={36}
                    minHeight={36}
                    justifyContent="center"
                    alignItems="center"
                    onPress={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.isBulk)}
                    accessibilityLabel="Increase quantity"
                    accessibilityRole="button"
                >
                    <Icon as={AddIcon} size="xs" color="$text700" />
                </Pressable>
            </HStack>
            <VStack alignItems={isRTL ? "flex-start" : "flex-end"} minWidth={70}>
                <Text fontWeight="$bold" color="$primary800">{currency}{(price * item.quantity).toFixed(2)}</Text>
                <Pressable
                    onPress={() => onRemove(item.product.id, item.isBulk)}
                    p="$2"
                    minWidth={36}
                    minHeight={36}
                    justifyContent="center"
                    alignItems="center"
                    mt="$1"
                    accessibilityLabel="Remove item"
                    accessibilityRole="button"
                >
                    <Icon as={TrashIcon} size="sm" color="$error600" />
                </Pressable>
            </VStack>
        </HStack>
    </Box>
  );
};

export default React.memo(CartItemRow);
