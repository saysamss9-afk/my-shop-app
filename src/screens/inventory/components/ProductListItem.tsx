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
} from '@gluestack-ui/themed';
import { CloudOff, CheckCircle2, Scan } from 'lucide-react-native';
import { Product } from '../../../db/types';
import AppIcon from '../../../components/common/AppIcon';
import { getAppShadow } from '../../../utils/platformStyles';

interface Props {
  item: Product;
  currency: string;
}

const ProductListItem: React.FC<Props> = ({ item, currency }) => {
  const isLowStock = item.stockQuantity <= item.minStockLevel;

  return (
    <Box
      bg="$white"
      p="$5"
      rounded="$3xl"
      mb="$4"
      borderWidth={1}
      borderColor="$borderLight"
      style={{ ...getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(0,0,0,0.03)' }) }}
    >
      <HStack space="md" alignItems="center">
        <Center
          w={56}
          h={56}
          rounded={18}
          bg={isLowStock ? '$error50' : '$primary50'}
        >
          <AppIcon
            name="package"
            size={28}
            color={isLowStock ? '#D32F2F' : '#6E3BE6'}
          />
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

          <VStack space="xs">
              <VStack space="xxs">
                  <HStack space="xs" alignItems="center">
                      <Badge action="info" variant="solid" size="sm" rounded="$full">
                          <BadgeText size="xxs">UNIT</BadgeText>
                      </Badge>
                      <Text size="xs" color="$text500">
                      {item.stockQuantity} {item.unit} @ {currency}{item.price.toFixed(2)}
                      </Text>
                  </HStack>
                  {item.barcode && (
                    <HStack space="xs" alignItems="center" ml="$4">
                        <Icon as={Scan} size="xxs" color="$text400" />
                        <Text size="xxs" color="$text400" fontWeight="$bold">{item.barcode}</Text>
                    </HStack>
                  )}
              </VStack>

              <VStack space="xxs">
                  <HStack space="xs" alignItems="center">
                      <Badge action="warning" variant="solid" size="sm" rounded="$full">
                          <BadgeText size="xxs">BULK</BadgeText>
                      </Badge>
                      <Text size="xs" color="$text500">
                      {item.bulkStockQuantity} cartons @ {currency}{item.bulkPrice.toFixed(2)}
                      </Text>
                  </HStack>
                  {item.bulkBarcode && (
                    <HStack space="xs" alignItems="center" ml="$4">
                        <Icon as={Scan} size="xxs" color="$text400" />
                        <Text size="xxs" color="$text400" fontWeight="$bold">{item.bulkBarcode}</Text>
                    </HStack>
                  )}
              </VStack>
          </VStack>
        </VStack>
        <VStack alignItems="flex-end" space="xs">
          <Text size="md" fontWeight="$black" color="$text900">
            {currency}{item.price.toFixed(2)}
          </Text>
          {isLowStock && (
            <Badge action="error" variant="outline" size="sm" rounded="$lg">
              <BadgeText size="xxs" fontWeight="$bold">LOW STOCK</BadgeText>
            </Badge>
          )}
        </VStack>
      </HStack>
    </Box>
  );
};

export default React.memo(ProductListItem);
