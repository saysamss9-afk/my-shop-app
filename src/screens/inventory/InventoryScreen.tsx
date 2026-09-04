import React, { useState, useCallback } from 'react';
import { FlatList, StatusBar } from 'react-native';
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
} from '@gluestack-ui/themed';
import { useInventory } from '../../hooks/useInventory';
import { Product } from '../../db/types';
import { ScannerView } from '../../components/ScannerView';
import { getAppShadow } from '../../utils/platformStyles';

// Sub-components
import ProductListItem from './components/ProductListItem';
import AddProductModal from './components/AddProductModal';
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

  const renderItem = useCallback(({ item }: { item: Product }) => (
    <ProductListItem item={item} currency={currency} />
  ), [currency]);

  return (
    <Box flex={1} bg="$surfaceLavender">
      <StatusBar barStyle="dark-content" backgroundColor="#F3ECFF" />

      <InventoryHeader
        onBack={() => navigation.goBack()}
        onToggleFilter={toggleLowStockFilter}
        showLowStockOnly={showLowStockOnly}
        shopName={shopName}
      />

      <InventorySearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

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
        newProduct={newProduct}
        setNewProduct={setNewProduct}
        onSave={handleSave}
        onScanPress={setScanTarget}
        onAutoBarcode={() => setNewProduct({ ...newProduct, barcode: generateBarcode() })}
        onAutoBulkBarcode={() => setNewProduct({ ...newProduct, bulkBarcode: generateBarcode() })}
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
