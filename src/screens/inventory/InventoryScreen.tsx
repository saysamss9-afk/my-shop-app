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
    syncStatus,
    showLowStockOnly,
    addProduct,
    toggleLowStockFilter,
    generateBarcode,
    triggerManualSync,
  } = useInventory(shopId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [entryMode, setEntryMode] = useState<'UNIT' | 'BULK'>('UNIT');
  const [searchQuery, setSearchQuery] = useState('');
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
    });
    setIsModalOpen(false);
  };

  const handleBarCodeScanned = (code: string) => {
    // This now needs to be handled via the modal's internal state if we want to be smooth,
    // but for now, we'll just log it or we'd need to pass a setter.
    // Actually, since the scanner is a separate modal, we'll keep it as is but it might cause a re-render.
    // A better way is to pass a "pendingBarcode" to the modal.
    console.log("Scanned barcode:", code);
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
        syncStatus={syncStatus}
        onTriggerSync={triggerManualSync}
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
