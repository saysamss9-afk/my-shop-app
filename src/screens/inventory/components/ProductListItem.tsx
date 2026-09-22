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

interface Props {
  item: Product;
  currency: string;
  onPress?: () => void;
  onDelete?: () => void;
  isSelected?: boolean;
  onSelectToggle?: () => void;
}

const ProductListItem: React.FC<Props> = ({ item, currency, onPress, onDelete, isSelected = false, onSelectToggle }) => {
  const isLowStock = item.stockQuantity <= item.minStockLevel;
  const isMediumStock = !isLowStock && item.stockQuantity <= item.minStockLevel * 2;
  const isHighStock = !isLowStock && !isMediumStock;
  const isDraft = item.status === 'DRAFT';

  return (
    <Pressable onPress={onPress}>
        <Box
            bg="$white"
            p="$4"
            rounded="$3xl"
            mb="$3"
            borderWidth={2}
            borderColor={isSelected ? "$primary600" : (isDraft ? "$warning300" : "$borderLight")}
            style={{ ...getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(0,0,0,0.03)' }) }}
        >
            <HStack space="md" alignItems="flex-start">
                {/* 1. SELECTION CHECKBOX */}
                {onSelectToggle && (
                    <Pressable onPress={(e: any) => { e.stopPropagation(); onSelectToggle(); }} style={{ marginTop: 12 }}>
                        <Center w={24} h={24} rounded="$full" borderWidth={2} borderColor={isSelected ? "$primary600" : "$text300"} bg={isSelected ? "$primary600" : "transparent"}>
                            {isSelected && <Icon as={CheckCircle2} size="xs" color="white" />}
                        </Center>
                    </Pressable>
                )}

                {/* 2. PRODUCT ICON */}
                <Center
                    w={52}
                    h={52}
                    rounded={18}
                    bg={isDraft ? "$warning50" : (isLowStock ? '$error50' : (isMediumStock ? '$warning50' : '$success50'))}
                    style={{ marginTop: 2 }}
                >
                    {isDraft ? (
                        <Icon as={AlertCircle} color="$warning600" size="md" />
                    ) : (
                        <AppIcon
                            name="package"
                            size={26}
                            color={isLowStock ? '#D32F2F' : (isMediumStock ? '#D97706' : '#16A34A')}
                        />
                    )}
                    {/* Sync Overlay */}
                    <Box position="absolute" top={-6} right={-6} bg="$white" rounded="$full" p="$0.5" style={getAppShadow({offsetY: 2, radius: 4, color: 'rgba(0,0,0,0.1)'})}>
                        {item.syncStatus === 0 ? (
                            <Icon as={CloudOff} size="xs" color="$amber600" />
                        ) : (
                            <Icon as={CheckCircle2} size="xs" color="$success600" />
                        )}
                    </Box>
                </Center>

                {/* 3. CONTENT AREA */}
                <VStack flex={1} space="xs">
                    {/* TOP ROW: Name, Price, and Stock Status Badge */}
                    <HStack justifyContent="space-between" alignItems="flex-start" space="xs">
                        <VStack flex={1} mr="$2">
                            <Heading size="sm" color="$text900" fontWeight="$black" numberOfLines={2}>
                                {item.name}
                            </Heading>
                        </VStack>
                        <VStack alignItems="flex-end" space="xs">
                            {!isDraft && (
                                <Text size="md" fontWeight="$black" color="$text900">
                                    {currency}{(item.price ?? 0).toFixed(2)}
                                </Text>
                            )}
                            {isLowStock && !isDraft && (
                                <Badge action="error" variant="outline" size="sm" rounded="$lg">
                                    <BadgeText size="2xs" fontWeight="$bold">LOW STOCK</BadgeText>
                                </Badge>
                            )}
                            {isMediumStock && !isDraft && (
                                <Badge action="warning" variant="outline" size="sm" rounded="$lg">
                                    <BadgeText size="2xs" fontWeight="$bold">MEDIUM STOCK</BadgeText>
                                </Badge>
                            )}
                            {isHighStock && !isDraft && (
                                <Badge action="success" variant="outline" size="sm" rounded="$lg">
                                    <BadgeText size="2xs" fontWeight="$bold">HIGH STOCK</BadgeText>
                                </Badge>
                            )}
                        </VStack>
                    </HStack>

                    {/* MIDDLE & BOTTOM AREA: Detailed Info & Delete Action */}
                    <HStack justifyContent="space-between" alignItems="flex-end" mt="$1">
                        <VStack space="xs" flex={1} mr="$2">
                            {isDraft ? (
                                <VStack space="xs">
                                    <Badge action="warning" variant="outline" size="sm" rounded="$lg" alignSelf="flex-start">
                                        <BadgeText size="2xs" fontWeight="$bold">PENDING REVIEW</BadgeText>
                                    </Badge>
                                    <Text size="xs" color="$text500">Stocked. Needs barcode/price.</Text>
                                </VStack>
                            ) : (
                                <VStack space="xs">
                                    {/* Unit Stock */}
                                    <HStack space="xs" alignItems="center" flexWrap="wrap">
                                        <Badge action="info" variant="solid" size="sm" rounded="$full">
                                            <BadgeText size="2xs">UNIT</BadgeText>
                                        </Badge>
                                        <Text size="xs" color="$text600" fontWeight="$bold">
                                            {item.stockQuantity} {item.unit}
                                        </Text>
                                    </HStack>

                                    {/* Bulk Stock (If exists) */}
                                    {item.bulkPrice > 0 && (
                                        <HStack space="xs" alignItems="center" flexWrap="wrap">
                                            <Badge action="warning" variant="solid" size="sm" rounded="$full">
                                                <BadgeText size="2xs">{(item.bulkUnit || 'BULK').toUpperCase()}</BadgeText>
                                            </Badge>
                                            <Text size="xs" color="$text600" fontWeight="$bold">
                                                {item.bulkStockQuantity} {item.bulkUnit} @ {currency}{(item.bulkPrice ?? 0).toFixed(2)}
                                            </Text>
                                        </HStack>
                                    )}

                                    {/* Barcode Display */}
                                    {(item.barcode || item.bulkBarcode) && (
                                        <HStack space="xs" alignItems="center" mt="$1">
                                            <Icon as={Scan} size="xs" color="$text400" />
                                            <Text size="2xs" color="$text500" fontWeight="$bold">
                                                {item.barcode || item.bulkBarcode}
                                            </Text>
                                        </HStack>
                                    )}
                                </VStack>
                            )}
                        </VStack>

                        {/* DELETE ACTION BUTTON */}
                        <Pressable
                            onPress={(e: any) => { e?.stopPropagation?.(); onDelete && onDelete(); }}
                            p="$2"
                            rounded="$lg"
                            bg="$backgroundLight100"
                        >
                            <Icon as={Trash2} size="xs" color="$text500" />
                        </Pressable>
                    </HStack>
                </VStack>
            </HStack>
        </Box>
    </Pressable>
  );
};

export default React.memo(ProductListItem);
