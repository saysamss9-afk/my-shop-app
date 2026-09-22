import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Center,
  Badge,
  BadgeText,
  Pressable,
  Button,
  ButtonText,
  ButtonIcon,
} from '@gluestack-ui/themed';
import { Store, Phone, CloudOff, CheckCircle2, Package, Wallet, ShoppingCart } from 'lucide-react-native';
import type { Supplier } from '../../../db/types';
import { getAppShadow } from '../../../utils/platformStyles';

interface Props {
  item: Supplier & { productCount: number };
  currency: string;
  onPay?: (supplier: Supplier) => void;
  onPurchase?: (supplier: Supplier) => void;
  onPress?: () => void;
}

const SupplierListItem: React.FC<Props> = ({ item, currency, onPay, onPurchase, onPress }) => {
  const currentBalance = Number(item?.currentBalance ?? 0);
  const productCount = Number(item?.productCount ?? 0);
  const isOwing = currentBalance > 0;

  return (
    <Box
      bg="$white"
      p="$4"
      rounded="$3xl"
      mb="$3"
      borderWidth={1}
      borderColor="$borderLight"
      style={{ ...getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(0,0,0,0.03)' }) }}
    >
      <Pressable onPress={onPress}>
        <HStack space="md" alignItems="center">
            <Center w={48} h={48} rounded={16} bg={isOwing ? "$error50" : "$primary50"}>
                <Icon as={Store} color={isOwing ? "$error600" : "$primary600"} size="md" />
            </Center>

            <VStack flex={1} space="xs" mr="$2">
                <HStack space="xs" alignItems="center">
                    <Heading size="sm" color="$text900" fontWeight="$bold" numberOfLines={1} style={{ flex: 1 }}>
                        {item.name}
                    </Heading>
                    {item.syncStatus === 0 ? (
                        <Icon as={CloudOff} size="xs" color="$amber600" />
                    ) : (
                        <Icon as={CheckCircle2} size="xs" color="$success600" />
                    )}
                </HStack>

                <HStack space="md" alignItems="center" flexWrap="wrap">
                    <HStack space="xs" alignItems="center" flex={1}>
                        <Icon as={Phone} size="xs" color="$text400" />
                        <Text size="xs" color="$text500" numberOfLines={1}>
                            {item.phone || item.contactInfo || item.email || 'No contact'}
                        </Text>
                    </HStack>
                    <HStack space="xs" alignItems="center" flexShrink={0}>
                        <Icon as={Package} size="xs" color="$text400" />
                        <Text size="xs" color="$text500">{productCount} Items</Text>
                    </HStack>
                </HStack>
            </VStack>

            <VStack alignItems="flex-end" space="xs" flexShrink={0}>
                <Text size="2xs" fontWeight="$bold" color="$text500">Balance</Text>
                <Text size="sm" color={isOwing ? '$error600' : '$success600'} fontWeight="$black">
                    {currency}{currentBalance.toFixed(2)}
                </Text>
                <Badge size="sm" variant="solid" action={isOwing ? "error" : "success"} borderRadius="$full">
                    <BadgeText size="2xs">{isOwing ? 'Owing' : 'Paid'}</BadgeText>
                </Badge>
            </VStack>
        </HStack>
      </Pressable>

      <HStack mt="$3" pt="$3" borderTopWidth={1} borderTopColor="$backgroundLight100" space="md">
            <Button
                flex={1}
                size="sm"
                action="primary"
                variant="outline"
                borderRadius={12}
                onPress={() => onPurchase?.(item)}
            >
                <ButtonIcon as={ShoppingCart} mr="$2" />
                <ButtonText size="xs" fontWeight="$bold">Restock</ButtonText>
            </Button>

            {isOwing && onPay && (
                <Button
                    flex={1}
                    size="sm"
                    action="positive"
                    variant="outline"
                    borderRadius={12}
                    onPress={() => onPay(item)}
                >
                    <ButtonIcon as={Wallet} mr="$2" />
                    <ButtonText size="xs" fontWeight="$bold">Make Payment</ButtonText>
                </Button>
            )}
      </HStack>
    </Box>
  );
};

export default React.memo(SupplierListItem);
