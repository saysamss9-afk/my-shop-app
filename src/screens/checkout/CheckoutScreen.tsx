import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { FlatList, StatusBar, Modal as RNModal, Alert } from 'react-native';
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
  Input,
  InputField,
  InputSlot,
  InputIcon,
  SearchIcon,
  CloseIcon,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import { Scan, User, UserPlus } from 'lucide-react-native';
import { useCheckout } from '../../hooks/useCheckout';
import { useInventory } from '../../hooks/useInventory';
import { useCustomers } from '../../hooks/useCustomers';
import AppIcon from '../../components/common/AppIcon';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import { ScannerView } from '../../components/ScannerView';
import { getButtonHeight, getAppShadow } from '../../utils/platformStyles';
import SelectCustomerModal from './components/SelectCustomerModal';
import SelectProductModal from './components/SelectProductModal';

// Sub-components
import CheckoutHeader from './components/CheckoutHeader';
import CartItemRow from './components/CartItemRow';
import CheckoutFooter from './components/CheckoutFooter';
import PaymentModal from './components/PaymentModal';
import ProductSearchOverlay from './components/ProductSearchOverlay';

const CheckoutScreen = ({ route, navigation }: any) => {
  const { shopId, employeeId } = route.params;
  const {
    cart,
    total,
    currency,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    processSale,
    searchProductByBarcode,
    selectedCustomerId,
    setSelectedCustomerId,
  } = useCheckout(shopId, employeeId);

  const { customers, addCustomer } = useCustomers(shopId);
  const { products: inventoryProducts, categories } = useInventory(shopId);
  const [searchQuery, setSearchQuery] = useState('');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [isScannerVisible, setIsScannerVisible] = useState(false);

  // Debounce checkout search
  useEffect(() => {
    const handler = setTimeout(() => {
        setSearchQuery(localSearchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearchQuery]);

  const selectedCustomer = useMemo(() => customers.find(c => c.id === selectedCustomerId) || null, [customers, selectedCustomerId]);

  const filteredProducts = useMemo(() => {
    if (searchQuery.length === 0) return [];

    return inventoryProducts.filter(p => {
      const category = categories.find(c => c.id === p.categoryId);
      const categoryName = category ? category.name.toLowerCase() : '';
      const lowerQuery = searchQuery.toLowerCase();

      return p.status === 'ACTIVE' && (
        p.name.toLowerCase().includes(lowerQuery) ||
        categoryName.includes(lowerQuery) ||
        (p.barcode && p.barcode.includes(searchQuery)) ||
        (p.bulkBarcode && p.bulkBarcode.includes(searchQuery))
      );
    });
  }, [searchQuery, inventoryProducts, categories]);

  const handleCameraScan = async (barcode: string) => {
    const found = await searchProductByBarcode(barcode);
    if (!found) {
        console.log("Product not found for barcode:", barcode);
    }
    // Auto turn off camera state safely to avoid loop scans or native controller crashes
    setIsScannerVisible(false);
  };

  const handleCompleteSale = async (method: string) => {
    try {
      await processSale(method);
      setShowPaymentModal(false);
      Alert.alert(
        "Success",
        "Sale completed successfully!",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert("Checkout Failed", e.message || "An unexpected error occurred.");
    }
  };

  const renderItem = useCallback(({ item }: any) => (
    <CartItemRow
        item={item}
        currency={currency}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
    />
  ), [currency, updateQuantity, removeFromCart]);

  return (
    <ScreenWrapper withHeader>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <CheckoutHeader
        onBack={() => navigation.goBack()}
      />

      {/* Scanner Native Modal */}
      <RNModal
        visible={isScannerVisible}
        animationType="slide"
        onRequestClose={() => setIsScannerVisible(false)}
      >
        <Box flex={1} bg="$black">
            <ScannerView
                isActive={isScannerVisible}
                onScan={handleCameraScan}
            />
            <Box position="absolute" top={0} left={0} right={0} pt="$10">
                <HStack p="$4" alignItems="center" space="md">
                    <Pressable onPress={() => setIsScannerVisible(false)} p="$2">
                        <Icon as={CloseIcon} color="white" size="xl" />
                    </Pressable>
                    <Heading color="white" size="md">Scan Item</Heading>
                </HStack>
            </Box>
            <Box position="absolute" bottom={0} left={0} right={0} p="$6" bg="$white" borderTopLeftRadius="$3xl" borderTopRightRadius="$3xl">
                <VStack space="md" alignItems="center">
                    <HStack space="sm" alignItems="center">
                        <Text fontWeight="$bold" color="$text600">Items in Cart:</Text>
                        <Badge action="info" variant="solid" rounded="$full">
                            <BadgeText>{cart.length}</BadgeText>
                        </Badge>
                    </HStack>
                    <Heading size="xl" color="$primary800">Total: {currency}{total.toFixed(2)}</Heading>
                    <Button size="lg" w="$full" onPress={() => setIsScannerVisible(false)} borderRadius="$xl" bg="$primary800" style={{ height: getButtonHeight(52) }}>
                        <ButtonText fontWeight="$bold">Done Scanning</ButtonText>
                    </Button>
                </VStack>
            </Box>
        </Box>
      </RNModal>

      {/* Action Section: Scan -> Customer -> Search */}
      <Box pb="$4" zIndex={10}>
        <VStack space="md">
          {/* PRIORITY 1: SCAN */}
          <Button
            size="lg"
            variant="solid"
            action="primary"
            onPress={() => setIsScannerVisible(true)}
            borderRadius="$xl"
            bg="$primary600"
            h={getButtonHeight(56)}
            style={{ ...getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(0,0,0,0.1)' }) }}
          >
            <ButtonText fontWeight="$bold" fontSize="$md">Scan Barcode</ButtonText>
            <Box ml="$2">
                <Icon as={Scan} color="white" size="md" />
            </Box>
          </Button>

          {/* PRIORITY 2: CUSTOMER */}
          <Pressable
            onPress={() => setShowCustomerModal(true)}
            bg="$white"
            p="$3"
            rounded="$xl"
            borderWidth={1}
            borderColor={selectedCustomer ? "$primary600" : "$borderLight"}
            style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.03)' }) }}
          >
            <HStack space="sm" alignItems="center">
              <Center w={32} h={32} rounded="$full" bg={selectedCustomer ? "$primary50" : "$backgroundLight100"}>
                <Icon as={User} size="xs" color={selectedCustomer ? "$primary600" : "$text400"} />
              </Center>
              <VStack>
                <Text size="xs" color="$text500">{selectedCustomer ? "Customer Selected" : "Assign Customer"}</Text>
                <Text size="sm" fontWeight="$bold" color={selectedCustomer ? "$text900" : "$text400"}>
                  {selectedCustomer ? selectedCustomer.name : "Optional (for Credit)"}
                </Text>
              </VStack>
              {selectedCustomer && (
                  <Box ml="auto">
                      <Pressable onPress={(e) => { e.stopPropagation(); setSelectedCustomerId(null); }}>
                          <Icon as={CloseIcon} size="xs" color="$text400" />
                      </Pressable>
                  </Box>
              )}
            </HStack>
          </Pressable>

          {/* PRIORITY 3: SEARCH & BROWSE */}
          <VStack space="xs" position="relative">
            <HStack space="sm" alignItems="center">
              <Input flex={1} variant="outline" size="md" borderRadius={20} bg="$white" borderWidth={0} style={{ ...getAppShadow({ offsetY: 4, radius: 15, color: 'rgba(0,0,0,0.04)' }) }}>
                <InputSlot pl="$4">
                  <InputIcon as={SearchIcon} color="$primary600" />
                </InputSlot>
                <InputField
                  placeholder="Quick search..."
                  value={localSearchQuery}
                  onChangeText={setLocalSearchQuery}
                  placeholderTextColor="$text400"
                  autoCorrect={false}
                />
                {localSearchQuery.length > 0 && (
                   <InputSlot pr="$4" onPress={() => { setLocalSearchQuery(''); setSearchQuery(''); }}>
                     <InputIcon as={CloseIcon} />
                   </InputSlot>
                )}
              </Input>

              <Button
                size="md"
                variant="solid"
                action="secondary"
                onPress={() => setShowProductModal(true)}
                borderRadius={20}
                bg="$white"
                borderWidth={1}
                borderColor="$primary600"
                px="$4"
                style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.02)' }) }}
              >
                <ButtonText fontWeight="$bold" size="sm" color="$primary600">Browse</ButtonText>
              </Button>
            </HStack>

            <ProductSearchOverlay
                filteredProducts={filteredProducts}
                currency={currency}
                onSelect={(product) => {
                    addToCart(product);
                    setSearchQuery('');
                    setLocalSearchQuery('');
                }}
            />
          </VStack>
        </VStack>
      </Box>

      {/* Cart Items List */}
      <VStack flex={1}>
          <HStack py="$4" alignItems="center" space="sm">
              <Heading size="md" color="$text900">Order Summary</Heading>
              <Badge action="info" variant="solid" rounded="$full">
                <BadgeText>{cart.length}</BadgeText>
              </Badge>
          </HStack>

          <FlatList
            data={cart}
            keyExtractor={(item) => item.product.id + (item.isBulk ? '_bulk' : '_unit')}
            contentContainerStyle={{ paddingBottom: 160 }}
            renderItem={renderItem}
            initialNumToRender={10}
            removeClippedSubviews={true}
            ListEmptyComponent={
              <Center mt="$20">
                  <VStack space="md" alignItems="center">
                      <AppIcon name="cart" size={80} color="#eee" />
                      <Text color="$text400">Your cart is empty</Text>
                  </VStack>
              </Center>
            }
          />
      </VStack>

      <CheckoutFooter
        total={total}
        currency={currency}
        cartLength={cart.length}
        isLoading={isLoading}
        onCheckout={() => setShowPaymentModal(true)}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        total={total}
        currency={currency}
        onConfirm={handleCompleteSale}
        selectedCustomer={selectedCustomer}
        cart={cart}
      />

      <SelectCustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        customers={customers}
        onSelect={(customerId) => {
            setSelectedCustomerId(customerId);
            setShowCustomerModal(false);
        }}
        selectedCustomerId={selectedCustomerId}
        onAdd={addCustomer}
      />

      <SelectProductModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        products={inventoryProducts}
        categories={categories}
        currency={currency}
        onSelect={(product, isBulk) => {
            addToCart(product, 1, isBulk);
            setShowProductModal(false);
        }}
      />
    </ScreenWrapper>
  );
};

export default CheckoutScreen;
