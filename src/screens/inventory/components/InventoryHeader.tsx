import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Heading,
  Text,
  Icon,
  Pressable,
  ArrowLeftIcon,
} from '@gluestack-ui/themed';
import { Filter } from 'lucide-react-native';

interface Props {
  onBack: () => void;
  onToggleFilter: () => void;
  showLowStockOnly: boolean;
}

const InventoryHeader: React.FC<Props> = ({ onBack, onToggleFilter, showLowStockOnly }) => {
  return (
    <Box px="$2" pt="$2" pb="$4">
      <HStack justifyContent="space-between" alignItems="center">
        <HStack space="md" alignItems="center">
          <Pressable onPress={onBack} p="$2" bg="$white" rounded="$full">
            <Icon as={ArrowLeftIcon} color="$text900" />
          </Pressable>
          <VStack>
            <Heading size="lg" color="$text900" fontWeight="$black">Inventory</Heading>
            <Text size="xs" color="$text500">Manage your shop products</Text>
          </VStack>
        </HStack>
        <Pressable
          onPress={onToggleFilter}
          p="$3"
          bg={showLowStockOnly ? '$error50' : '$white'}
          rounded="$full"
        >
          <Icon
            as={Filter}
            color={showLowStockOnly ? '$error600' : '$text500'}
            size="sm"
          />
        </Pressable>
      </HStack>
    </Box>
  );
};

export default InventoryHeader;
