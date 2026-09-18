import React, { useState, useCallback, useMemo } from 'react';
import { FlatList, StatusBar, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  Box,
  VStack,
  Text as GlueText,
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
import type { Product } from '../../db/types';
import { ScannerView } from '../../components/ScannerView';
import { getAppShadow } from '../../utils/platformStyles';
import { useResponsive } from '../../hooks/useResponsive';

// Sub-components
import ProductListItem from './components/ProductListItem';
import AddProductModal from './components/AddProductModal';
import EditProductModal from './components/EditProductModal';
import EntryTypeModal from './components/EntryTypeModal';
import InventoryHeader from './components/InventoryHeader';
import InventorySearch from './components/InventorySearch';
import { PrintingService } from '../../services/PrintingService';

const InventoryScreen = ({ route, navigation }: any) => {
  const { shopId, userRole } = route.params;
  const { isTablet, isLandscape } = useResponsive();
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
    deleteProduct,
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
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const numColumns = isTablet ? (isLandscape ? 3 : 2) : 1;

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handlePrintSelectedBarcodes = () => {
    const itemsToPrint = products.filter(p => selectedProductIds.includes(p.id));
    if (itemsToPrint.length === 0) {
      Alert.alert('Selection Empty', 'Please select at least one item below by checking it first to print barcodes.');
      return;
    }
    PrintingService.printBarcodes(itemsToPrint);
  };

  const handleSave = async (productData: any) => {
    if (!productData.name) return;

    // Robust parsing of all numeric fields to ensure they don't default to 0 incorrectly
    await addProduct({
      ...productData,
      bulkQuantity: parseFloat(productData.bulkQuantity) || 1,
      bulkPrice: parseFloat(productData.bulkPrice) || 0,
      bulkStockQuantity: parseFloat(productData.bulkStockQuantity) || 0,
      price: parseFloat(productData.price) || 0,
      costPrice: parseFloat(productData.costPrice) || 0,
      stockQuantity: parseFloat(productData.stockQuantity) || 0,
      minStockLevel: parseFloat(productData.minStockLevel) || 0,
      description: productData.description || null,
      supplierId: productData.supplierId || null,
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
    return matchesSearch && p.status !== 'ARCHIVED' && p.status !== 'DELETED';
  });

  const handleItemPress = (product: Product) => {
      setSelectedProduct(product);
      setIsEditModalOpen(true);
  };

  const handleDelete = (product: Product) => {
    const message = `Remove "${product.name}" from inventory? This cannot be undone.`;

    if (typeof window !== 'undefined' && (window as any).confirm) {
      if (window.confirm(message)) {
        deleteProduct(product.id);
      }
    } else {
      Alert.alert(
        'Delete item',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: async () => { await deleteProduct(product.id); } }
        ]
      );
    }
  };

  const renderItem = useCallback(({ item }: { item: Product }) => (
    <Box flex={1} mx={numColumns > 1 ? "$2" : "$0"}>
      <ProductListItem
        item={item}
        currency={currency}
        onPress={() => handleItemPress(item)}
        onDelete={() => handleDelete(item)}
        isSelected={selectedProductIds.includes(item.id)}
        onSelectToggle={() => toggleSelectProduct(item.id)}
      />
    </Box>
  ), [currency, selectedProductIds, numColumns]);

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
        onAdd={() => setIsSelectionModalOpen(true)}
        userRole={userRole}
      />

      <InventorySearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Quick Add / Print Barcodes Actions Row */}
      {(userRole === 'OWNER' || userRole === 'MANAGER' || userRole === 'SALES') && (
        <HStack px="$5" mb="$4" space="sm">
            <Pressable
                onPress={() => setIsSelectionModalOpen(true)}
                bg="$primary600"
                p="$3.5"
                rounded="$2xl"
                flex={1}
                style={{ ...getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(110,59,230,0.25)' }) }}
            >
                <HStack space="sm" alignItems="center" justifyContent="center">
                    <Icon as={AddIcon} color="white" size="sm" />
                    <GlueText color="white" fontWeight="$bold" size="sm">Add Product</GlueText>
                </HStack>
            </Pressable>

            <Pressable
                onPress={handlePrintSelectedBarcodes}
                bg={selectedProductIds.length > 0 ? "$success600" : "$white"}
                borderWidth={1}
                borderColor={selectedProductIds.length > 0 ? "$success600" : "$primary600"}
                p="$3.5"
                rounded="$2xl"
                flex={1}
                style={{ ...getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(0,0,0,0.03)' }) }}
            >
                <HStack space="sm" alignItems="center" justifyContent="center">
                    <MaterialCommunityIcons name="printer-matrix" size={16} color={selectedProductIds.length > 0 ? "#fff" : "#6E3BE6"} />
                    <GlueText color={selectedProductIds.length > 0 ? "$white" : "$primary600"} fontWeight="$bold" size="sm">
                        {selectedProductIds.length > 0 ? `Print (${selectedProductIds.length}) Selected` : 'Print Barcodes'}
                    </GlueText>
                </HStack>
            </Pressable>
        </HStack>
      )}

      {/* Tabs */}
      <HStack px="$5" space="md" mb="$4">
          <Pressable onPress={() => setActiveTab('ALL')} flex={1}>
              <Box pb="$2" borderBottomWidth={2} borderBottomColor={activeTab === 'ALL' ? '$primary600' : 'transparent'}>
                  <GlueText textAlign="center" fontWeight={activeTab === 'ALL' ? '$bold' : '$medium'} color={activeTab === 'ALL' ? '$primary600' : '$text400'}>
                      Inventory
                  </GlueText>
              </Box>
          </Pressable>
          <Pressable onPress={() => setActiveTab('PENDING')} flex={1}>
              <HStack justifyContent="center" space="xs" pb="$2" borderBottomWidth={2} borderBottomColor={activeTab === 'PENDING' ? '$warning600' : 'transparent'}>
                  <GlueText fontWeight={activeTab === 'PENDING' ? '$bold' : '$medium'} color={activeTab === 'PENDING' ? '$warning600' : '$text400'}>
                      Pending Review
                  </GlueText>
                  {pendingCount > 0 && (
                      <Box bg="$warning600" px="$2" rounded="$full" justifyContent="center">
                            <GlueText color="white"size="2xs" fontWeight="$bold">{pendingCount}</GlueText>
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
          key={numColumns}
          data={filteredProducts}
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          ListEmptyComponent={
            <Center mt="$20">
              <VStack space="md" alignItems="center">
                <Center w={100} h={100} bg="$backgroundLight100" rounded="$full">
                    <Icon as={SearchIcon} size="xl" color="$text300" />
                </Center>
                <GlueText color="$text400">
                    {activeTab === 'PENDING' ? 'No pending items to review.' : 'No items found in inventory.'}
                </GlueText>
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
        categories={categories}
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
        canEdit={userRole === 'OWNER' || userRole === 'MANAGER' || userRole === 'ADMIN'}
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
