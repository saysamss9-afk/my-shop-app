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
        mb="$4"
        mx="$4"
        borderWidth={2}
        borderColor={isSelected ? "$primary600" : (isDraft ? "$warning300" : "$borderLight")}
        style={{ ...getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(0,0,0,0.03)' }) }}
        >
        <HStack space="md" alignItems="flex-start" w="100%">
            {onSelectToggle && (
                <Pressable onPress={(e: any) => { e.stopPropagation(); onSelectToggle(); }} style={{ marginTop: 16 }}>
                    <Center w={24} h={24} rounded="$full" borderWidth={2} borderColor={isSelected ? "$primary600" : "$text300"} bg={isSelected ? "$primary600" : "transparent"} mr="$1">
                        {isSelected && <Icon as={CheckCircle2} size="xs" color="white" />}
                    </Center>
                </Pressable>
            )}

            <Center
            w={52}
            h={52}
            rounded={16}
            bg={isDraft ? "$warning50" : (isLowStock ? '$error50' : (isMediumStock ? '$warning50' : '$success50'))}
            style={{ marginTop: 4 }}
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
            </Center>

            <VStack flex={1} space="xs" style={{ minWidth: 0 }}>
                <HStack space="xs" alignItems="center" justifyContent="space-between">
                    <Heading size="sm" color="$text900" fontWeight="$black" style={{ flexShrink: 1 }}>
                        {item.name}
                    </Heading>
                    <Box style={{ flexShrink: 0 }}>
                        {item.syncStatus === 0 ? (
                            <Icon as={CloudOff} size="xs" color="$amber600" />
                        ) : (
                            <Icon as={CheckCircle2} size="xs" color="$success600" />
                        )}
                    </Box>
                </HStack>

                {isDraft ? (
                    <VStack space="xs">
                        <Box alignSelf="flex-start" style={{ flexShrink: 0 }}>
                            <Badge action="warning" variant="outline" size="sm" rounded="$lg">
                                <BadgeText size="2xs" fontWeight="$bold">PENDING REVIEW</BadgeText>
                            </Badge>
                        </Box>
                        <Text size="xs" color="$text500">Stocked during purchase. Needs barcode & pricing.</Text>
                    </VStack>
                ) : (
                    <VStack space="sm">
                        <VStack space="xs">
                            <HStack space="xs" alignItems="center">
                                <Box style={{ flexShrink: 0 }}>
                                    <Badge action="info" variant="solid" size="sm" rounded="$full">
                                        <BadgeText size="2xs">UNIT</BadgeText>
                                    </Badge>
                                </Box>
                                <Text size="xs" color="$text600" fontWeight="$medium" numberOfLines={1} style={{ flexShrink: 1 }}>
                                {item.stockQuantity} {item.unit} @ {currency}{(item.price ?? 0).toFixed(2)}
                                </Text>
                            </HStack>
                            {item.barcode && (
                                <HStack space="xs" alignItems="center" ml="$1">
                                    <Icon as={Scan} size="xs" color="$text400" />
                                    <Text size="2xs" color="$text400" fontWeight="$bold" numberOfLines={1}>{item.barcode}</Text>
                                </HStack>
                            )}
                        </VStack>

                        {item.bulkPrice > 0 && (
                            <VStack space="xs">
                                <HStack space="xs" alignItems="center">
                                    <Box style={{ flexShrink: 0 }}>
                                        <Badge action="warning" variant="solid" size="sm" rounded="$full">
                                            <BadgeText size="2xs">{(item.bulkUnit || 'BULK').toUpperCase()}</BadgeText>
                                        </Badge>
                                    </Box>
                                    <Text size="xs" color="$text600" fontWeight="$medium" numberOfLines={1} style={{ flexShrink: 1 }}>
                                    {item.bulkStockQuantity} {item.bulkUnit || 'items'} @ {currency}{(item.bulkPrice ?? 0).toFixed(2)}
                                    </Text>
                                </HStack>
                                {item.bulkBarcode && (
                                    <HStack space="xs" alignItems="center" ml="$1">
                                        <Icon as={Scan} size="xs" color="$text400" />
                                        <Text size="2xs" color="$text400" fontWeight="$bold" numberOfLines={1}>{item.bulkBarcode}</Text>
                                    </HStack>
                                )}
                            </VStack>
                        )}
                    </VStack>
                )}
            </VStack>

            <VStack alignItems="flex-end" space="xs" style={{ flexShrink: 0, minWidth: 70 }}>
                {!isDraft && (
                    <Text size="md" fontWeight="$black" color="$text900" numberOfLines={1}>
                        {currency}{(item.price ?? 0).toFixed(2)}
                    </Text>
                )}
                {isLowStock && !isDraft && (
                    <Box style={{ flexShrink: 0 }}>
                        <Badge action="error" variant="outline" size="sm" rounded="$lg">
                            <BadgeText size="2xs" fontWeight="$bold">LOW STOCK</BadgeText>
                        </Badge>
                    </Box>
                )}
                {isMediumStock && !isDraft && (
                    <Box style={{ flexShrink: 0 }}>
                        <Badge action="warning" variant="outline" size="sm" rounded="$lg">
                            <BadgeText size="2xs" fontWeight="$bold">MEDIUM STOCK</BadgeText>
                        </Badge>
                    </Box>
                )}
                {isHighStock && !isDraft && (
                    <Box style={{ flexShrink: 0 }}>
                        <Badge action="success" variant="outline" size="sm" rounded="$lg">
                            <BadgeText size="2xs" fontWeight="$bold">HIGH STOCK</BadgeText>
                        </Badge>
                    </Box>
                )}
                <Pressable onPress={(e: any) => { e?.stopPropagation?.(); onDelete && onDelete(); }}>
                    <Box mt="$2" p="$2">
                        <Icon as={Trash2} size="sm" color="$text400" />
                    </Box>
                </Pressable>
            </VStack>
        </HStack>
        </Box>
    </Pressable>
  );
};

export default React.memo(ProductListItem);
