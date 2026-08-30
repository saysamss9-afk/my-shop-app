import React, { useState } from 'react';
import { FlatList, ScrollView, StatusBar } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Pressable,
  Center,
  Badge,
  BadgeText,
  Spinner,
  Input,
  InputField,
  InputSlot,
  InputIcon,
  SearchIcon,
  Button,
  ButtonText,
  ButtonIcon,
  Fab,
  FabIcon,
  FabLabel,
  AddIcon,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  CloseIcon,
} from '@gluestack-ui/themed';
import { Appbar } from 'react-native-paper';
import { Filter } from 'lucide-react-native';
import { useInventory } from '../../hooks/useInventory';
import { Product } from '../../db/types';
import AppIcon from '../../components/common/AppIcon';

const InventoryScreen = ({ route, navigation }: any) => {
  const { shopId, userRole } = route.params;
  const {
    products,
    isLoading,
    showLowStockOnly,
    addProduct,
    toggleLowStockFilter,
    generateBarcode,
  } = useInventory(shopId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    barcode: '',
    bulkBarcode: '',
    bulkQuantity: '12',
    price: '',
    costPrice: '',
    stockQuantity: '',
    minStockLevel: '',
    unit: 'pcs',
    categoryId: null as string | null,
  });

  const handleSave = async () => {
    if (!newProduct.name || !newProduct.price) return;

    await addProduct({
      name: newProduct.name,
      barcode: newProduct.barcode || null,
      bulkBarcode: newProduct.bulkBarcode || null,
      bulkQuantity: parseFloat(newProduct.bulkQuantity) || 1,
      price: parseFloat(newProduct.price) || 0,
      costPrice: parseFloat(newProduct.costPrice) || 0,
      stockQuantity: parseFloat(newProduct.stockQuantity) || 0,
      minStockLevel: parseFloat(newProduct.minStockLevel) || 0,
      unit: newProduct.unit,
      categoryId: newProduct.categoryId,
      description: null,
      supplierId: null,
    });
    setIsModalOpen(false);
    setNewProduct({
        name: '',
        barcode: '',
        bulkBarcode: '',
        bulkQuantity: '12',
        price: '',
        costPrice: '',
        stockQuantity: '',
        minStockLevel: '',
        unit: 'pcs',
        categoryId: null,
    });
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchQuery))
  );

  const renderProduct = ({ item }: { item: Product }) => {
    const isLowStock = item.stockQuantity <= item.minStockLevel;
    return (
      <Box
        bg="$white"
        p="$4"
        rounded="$2xl"
        mb="$3"
        borderWidth={1}
        borderColor="$borderLight"
        shadowColor="$primary800"
      >
        <HStack space="md" alignItems="center">
          <Center
            w={54}
            h={54}
            rounded={14}
            bg={isLowStock ? '$error50' : '$success50'}
          >
            <AppIcon
              name="package"
              size={28}
              color={isLowStock ? '#D32F2F' : '#388E3C'}
            />
          </Center>
          <VStack flex={1} space="xs">
            <Heading size="sm" color="$text900">
              {item.name}
            </Heading>
            <Text size="xs" color="$text500">
              {item.stockQuantity} {item.unit} in stock
            </Text>
          </VStack>
          <VStack alignItems="flex-end" space="xs">
            <Text size="lg" fontWeight="$black" color="$text900">
              ${item.price.toFixed(2)}
            </Text>
            {isLowStock && (
              <Badge action="error" variant="solid" size="sm" rounded="$lg">
                <BadgeText fontWeight="$bold">LOW STOCK</BadgeText>
              </Badge>
            )}
          </VStack>
        </HStack>
      </Box>
    );
  };

  return (
    <Box flex={1} bg="$backgroundLight50">
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />

      {/* Modern Solid Header */}
      <Box bg="$primary800">
        <Appbar.Header style={{ backgroundColor: 'transparent', elevation: 0 }}>
          <Appbar.BackAction color="white" onPress={() => navigation.goBack()} />
          <Appbar.Content
            title="Stock Inventory"
            titleStyle={{ color: 'white', fontWeight: '900', fontSize: 20 }}
          />
          <Pressable onPress={toggleLowStockFilter} p="$3">
            <Icon
              as={Filter}
              color={showLowStockOnly ? '$error400' : 'white'}
              size="md"
            />
          </Pressable>
        </Appbar.Header>
      </Box>

      {/* Search Section */}
      <Box p="$5" bg="$white" borderBottomWidth={1} borderColor="$borderLight">
        <Input variant="outline" size="md" borderRadius={12}>
          <InputSlot pl="$3">
            <InputIcon as={SearchIcon} color="$primary800" />
          </InputSlot>
          <InputField
            placeholder="Search by name or code..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
             <InputSlot pr="$3" onPress={() => setSearchQuery('')}>
               <InputIcon as={CloseIcon} />
             </InputSlot>
          )}
        </Input>
      </Box>

      {isLoading ? (
        <Center flex={1}>
          <Spinner size="large" color="$primary800" />
        </Center>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <Center mt="$20">
              <VStack space="md" alignItems="center">
                <Icon as={SearchIcon} size="xl" color="$text300" />
                <Text color="$text400">No items found in inventory.</Text>
              </VStack>
            </Center>
          }
        />
      )}

      {(userRole === 'OWNER' || userRole === 'MANAGER') && (
        <Fab
          size="lg"
          placement="bottom right"
          onPress={() => setIsModalOpen(true)}
          bg="$primary800"
          m="$4"
          sx={{
            ':active': {
                bg: '$primary900'
            }
          }}
        >
          <FabIcon as={AddIcon} mr="$2" />
          <FabLabel fontWeight="$bold">Add Product</FabLabel>
        </Fab>
      )}

      {/* Add Product Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg">
        <ModalBackdrop />
        <ModalContent rounded="$3xl">
          <ModalHeader>
            <Heading size="lg">New Product</Heading>
            <ModalCloseButton>
              <Icon as={CloseIcon} />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <ScrollView showsVerticalScrollIndicator={false}>
              <VStack space="lg" py="$4">
                <FormControl isRequired>
                  <FormControlLabel mb="$1">
                    <FormControlLabelText>Product Name</FormControlLabelText>
                  </FormControlLabel>
                  <Input borderRadius={10}>
                    <InputField
                      value={newProduct.name}
                      onChangeText={text => setNewProduct({ ...newProduct, name: text })}
                    />
                  </Input>
                </FormControl>

                <FormControl>
                  <FormControlLabel mb="$1">
                    <FormControlLabelText>Barcode</FormControlLabelText>
                  </FormControlLabel>
                  <HStack space="md">
                    <Input flex={1} borderRadius={10}>
                      <InputField
                        value={newProduct.barcode}
                        onChangeText={text => setNewProduct({ ...newProduct, barcode: text })}
                      />
                    </Input>
                    <Button
                        variant="outline"
                        action="secondary"
                        onPress={() => setNewProduct({ ...newProduct, barcode: generateBarcode() })}
                    >
                        <ButtonIcon as={SearchIcon} />
                    </Button>
                  </HStack>
                </FormControl>

                <HStack space="md">
                  <FormControl isRequired flex={1}>
                    <FormControlLabel mb="$1">
                      <FormControlLabelText>Retail Price</FormControlLabelText>
                    </FormControlLabel>
                    <Input borderRadius={10}>
                      <InputField
                        value={newProduct.price}
                        keyboardType="numeric"
                        onChangeText={text => setNewProduct({ ...newProduct, price: text })}
                      />
                    </Input>
                  </FormControl>
                  <FormControl flex={1}>
                    <FormControlLabel mb="$1">
                      <FormControlLabelText>Cost Price</FormControlLabelText>
                    </FormControlLabel>
                    <Input borderRadius={10}>
                      <InputField
                        value={newProduct.costPrice}
                        keyboardType="numeric"
                        onChangeText={text => setNewProduct({ ...newProduct, costPrice: text })}
                      />
                    </Input>
                  </FormControl>
                </HStack>

                <HStack space="md">
                  <FormControl isRequired flex={1}>
                    <FormControlLabel mb="$1">
                      <FormControlLabelText>Initial Stock</FormControlLabelText>
                    </FormControlLabel>
                    <Input borderRadius={10}>
                      <InputField
                        value={newProduct.stockQuantity}
                        keyboardType="numeric"
                        onChangeText={text => setNewProduct({ ...newProduct, stockQuantity: text })}
                      />
                    </Input>
                  </FormControl>
                  <FormControl flex={1}>
                    <FormControlLabel mb="$1">
                      <FormControlLabelText>Min Level</FormControlLabelText>
                    </FormControlLabel>
                    <Input borderRadius={10}>
                      <InputField
                        value={newProduct.minStockLevel}
                        keyboardType="numeric"
                        onChangeText={text => setNewProduct({ ...newProduct, minStockLevel: text })}
                      />
                    </Input>
                  </FormControl>
                </HStack>
              </VStack>
            </ScrollView>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" action="secondary" onPress={() => setIsModalOpen(false)} mr="$3" borderRadius="$lg">
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button action="primary" onPress={handleSave} borderRadius="$lg" bg="$primary800">
              <ButtonText>Save Product</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default InventoryScreen;
