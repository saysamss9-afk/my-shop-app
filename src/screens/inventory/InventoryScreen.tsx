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
  FormControlHelper,
  FormControlHelperText,
  CloseIcon,
  ArrowLeftIcon,
  Divider,
} from '@gluestack-ui/themed';
import { Appbar } from 'react-native-paper';
import { Filter, Camera, CloudOff, CheckCircle2 } from 'lucide-react-native';
import { useInventory } from '../../hooks/useInventory';
import { Product } from '../../db/types';
import AppIcon from '../../components/common/AppIcon';
import { ScannerView } from '../../components/ScannerView';
import { getButtonHeight, platformShadow } from '../../utils/platformStyles';

const InventoryScreen = ({ route, navigation }: any) => {
  const { shopId, userRole } = route.params;
  const {
    products,
    categories,
    currency,
    isLoading,
    showLowStockOnly,
    addProduct,
    toggleLowStockFilter,
    generateBarcode,
  } = useInventory(shopId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [entryMode, setEntryMode] = useState<'UNIT' | 'BULK'>('UNIT');
  const [searchQuery, setSearchQuery] = useState('');
  const [scanTarget, setScanTarget] = useState<'unit' | 'bulk' | null>(null);

  const [newProduct, setNewProduct] = useState({
    name: '',
    barcode: '',
    bulkBarcode: '',
    bulkQuantity: '12',
    bulkPrice: '',
    bulkStockQuantity: '',
    price: '',
    costPrice: '',
    stockQuantity: '',
    minStockLevel: '',
    unit: 'pcs',
    categoryId: null as string | null,
  });

  const handleSave = async () => {
    const isUnitMode = entryMode === 'UNIT';
    const hasRequiredFields = isUnitMode
      ? (newProduct.name && newProduct.price)
      : (newProduct.name && newProduct.bulkPrice);

    if (!hasRequiredFields) return;

    await addProduct({
      name: newProduct.name,
      barcode: newProduct.barcode || null,
      bulkBarcode: newProduct.bulkBarcode || null,
      bulkQuantity: parseFloat(newProduct.bulkQuantity) || 1,
      bulkPrice: parseFloat(newProduct.bulkPrice) || 0,
      bulkStockQuantity: parseFloat(newProduct.bulkStockQuantity) || 0,
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
        bulkPrice: '',
        bulkStockQuantity: '',
        price: '',
        costPrice: '',
        stockQuantity: '',
        minStockLevel: '',
        unit: 'pcs',
        categoryId: null,
    });
  };

  const handleBarCodeScanned = (code: string) => {
    if (scanTarget === 'unit') {
      setNewProduct({ ...newProduct, barcode: code });
    } else if (scanTarget === 'bulk') {
      setNewProduct({ ...newProduct, bulkBarcode: code });
    }
    setScanTarget(null);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchQuery)) ||
    (p.id && p.id.includes(searchQuery))
  );

  const renderProduct = ({ item }: { item: Product }) => {
    const isLowStock = item.stockQuantity <= item.minStockLevel;
    return (
      <Box
        bg="$white"
        p="$5"
        rounded="$3xl"
        mb="$4"
        borderWidth={1}
        borderColor="$borderLight"
        style={{ ...platformShadow({ offsetY: 4, radius: 12, color: 'rgba(0,0,0,0.03)' }) }}
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
            <HStack space="xs" alignItems="center">
                <Heading size="sm" color="$text900" fontWeight="$bold">
                {item.name}
                </Heading>
                {item.syncStatus === 0 ? (
                    <Icon as={CloudOff} size="xs" color="$amber600" />
                ) : (
                    <Icon as={CheckCircle2} size="xs" color="$success600" />
                )}
            </HStack>
            <VStack space="xxs">
                <HStack space="xs" alignItems="center">
                    <Badge action="info" variant="solid" size="sm" rounded="$full">
                        <BadgeText size="xxs">UNIT</BadgeText>
                    </Badge>
                    <Text size="xs" color="$text500">
                    {item.stockQuantity} {item.unit} @ {currency}{item.price.toFixed(2)}
                    </Text>
                </HStack>
                <HStack space="xs" alignItems="center">
                    <Badge action="warning" variant="solid" size="sm" rounded="$full">
                        <BadgeText size="xxs">BULK</BadgeText>
                    </Badge>
                    <Text size="xs" color="$text500">
                    {item.bulkStockQuantity} cartons @ {currency}{item.bulkPrice.toFixed(2)}
                    </Text>
                </HStack>
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

  return (
    <Box flex={1} bg="$surfaceLavender">
      <StatusBar barStyle="dark-content" backgroundColor="#F3ECFF" />

      {/* Modern Header */}
      <Box px="$2" pt="$2" pb="$4">
        <HStack justifyContent="space-between" alignItems="center">
          <HStack space="md" alignItems="center">
            <Pressable onPress={() => navigation.goBack()} p="$2" bg="$white" rounded="$full">
              <Icon as={ArrowLeftIcon} color="$text900" />
            </Pressable>
            <VStack>
              <Heading size="lg" color="$text900" fontWeight="$black">Inventory</Heading>
              <Text size="xs" color="$text500">Manage your shop products</Text>
            </VStack>
          </HStack>
          <Pressable
            onPress={toggleLowStockFilter}
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

      {/* Search Section */}
      <Box px="$5" pb="$4">
        <Input variant="outline" size="md" borderRadius={20} bg="$white" borderWidth={0} style={{ ...platformShadow({ offsetY: 4, radius: 16, color: 'rgba(0,0,0,0.04)' }) }}>
          <InputSlot pl="$4">
            <InputIcon as={SearchIcon} color="$primary600" />
          </InputSlot>
          <InputField
            placeholder="Search name, barcode or SKU..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="$text400"
          />
          {searchQuery.length > 0 && (
             <InputSlot pr="$4" onPress={() => setSearchQuery('')}>
               <InputIcon as={CloseIcon} />
             </InputSlot>
          )}
        </Input>
      </Box>

      {isLoading ? (
        <Center flex={1}>
          <Spinner size="large" color="$primary600" />
        </Center>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          ListEmptyComponent={
            <Center mt="$20">
              <VStack space="md" alignItems="center">
                <Center w={100} h={100} bg="$backgroundLight100" rounded="$full">
                    <Icon as={SearchIcon} size="xl" color="$text300" />
                </Center>
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
          onPress={() => setIsSelectionModalOpen(true)}
          bg="$primary600"
          m="$6"
          style={{ ...platformShadow({ offsetY: 10, radius: 26, color: 'rgba(110,59,230,0.28)' }) }}
        >
          <FabIcon as={AddIcon} mr="$2" />
          <FabLabel fontWeight="$black">New Product</FabLabel>
        </Fab>
      )}

      {/* Selection Modal */}
      <Modal
        isOpen={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        size="md"
      >
        <ModalBackdrop />
        <ModalContent rounded="$3xl">
          <ModalHeader borderBottomWidth={0}>
            <Heading size="lg" fontWeight="$black">Choose Entry Type</Heading>
            <ModalCloseButton>
              <Icon as={CloseIcon} />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody pb="$6">
            <VStack space="md">
              <Pressable
                onPress={() => {
                  setEntryMode('UNIT');
                  setIsSelectionModalOpen(false);
                  setIsModalOpen(true);
                }}
              >
                {({ pressed }: any) => (
                  <Box
                    p="$4"
                    rounded="$2xl"
                    bg={pressed ? '$backgroundLight100' : '$white'}
                    borderWidth={1}
                    borderColor="$borderLight"
                    style={{ transform: [{ scale: pressed ? 0.98 : 1 }] }}
                  >
                    <HStack space="md" alignItems="center">
                      <Center w={48} h={48} bg="$primary50" rounded="$xl">
                        <AppIcon name="package" size={24} color="#6E3BE6" />
                      </Center>
                      <VStack flex={1}>
                        <Text fontWeight="$bold" color="$text900">Single Unit Item</Text>
                        <Text size="xs" color="$text500">Retail items sold individually (e.g. 1 can of soda)</Text>
                      </VStack>
                    </HStack>
                  </Box>
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  setEntryMode('BULK');
                  setIsSelectionModalOpen(false);
                  setIsModalOpen(true);
                }}
              >
                {({ pressed }: any) => (
                  <Box
                    p="$4"
                    rounded="$2xl"
                    bg={pressed ? '$backgroundLight100' : '$white'}
                    borderWidth={1}
                    borderColor="$borderLight"
                    style={{ transform: [{ scale: pressed ? 0.98 : 1 }] }}
                  >
                    <HStack space="md" alignItems="center">
                      <Center w={48} h={48} bg="$warning50" rounded="$xl">
                        <AppIcon name="layers" size={24} color="#F59E0B" />
                      </Center>
                      <VStack flex={1}>
                        <Text fontWeight="$bold" color="$text900">Carton / Bulk Item</Text>
                        <Text size="xs" color="$text500">Items sold in packs or cartons (e.g. 1 case of soda)</Text>
                      </VStack>
                    </HStack>
                  </Box>
                )}
              </Pressable>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Add Product Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg">
        <ModalBackdrop />
        <ModalContent rounded="$3xl">
          <ModalHeader>
            <Heading size="lg" fontWeight="$black">
              {entryMode === 'UNIT' ? 'Add New Unit Item' : 'Add New Bulk Item'}
            </Heading>
            <ModalCloseButton>
              <Icon as={CloseIcon} />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <ScrollView showsVerticalScrollIndicator={false}>
              <VStack space="xl" py="$4">
                <FormControl isRequired>
                  <FormControlLabel mb="$1">
                    <FormControlLabelText size="sm">Product Name</FormControlLabelText>
                  </FormControlLabel>
                  <Input borderRadius={16} bg="$backgroundLight50">
                    <InputField
                      placeholder="e.g. Milo 500g"
                      value={newProduct.name}
                      onChangeText={text => setNewProduct({ ...newProduct, name: text })}
                    />
                  </Input>
                </FormControl>

                {entryMode === 'UNIT' ? (
                  <>
                    <FormControl>
                      <FormControlLabel mb="$1">
                        <FormControlLabelText size="sm">Barcode / Code (Type or Scan)</FormControlLabelText>
                      </FormControlLabel>
                      <HStack space="sm">
                        <Input flex={1} borderRadius={16} bg="$backgroundLight50">
                          <InputField
                            placeholder="Manual barcode entry..."
                            value={newProduct.barcode}
                            onChangeText={text => setNewProduct({ ...newProduct, barcode: text })}
                          />
                        </Input>
                        <Button
                            variant="outline"
                            action="primary"
                            onPress={() => setScanTarget('unit')}
                            borderRadius={16}
                            borderColor="$primary600"
                            px="$3"
                        >
                            <Icon as={Camera} color="$primary600" size="sm" />
                        </Button>
                        <Button
                            variant="outline"
                            action="primary"
                            onPress={() => setNewProduct({ ...newProduct, barcode: generateBarcode() })}
                            borderRadius={16}
                            borderColor="$primary600"
                        >
                            <ButtonText size="xs" color="$primary600">Auto</ButtonText>
                        </Button>
                      </HStack>
                    </FormControl>

                    <HStack space="md">
                      <FormControl isRequired flex={1}>
                        <FormControlLabel mb="$1">
                          <FormControlLabelText size="sm">Unit Price</FormControlLabelText>
                        </FormControlLabel>
                        <Input borderRadius={16} bg="$backgroundLight50">
                          <InputField
                            placeholder="0.00"
                            value={newProduct.price}
                            keyboardType="numeric"
                            onChangeText={text => setNewProduct({ ...newProduct, price: text })}
                          />
                        </Input>
                      </FormControl>
                      <FormControl isRequired flex={1}>
                        <FormControlLabel mb="$1">
                          <FormControlLabelText size="sm">Unit Stock</FormControlLabelText>
                        </FormControlLabel>
                        <Input borderRadius={16} bg="$backgroundLight50">
                          <InputField
                            placeholder="0"
                            value={newProduct.stockQuantity}
                            keyboardType="numeric"
                            onChangeText={text => setNewProduct({ ...newProduct, stockQuantity: text })}
                          />
                        </Input>
                      </FormControl>
                    </HStack>

                    <HStack space="md">
                      <FormControl flex={1}>
                        <FormControlLabel mb="$1">
                          <FormControlLabelText size="sm">Cost Price</FormControlLabelText>
                        </FormControlLabel>
                        <Input borderRadius={16} bg="$backgroundLight50">
                          <InputField
                            placeholder="0.00"
                            value={newProduct.costPrice}
                            keyboardType="numeric"
                            onChangeText={text => setNewProduct({ ...newProduct, costPrice: text })}
                          />
                        </Input>
                      </FormControl>
                      <FormControl flex={1}>
                        <FormControlLabel mb="$1">
                          <FormControlLabelText size="sm">Min Stock Level</FormControlLabelText>
                        </FormControlLabel>
                        <Input borderRadius={16} bg="$backgroundLight50">
                          <InputField
                            placeholder="5"
                            value={newProduct.minStockLevel}
                            keyboardType="numeric"
                            onChangeText={text => setNewProduct({ ...newProduct, minStockLevel: text })}
                          />
                        </Input>
                      </FormControl>
                    </HStack>

                  </>
                ) : (
                  <>
                    <FormControl>
                      <FormControlLabel mb="$1">
                        <FormControlLabelText size="sm">Carton Barcode (Type or Scan)</FormControlLabelText>
                      </FormControlLabel>
                      <HStack space="sm">
                        <Input flex={1} borderRadius={16} bg="$backgroundLight50">
                          <InputField
                              placeholder="Scan or type carton barcode..."
                              value={newProduct.bulkBarcode}
                              onChangeText={text => setNewProduct({ ...newProduct, bulkBarcode: text })}
                          />
                        </Input>
                        <Button
                            variant="outline"
                            action="primary"
                            onPress={() => setScanTarget('bulk')}
                            borderRadius={16}
                            borderColor="$primary600"
                            px="$3"
                        >
                            <Icon as={Camera} color="$primary600" size="sm" />
                        </Button>
                      </HStack>
                    </FormControl>

                    <HStack space="md">
                      <FormControl isRequired flex={1}>
                        <FormControlLabel mb="$1">
                          <FormControlLabelText size="sm">Carton Price</FormControlLabelText>
                        </FormControlLabel>
                        <Input borderRadius={16} bg="$backgroundLight50">
                          <InputField
                            placeholder="0.00"
                            value={newProduct.bulkPrice}
                            keyboardType="numeric"
                            onChangeText={text => setNewProduct({ ...newProduct, bulkPrice: text })}
                          />
                        </Input>
                      </FormControl>
                      <FormControl isRequired flex={1}>
                        <FormControlLabel mb="$1">
                          <FormControlLabelText size="sm">Carton Stock</FormControlLabelText>
                        </FormControlLabel>
                        <Input borderRadius={16} bg="$backgroundLight50">
                          <InputField
                            placeholder="0"
                            value={newProduct.bulkStockQuantity}
                            keyboardType="numeric"
                            onChangeText={text => setNewProduct({ ...newProduct, bulkStockQuantity: text })}
                          />
                        </Input>
                      </FormControl>
                    </HStack>

                    <FormControl isRequired>
                      <FormControlLabel mb="$1">
                        <FormControlLabelText size="sm">Units per Carton</FormControlLabelText>
                      </FormControlLabel>
                      <Input borderRadius={16} bg="$backgroundLight50">
                        <InputField
                          placeholder="12"
                          value={newProduct.bulkQuantity}
                          keyboardType="numeric"
                          onChangeText={text => setNewProduct({ ...newProduct, bulkQuantity: text })}
                        />
                      </Input>
                    </FormControl>

                  </>
                )}

              </VStack>
            </ScrollView>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" action="secondary" onPress={() => setIsModalOpen(false)} mr="$3" borderRadius={16}>
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button action="primary" onPress={handleSave} borderRadius={16} bg="$primary600" style={{ height: getButtonHeight(50) }}>
              <ButtonText fontWeight="$bold">Add to Inventory</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Camera Scanner Modal */}
      <Modal
        isOpen={scanTarget !== null}
        onClose={() => setScanTarget(null)}
        size="lg"
      >
        <ModalBackdrop />
        <ModalContent bg="black" rounded="$3xl" overflow="hidden">
          <ModalHeader borderBottomWidth={0} bg="$black">
            <Heading size="md" color="$white">Scan {scanTarget === 'unit' ? 'Unit' : 'Carton'} Barcode</Heading>
            <ModalCloseButton onPress={() => setScanTarget(null)}>
              <Icon as={CloseIcon} color="$white" />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody p="$0" bg="$black">
            <Box h={400} w="100%">
              <ScannerView
                isActive={scanTarget !== null}
                onScan={handleBarCodeScanned}
              />
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default InventoryScreen;
