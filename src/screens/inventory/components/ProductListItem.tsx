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
} from '@gluestack-ui/themed';
import { CloudOff, CheckCircle2, Scan, AlertCircle, Trash2 } from 'lucide-react-native';
import type { Product } from '../../../db/types';
import AppIcon from '../../../components/common/AppIcon';
import { getAppShadow } from '../../../utils/platformStyles';
import { useTranslation } from 'react-i18next';

interface Props {
  item: Product;
  currency: string;
  onPress?: () => void;
  onDelete?: () => void;
  isSelected?: boolean;
  onSelectToggle?: () => void;
}

const ProductListItem: React.FC<Props> = ({
  item,
  currency,
  onPress,
  onDelete,
  isSelected = false,
  onSelectToggle,
}) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const flexDir = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' : 'left';

  const totalUnits =
    Number(item.stockQuantity || 0) +
    Number(item.bulkStockQuantity || 0) * (Number(item.bulkQuantity) > 0 ? Number(item.bulkQuantity) : 1);
  const minStock = Number(item.minStockLevel || 0);
  const isLowStock = totalUnits <= minStock;
  const isMediumStock = !isLowStock && totalUnits <= minStock * 2;
  const isHighStock = !isLowStock && !isMediumStock;
  const isDraft = item.status === 'DRAFT';

  const price = Number(item.price ?? 0);
  const formattedPrice = price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <Pressable onPress={onPress}>
      <Box
        bg="$white"
        p="$3.5"
        rounded="$2xl"
        mb="$3"
        borderWidth={1}
        borderColor={isSelected ? '$primary600' : isDraft ? '$warning300' : '$borderLight'}
        style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.03)' }) }}
        sx={{
          ':active': { bg: '$backgroundLight50' },
        }}
      >
        <VStack space="sm">
          {/* Top Header Row: Checkbox + Icon + Product Name <----> Price */}
          <HStack justifyContent="space-between" alignItems="center" flexDirection={flexDir}>
            <HStack space="sm" alignItems="center" flex={1} flexShrink={1} mr="$2" flexDirection={flexDir}>
              {/* Selection Checkbox */}
              {onSelectToggle && (
                <Pressable
                  onPress={(e: any) => {
                    e?.stopPropagation?.();
                    onSelectToggle();
                  }}
                  accessibilityLabel="Select product"
                  accessibilityRole="checkbox"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Center
                    w={24}
                    h={24}
                    rounded="$full"
                    borderWidth={2}
                    borderColor={isSelected ? '$primary600' : '$text300'}
                    bg={isSelected ? '$primary600' : 'transparent'}
                  >
                    {isSelected && <Icon as={CheckCircle2} size="xs" color="white" />}
                  </Center>
                </Pressable>
              )}

              {/* Package Icon Container */}
              <Center
                w={38}
                h={38}
                rounded="$xl"
                bg={isDraft ? '$warning50' : isLowStock ? '$error50' : isMediumStock ? '$warning50' : '$success50'}
                flexShrink={0}
              >
                {isDraft ? (
                  <Icon as={AlertCircle} color="$warning600" size="sm" />
                ) : (
                  <AppIcon
                    name="package"
                    size={20}
                    color={isLowStock ? '#D32F2F' : isMediumStock ? '#D97706' : '#16A34A'}
                  />
                )}
                <Box
                  position="absolute"
                  top={-4}
                  right={-4}
                  bg="$white"
                  rounded="$full"
                  p="$0.5"
                  style={getAppShadow({ offsetY: 1, radius: 2, color: 'rgba(0,0,0,0.1)' })}
                >
                  {item.syncStatus === 0 ? (
                    <Icon as={CloudOff} size="2xs" color="$amber600" />
                  ) : (
                    <Icon as={CheckCircle2} size="2xs" color="$success600" />
                  )}
                </Box>
              </Center>

              {/* Product Name */}
              <Heading
                size="sm"
                color="$text900"
                fontWeight="$black"
                numberOfLines={1}
                ellipsizeMode="tail"
                textAlign={textAlign}
                style={{ flexShrink: 1 }}
              >
                {item.name}
              </Heading>
            </HStack>

            {/* Price */}
            {!isDraft && (
              <Box flexShrink={0} alignItems={isRTL ? 'flex-start' : 'flex-end'}>
                <Text size="md" fontWeight="$black" color="$text900" numberOfLines={1}>
                  {currency}{formattedPrice}
                </Text>
              </Box>
            )}
          </HStack>

          {/* Middle Row: Stock Badges & Counts */}
          {isDraft ? (
            <HStack space="xs" alignItems="center" flexDirection={flexDir}>
              <Badge action="warning" variant="solid" size="sm" rounded="$md">
                <BadgeText size="2xs" fontWeight="$bold">PENDING REVIEW</BadgeText>
              </Badge>
              <Text size="xs" color="$text500" textAlign={textAlign}>Needs price or barcode.</Text>
            </HStack>
          ) : (
            <HStack space="xs" alignItems="center" flexWrap="wrap" flexDirection={flexDir}>
              {/* Stock Status Badge */}
              {isLowStock && (
                <Badge action="error" variant="solid" size="sm" rounded="$md" mr="$1">
                  <BadgeText size="2xs" fontWeight="$bold">LOW STOCK</BadgeText>
                </Badge>
              )}
              {isMediumStock && (
                <Badge action="warning" variant="solid" size="sm" rounded="$md" mr="$1">
                  <BadgeText size="2xs" fontWeight="$bold">MED STOCK</BadgeText>
                </Badge>
              )}
              {isHighStock && (
                <Badge action="success" variant="solid" size="sm" rounded="$md" mr="$1">
                  <BadgeText size="2xs" fontWeight="$bold">HIGH STOCK</BadgeText>
                </Badge>
              )}

              {/* Unit Stock Pill */}
              <Box bg="$primary50" px="$2" py="$0.5" rounded="$md" mr="$1">
                <Text size="2xs" color="$primary800" fontWeight="$bold">
                  {item.stockQuantity} {item.unit || 'pcs'}
                </Text>
              </Box>

              {/* Bulk Stock Pill (If exists) */}
              {item.bulkPrice > 0 && (
                <Box bg="$warning50" px="$2" py="$0.5" rounded="$md">
                  <Text size="2xs" color="$amber800" fontWeight="$bold">
                    {item.bulkStockQuantity} {item.bulkUnit || 'Carton'} @ {currency}
                    {Number(item.bulkPrice ?? 0).toFixed(2)}
                  </Text>
                </Box>
              )}
            </HStack>
          )}

          {/* Bottom Footer Row: Barcode <----> Delete Action */}
          <HStack
            justifyContent="space-between"
            alignItems="center"
            pt="$1.5"
            borderTopWidth={1}
            borderColor="$backgroundLight100"
            flexDirection={flexDir}
          >
            {/* Barcode Info */}
            <HStack space="xs" alignItems="center" flex={1} flexShrink={1} mr="$2" flexDirection={flexDir}>
              {(item.barcode || item.bulkBarcode) ? (
                <>
                  <Icon as={Scan} size="xs" color="$text400" flexShrink={0} />
                  <Text
                    size="2xs"
                    color="$text500"
                    fontWeight="$bold"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    textAlign={textAlign}
                  >
                    {item.barcode || item.bulkBarcode}
                  </Text>
                </>
              ) : (
                <Text size="2xs" color="$text300" textAlign={textAlign}>
                  No Barcode
                </Text>
              )}
            </HStack>

            {/* Delete Action Button */}
            {onDelete && (
              <Pressable
                onPress={(e: any) => {
                  e?.stopPropagation?.();
                  onDelete();
                }}
                px="$2.5"
                py="$1"
                minHeight={30}
                justifyContent="center"
                alignItems="center"
                rounded="$lg"
                bg="$error50"
                accessibilityLabel="Delete Product"
                accessibilityRole="button"
                style={getAppShadow({ offsetY: 1, radius: 2, color: 'rgba(219,68,85,0.1)' })}
                sx={{
                  ':active': { bg: '$error100' },
                }}
              >
                <HStack space="2xs" alignItems="center" flexDirection={flexDir}>
                  <Icon as={Trash2} size="2xs" color="$error600" />
                  <Text size="2xs" color="$error600" fontWeight="$bold">
                    Delete
                  </Text>
                </HStack>
              </Pressable>
            )}
          </HStack>
        </VStack>
      </Box>
    </Pressable>
  );
};

export default React.memo(ProductListItem);
