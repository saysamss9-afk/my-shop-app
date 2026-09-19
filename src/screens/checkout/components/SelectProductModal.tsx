import React, { useState, useMemo } from 'react';
import { FlatList } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Pressable,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Input,
  InputField,
  InputSlot,
  InputIcon,
  SearchIcon,
  CloseIcon,
  AddIcon,
  Center,
  Badge,
  BadgeText,
} from '@gluestack-ui/themed';
import type { Product, Category } from '../../../db/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  currency: string;
  onSelect: (product: Product, isBulk: boolean) => void;
}

const SelectProductModal: React.FC<Props> = ({
  isOpen,
  onClose,
  products,
  categories,
  currency,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [localQuery, setLocalQuery] = useState('');

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
        setSearchQuery(localQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [localQuery]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const category = categories.find(c => c.id === p.categoryId);
      const categoryName = category ? category.name.toLowerCase() : '';
      const lowerQuery = searchQuery.toLowerCase();

      return p.status === 'ACTIVE' &&
        (p.name.toLowerCase().includes(lowerQuery) ||
        categoryName.includes(lowerQuery) ||
        (p.barcode && p.barcode.includes(searchQuery)) ||
        (p.bulkBarcode && p.bulkBarcode.includes(searchQuery)));
    });
  }, [products, categories, searchQuery]);

  const renderItem = ({ item }: { item: Product }) => (
    <Box
      mb="$3"
      p="$4"
      bg="$backgroundLight0"
      rounded="$xl"
      borderWidth={1}
      borderColor="$borderLight"
    >
      <VStack space="md">
        <HStack justifyContent="space-between" alignItems="center">
          <VStack flex={1}>
            <Text fontWeight="$bold" color="$text900" size="md">{item.name}</Text>
            {item.barcode && <Text size="xs" color="$text400">Barcode: {item.barcode}</Text>}
          </VStack>
          <Badge action="info" variant="outline" rounded="$md">
            <BadgeText size="xs">{item.unit}</BadgeText>
          </Badge>
        </HStack>

        <HStack space="md">
          {/* Unit Option */}
          <Pressable
            flex={1}
            onPress={() => onSelect(item, false)}
            disabled={item.stockQuantity <= 0}
            opacity={item.stockQuantity <= 0 ? 0.5 : 1}
          >
            <VStack
              p="$3"
              rounded="$lg"
              borderWidth={1}
              borderColor="$primary200"
              bg="$primary50"
              alignItems="center"
              space="xs"
            >
              <Text size="2xs" fontWeight="$bold" color="$primary700">UNIT</Text>
              <Text size="sm" fontWeight="$bold" color="$text900">{currency}{(Number(item.price) || 0).toFixed(2)}</Text>
              <Text size="2xs" color="$text500">Stock: {item.stockQuantity ?? 0}</Text>
            </VStack>
          </Pressable>

          {/* Bulk Option */}
          {(item.bulkPrice > 0 || item.bulkStockQuantity > 0) && (
            <Pressable
              flex={1}
              onPress={() => onSelect(item, true)}
              disabled={item.bulkStockQuantity <= 0}
              opacity={item.bulkStockQuantity <= 0 ? 0.5 : 1}
            >
              <VStack
                p="$3"
                rounded="$lg"
                borderWidth={1}
                borderColor="$secondary200"
                bg="$secondary50"
                alignItems="center"
                space="xs"
              >
                <Text size="2xs" fontWeight="$bold" color="$secondary700">{(item.bulkUnit || 'BULK').toUpperCase()} ({item.bulkQuantity ?? 1})</Text>
                <Text size="sm" fontWeight="$bold" color="$text900">{currency}{(Number(item.bulkPrice) || 0).toFixed(2)}</Text>
                <Text size="2xs" color="$text500">Stock: {item.bulkStockQuantity ?? 0}</Text>
              </VStack>
            </Pressable>
          )}
        </HStack>
      </VStack>
    </Box>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalBackdrop />
      <ModalContent h="80%" rounded="$3xl">
        <ModalHeader borderBottomWidth={1} borderColor="$borderLight" pb="$4">
          <VStack space="xs">
            <Heading size="lg" fontWeight="$black">Select Product</Heading>
            <Text size="xs" color="$text500">Search and tap an option to add to cart</Text>
          </VStack>
          <ModalCloseButton>
            <Icon as={CloseIcon} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody p="$0">
          <Box p="$4" bg="$backgroundLight50" borderBottomWidth={1} borderColor="$borderLight">
            <Input variant="outline" size="md" borderRadius={12} bg="$white">
              <InputSlot pl="$3">
                <InputIcon as={SearchIcon} color="$primary600" />
              </InputSlot>
              <InputField
                placeholder="Search products in stock..."
                value={localQuery}
                onChangeText={setLocalQuery}
                autoFocus
              />
              {localQuery.length > 0 && (
                <InputSlot pr="$3" onPress={() => { setLocalQuery(''); setSearchQuery(''); }}>
                  <InputIcon as={CloseIcon} />
                </InputSlot>
              )}
            </Input>
          </Box>

          <FlatList
            data={filteredProducts}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={
              <Center mt="$20">
                <Text color="$text400">No matching products in stock.</Text>
              </Center>
            }
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default SelectProductModal;
