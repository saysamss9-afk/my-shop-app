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
}

const ProductListItem: React.FC<Props> = ({ item, currency, onPress, onDelete }) => {
  const isLowStock = item.stockQuantity <= item.minStockLevel;
  const isDraft = item.status === 'DRAFT';

  return (
    <Pressable onPress={onPress}>
        <Box
        bg="$white"
        p="$5"
        rounded="$3xl"
        mb="$4"
        borderWidth={1}
        borderColor={isDraft ? "$warning300" : "$borderLight"}
        style={{ ...getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(0,0,0,0.03)' }) }}
        >
        <HStack space="md" alignItems="center">
            <Center
            w={56}
            h={56}
            rounded={18}
            bg={isDraft ? "$warning50" : (isLowStock ? '$error50' : '$primary50')}
            >
            {isDraft ? (
                <Icon as={AlertCircle} color="$warning600" size="md" />
            ) : (
                <AppIcon
                    name="package"
                    size={28}
                    color={isLowStock ? '#D32F2F' : '#6E3BE6'}
                />
            )}
            </Center>
            <VStack flex={1} space="xs">
            <HStack space="xs" alignItems="center" justifyContent="space-between">
                <Heading size="sm" color="$text900" fontWeight="$black" flex={1}>
                    {item.name}
                </Heading>
                {item.syncStatus === 0 ? (
                    <Icon as={CloudOff} size="xs" color="$amber600" />
                ) : (
                    <Icon as={CheckCircle2} size="xs" color="$success600" />
                )}
            </HStack>

            {isDraft ? (
                <VStack space="xs">
                    <Badge action="warning" variant="outline" size="sm" rounded="$lg">
                        <BadgeText size="xxs" fontWeight="$bold">PENDING REVIEW</BadgeText>
                    </Badge>
                    <Text size="xs" color="$text500">Stocked during purchase. Needs barcode & pricing.</Text>
                </VStack>
            ) : (
                <VStack space="xs">
                    <VStack space="xxs">
                        <HStack space="xs" alignItems="center">
                            <Badge action="info" variant="solid" size="sm" rounded="$full">
                                <BadgeText size="xxs">UNIT</BadgeText>
                            </Badge>
                            <Text size="xs" color="$text500">
                            {item.stockQuantity} {item.unit} @ {currency}{(item.price ?? 0).toFixed(2)}
                            </Text>
                        </HStack>
                        {item.barcode && (
                            <HStack space="xs" alignItems="center" ml="$4">
                                <Icon as={Scan} size="xs" color="$text400" />
                                <Text size="xxs" color="$text400" fontWeight="$bold">{item.barcode}</Text>
                            </HStack>
                        )}
                    </VStack>

                    {item.bulkPrice > 0 && (
                        <VStack space="xxs">
                            <HStack space="xs" alignItems="center">
                                <Badge action="warning" variant="solid" size="sm" rounded="$full">
                                    <BadgeText size="xxs">{(item.bulkUnit || 'BULK').toUpperCase()}</BadgeText>
                                </Badge>
                                <Text size="xs" color="$text500">
                                {item.bulkStockQuantity} {item.bulkUnit || 'items'} @ {currency}{(item.bulkPrice ?? 0).toFixed(2)}
                                </Text>
                            </HStack>
                            {item.bulkBarcode && (
                                <HStack space="xs" alignItems="center" ml="$4">
                                    <Icon as={Scan} size="xs" color="$text400" />
                                    <Text size="xxs" color="$text400" fontWeight="$bold">{item.bulkBarcode}</Text>
                                </HStack>
                            )}
                        </VStack>
                    )}
                </VStack>
            )}
            </VStack>
            <VStack alignItems="flex-end" space="xs">
            {!isDraft && (
                <Text size="md" fontWeight="$black" color="$text900">
                    {currency}{(item.price ?? 0).toFixed(2)}
                </Text>
            )}
            {isLowStock && !isDraft && (
                <Badge action="error" variant="outline" size="sm" rounded="$lg">
                <BadgeText size="xxs" fontWeight="$bold">LOW STOCK</BadgeText>
                </Badge>
            )}
            {/** Delete action */}
                        <Pressable onPress={(e: any) => { e?.stopPropagation?.(); onDelete && onDelete(); }}>
                            <Box mt="$2">
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
