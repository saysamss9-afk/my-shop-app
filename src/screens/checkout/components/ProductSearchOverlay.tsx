import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Pressable,
  Divider,
  AddIcon,
} from '@gluestack-ui/themed';
import { platformShadow } from '../../../utils/platformStyles';
import { Product } from '../../../db/types';

interface Props {
  filteredProducts: Product[];
  currency: string;
  onSelect: (product: Product) => void;
}

const ProductSearchOverlay: React.FC<Props> = ({ filteredProducts, currency, onSelect }) => {
  if (filteredProducts.length === 0) return null;

  return (
    <Box position="absolute" top={55} left={20} right={20} bg="$white" rounded="$2xl" borderWidth={1} borderColor="$borderLight" style={{ ...platformShadow({ offsetY: 10, radius: 24, color: 'rgba(0,0,0,0.08)' }), zIndex: 100 }}>
      <VStack>
        {filteredProducts.slice(0, 5).map((item, index) => (
          <React.Fragment key={item.id}>
            <Pressable
              onPress={() => onSelect(item)}
              p="$4"
              sx={{ ':active': { bg: '$backgroundLight50' } }}
            >
              <HStack justifyContent="space-between" alignItems="center">
                <VStack space="xs">
                    <Text fontWeight="$bold" color="$text900">{item.name}</Text>
                    <Text size="xs" color="$text500">
                      Stock: {item.stockQuantity} • {currency}{item.price.toFixed(2)}
                      {item.barcode ? ` • ${item.barcode}` : ''}
                    </Text>
                </VStack>
                <Icon as={AddIcon} color="$primary600" />
              </HStack>
            </Pressable>
            {index < Math.min(filteredProducts.length, 5) - 1 && <Divider />}
          </React.Fragment>
        ))}
      </VStack>
    </Box>
  );
};

export default ProductSearchOverlay;
