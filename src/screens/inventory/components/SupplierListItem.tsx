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
import { Store, Phone, CloudOff, CheckCircle2, Package, Wallet, ShoppingCart, User } from 'lucide-react-native';
import type { Supplier } from '../../../db/types';
import { getAppShadow } from '../../../utils/platformStyles';
import { useTranslation } from 'react-i18next';

interface Props {
  item: Supplier & { productCount: number };
  currency: string;
  onPay?: (supplier: Supplier) => void;
  onPurchase?: (supplier: Supplier) => void;
  onPress?: () => void;
}

const SupplierListItem: React.FC<Props> = ({ item, currency, onPay, onPurchase, onPress }) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const flexDir = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' : 'left';

  const currentBalance = Number(item?.currentBalance ?? 0);
  const formattedBalance = currentBalance.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const productCount = Number(item?.productCount ?? 0);
  const isOwing = currentBalance > 0;

  return (
    <Box
      bg="$white"
      p="$3.5"
      rounded="$2xl"
      mb="$3"
      borderWidth={1}
      borderColor="$borderLight"
      style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.03)' }) }}
    >
      <Pressable onPress={onPress}>
        <VStack space="xs">
          {/* Top Header Row: Icon + Supplier Name <----> Balance & Status */}
          <HStack justifyContent="space-between" alignItems="center" flexDirection={flexDir}>
            <HStack space="sm" alignItems="center" flex={1} flexShrink={1} mr="$2" flexDirection={flexDir}>
              <Center
                w={38}
                h={38}
                rounded="$xl"
                bg={isOwing ? "$error50" : "$primary50"}
                flexShrink={0}
              >
                <Icon as={Store} color={isOwing ? "$error600" : "$primary600"} size="sm" />
              </Center>

              <Heading
                size="sm"
                color="$text900"
                fontWeight="$bold"
                numberOfLines={1}
                ellipsizeMode="tail"
                textAlign={textAlign}
                style={{ flexShrink: 1 }}
              >
                {item.name}
              </Heading>

              {item.syncStatus === 0 ? (
                <Icon as={CloudOff} size="2xs" color="$amber600" flexShrink={0} />
              ) : (
                <Icon as={CheckCircle2} size="2xs" color="$success600" flexShrink={0} />
              )}
            </HStack>

            {/* Balance Amount & Badge */}
            <VStack alignItems={isRTL ? "flex-start" : "flex-end"} flexShrink={0} space="2xs">
              <Text
                size="sm"
                color={isOwing ? '$error600' : '$success600'}
                fontWeight="$black"
                numberOfLines={1}
              >
                {currency}{formattedBalance}
              </Text>
              <Badge
                size="sm"
                variant="solid"
                action={isOwing ? "error" : "success"}
                borderRadius="$full"
              >
                <BadgeText size="2xs" fontWeight="$bold">
                  {isOwing ? 'OWING' : 'CLEAR'}
                </BadgeText>
              </Badge>
            </VStack>
          </HStack>

          {/* Middle Row: Contact & Product Counts */}
          <HStack space="xs" alignItems="center" flexWrap="wrap" mt="$1" flexDirection={flexDir}>
            {/* Contact Person / Phone */}
            {(item.phone || item.contactInfo || item.contactPerson) && (
              <Box bg="$backgroundLight100" px="$2" py="$0.5" rounded="$md" mr="$1" mb="$1">
                <HStack space="2xs" alignItems="center" flexDirection={flexDir}>
                  <Icon as={item.contactPerson ? User : Phone} size="2xs" color="$text500" />
                  <Text size="2xs" color="$text600" fontWeight="$bold" numberOfLines={1}>
                    {item.contactPerson || item.phone || item.contactInfo}
                  </Text>
                </HStack>
              </Box>
            )}

            {/* Product Count Pill */}
            <Box bg="$primary50" px="$2" py="$0.5" rounded="$md" mb="$1">
              <HStack space="2xs" alignItems="center" flexDirection={flexDir}>
                <Icon as={Package} size="2xs" color="$primary700" />
                <Text size="2xs" color="$primary800" fontWeight="$bold">
                  {productCount} {productCount === 1 ? 'Product' : 'Products'} Sourced
                </Text>
              </HStack>
            </Box>
          </HStack>
        </VStack>
      </Pressable>

      {/* Bottom Action Row */}
      <HStack
        mt="$2.5"
        pt="$2.5"
        borderTopWidth={1}
        borderColor="$backgroundLight100"
        space="md"
        flexDirection={flexDir}
      >
        <Button
          flex={1}
          size="xs"
          action="primary"
          variant="outline"
          borderRadius={12}
          minHeight={36}
          onPress={() => onPurchase?.(item)}
          accessibilityLabel="Restock from supplier"
          accessibilityRole="button"
        >
          <ButtonIcon as={ShoppingCart} mr="$1.5" size="2xs" />
          <ButtonText size="xs" fontWeight="$bold">Restock</ButtonText>
        </Button>

        {isOwing && onPay && (
          <Button
            flex={1}
            size="xs"
            action="positive"
            variant="solid"
            bg="$error600"
            borderRadius={12}
            minHeight={36}
            onPress={() => onPay(item)}
            accessibilityLabel="Make payment to supplier"
            accessibilityRole="button"
          >
            <ButtonIcon as={Wallet} mr="$1.5" size="2xs" />
            <ButtonText size="xs" fontWeight="$bold">Pay Debt</ButtonText>
          </Button>
        )}
      </HStack>
    </Box>
  );
};

export default React.memo(SupplierListItem);
