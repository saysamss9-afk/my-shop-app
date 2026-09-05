import React, { useState, useCallback, useMemo } from 'react';
import { FlatList, StatusBar, Alert } from 'react-native';
import {
  Box,
  VStack,
  Text,
  Icon,
  Center,
  Spinner,
  SearchIcon,
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
  Heading,
  CloseIcon,
  HStack,
  Pressable,
} from '@gluestack-ui/themed';
import { useInventory } from '../../hooks/useInventory';
import { Product } from '../../db/types';
import { ScannerView } from '../../components/ScannerView';
import { getAppShadow } from '../../utils/platformStyles';

// Sub-components
import ProductListItem from './components/ProductListItem';
import AddProductModal from './components/AddProductModal';
import EditProductModal from './components/EditProductModal';
import EntryTypeModal from './components/EntryTypeModal';
import InventoryHeader from './components/InventoryHeader';
import InventorySearch from './components/InventorySearch';

const InventoryScreen = ({ route, navigation }: any) => {
  const { shopId, userRole } = route.params;
  const {
    products,
    categories,
    currency,
    shopName,
    isLoading,
    syncStatus,
    showLowStockOnly,
    addProduct,
    updateProduct,
    toggleLowStockFilter,
    generateBarcode,
    triggerManualSync,
  } = useInventory(shopId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [entryMode, setEntryMode] = useState<'UNIT' | 'BULK'>('UNIT');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING'>('ALL');
  const [scanTarget, setScanTarget] = useState<'unit' | 'bulk' | null>(null);

  const handleSave = async (productData: any) => {
    const isUnitMode = entryMode === 'UNIT';
    const hasRequiredFields = isUnitMode
      ? (productData.name && productData.price)
      : (productData.name && productData.bulkPrice);

    if (!hasRequiredFields) return;

    await addProduct({
      name: productData.name,
      barcode: productData.barcode || null,
      bulkBarcode: productData.bulkBarcode || null,
      bulkQuantity: parseFloat(productData.bulkQuantity) || 1,
      bulkPrice: parseFloat(productData.bulkPrice) || 0,
      bulkStockQuantity: parseFloat(productData.bulkStockQuantity) || 0,
      price: parseFloat(productData.price) || 0,
      costPrice: parseFloat(productData.costPrice) || 0,
      stockQuantity: parseFloat(productData.stockQuantity) || 0,
      minStockLevel: parseFloat(productData.minStockLevel) || 0,
      unit: productData.unit,
      categoryId: productData.categoryId,
      description: null,
      supplierId: null,
      status: 'ACTIVE',
    });
    setIsModalOpen(false);
  };

  const handleUpdate = async (updatedProduct: Product) => {
      await updateProduct(updatedProduct);
      setIsEditModalOpen(false);
  };

  const handleBarCodeScanned = (code: string) => {
    console.log("Scanned barcode:", code);
  };

  const pendingCount = useMemo(() => products.filter(p => p.status === 'DRAFT').length, [products]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (p.barcode && p.barcode.includes(searchQuery)) ||
                         (p.id && p.id.includes(searchQuery));

    if (activeTab === 'PENDING') return matchesSearch && p.status === 'DRAFT';
    return matchesSearch && p.status !== 'ARCHIVED';
  });

  const handleItemPress = (product: Product) => {
      setSelectedProduct(product);
      setIsEditModalOpen(true);
  };

  const renderItem = useCallback(({ item }: { item: Product }) => (
    <ProductListItem item={item} currency={currency} onPress={() => handleItemPress(item)} />
  ), [currency]);

  return (
    <Box flex={1} bg="$surfaceLavender">
      <StatusBar barStyle="dark-content" backgroundColor="#F3ECFF" />

      <InventoryHeader
        onBack={() => navigation.goBack()}
        onToggleFilter={toggleLowStockFilter}
        showLowStockOnly={showLowStockOnly}
        shopName={shopName}
        syncStatus={syncStatus}
        onTriggerSync={triggerManualSync}
      />

      <InventorySearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Tabs */}
      <HStack px="$5" space="md" mb="$4">
          <Pressable onPress={() => setActiveTab('ALL')} flex={1}>
              <Box pb="$2" borderBottomWidth={2} borderBottomColor={activeTab === 'ALL' ? '$primary600' : 'transparent'}>
                  <Text textAlign="center" fontWeight={activeTab === 'ALL' ? '$bold' : '$medium'} color={activeTab === 'ALL' ? '$primary600' : '$text400'}>
                      Inventory
                  </Text>
              </Box>
          </Pressable>
          <Pressable onPress={() => setActiveTab('PENDING')} flex={1}>
              <HStack justifyContent="center" space="xs" pb="$2" borderBottomWidth={2} borderBottomColor={activeTab === 'PENDING' ? '$warning600' : 'transparent'}>
                  <Text fontWeight={activeTab === 'PENDING' ? '$bold' : '$medium'} color={activeTab === 'PENDING' ? '$warning600' : '$text400'}>
                      Pending Review
                  </Text>
                  {pendingCount > 0 && (
                      <Box bg="$warning600" px="$2" rounded="$full" justifyContent="center">
                          <Text color="white" size="xxs" fontWeight="$bold">{pendingCount}</Text>
                      </Box>
                  )}
              </HStack>
          </Pressable>
      </HStack>

      {isLoading ? (
        <Center flex={1}>
          <Spinner size="large" color="$primary600" />
        </Center>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          ListEmptyComponent={
            <Center mt="$20">
              <VStack space="md" alignItems="center">
                <Center w={100} h={100} bg="$backgroundLight100" rounded="$full">
                    <Icon as={SearchIcon} size="xl" color="$text300" />
                </Center>
                <Text color="$text400">
                    {activeTab === 'PENDING' ? 'No pending items to review.' : 'No items found in inventory.'}
                </Text>
              </VStack>
            </Center>
          }
        />
      )}

      {(userRole === 'OWNER' || userRole === 'MANAGER' || userRole === 'SALES') && (
        <Fab
          size="lg"
          placement="bottom right"
          onPress={() => setIsSelectionModalOpen(true)}
          bg="$primary600"
          m="$6"
          style={{ ...getAppShadow({ offsetY: 10, radius: 26, color: 'rgba(110,59,230,0.28)' }) }}
        >
          <FabIcon as={AddIcon} mr="$2" />
          <FabLabel fontWeight="$black">New Product</FabLabel>
        </Fab>
      )}

      <EntryTypeModal
        isOpen={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        onSelect={(mode) => {
            setEntryMode(mode);
            setIsSelectionModalOpen(false);
            setIsModalOpen(true);
        }}
      />

      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entryMode={entryMode}
        onSave={handleSave}
        onScanPress={setScanTarget}
        generateBarcode={generateBarcode}
      />

      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => {
            setIsEditModalOpen(false);
            setSelectedProduct(null);
        }}
        product={selectedProduct}
        categories={categories}
        onSave={handleUpdate}
        onScanPress={setScanTarget}
        generateBarcode={generateBarcode}
      />

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
