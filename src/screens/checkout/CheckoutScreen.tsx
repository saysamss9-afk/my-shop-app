import React, { useState, useCallback } from 'react';
import { FlatList, StatusBar, Modal as RNModal } from 'react-native';
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
import { ScannerView } from '../../components/ScannerView';
import { getButtonHeight, platformShadow } from '../../utils/platformStyles';
import SelectCustomerModal from './components/SelectCustomerModal';

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

  const { products } = useInventory(shopId);
  const { customers } = useCustomers(shopId);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [isScannerVisible, setIsScannerVisible] = useState(false);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || null;

  const filteredProducts = searchQuery.length > 0 ? products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchQuery))
  ) : [];

  const handleCameraScan = async (barcode: string) => {
    const found = await searchProductByBarcode(barcode);
    if (!found) {
        console.log("Product not found for barcode:", barcode);
    }
  };

  const handleCompleteSale = async (method: string) => {
    await processSale(method);
    setShowPaymentModal(false);
    navigation.goBack();
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
    <Box flex={1} bg="$surfaceLavender">
      <StatusBar barStyle="dark-content" backgroundColor="#F3ECFF" />

      <CheckoutHeader
        onBack={() => navigation.goBack()}
        onOpenScanner={() => setIsScannerVisible(true)}
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

      {/* Search Section */}
      <Box px="$5" pb="$4" zIndex={10}>
        <HStack space="md" mb="$4">
          <Pressable
            flex={1}
            onPress={() => setShowCustomerModal(true)}
            bg="$white"
            p="$3"
            rounded="$xl"
            borderWidth={1}
            borderColor={selectedCustomer ? "$primary600" : "$borderLight"}
            style={{ ...platformShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.03)' }) }}
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
        </HStack>

        <Input variant="outline" size="md" borderRadius={20} bg="$white" borderWidth={0} style={{ ...platformShadow({ offsetY: 4, radius: 15, color: 'rgba(0,0,0,0.04)' }) }}>
          <InputSlot pl="$4">
            <InputIcon as={SearchIcon} color="$primary600" />
          </InputSlot>
          <InputField
            placeholder="Type name or barcode manually..."
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

        <ProductSearchOverlay
            filteredProducts={filteredProducts}
            currency={currency}
            onSelect={(product) => {
                addToCart(product);
                setSearchQuery('');
            }}
        />
      </Box>

      {/* Cart Items List */}
      <VStack flex={1}>
          <HStack px="$5" py="$4" alignItems="center" space="sm">
              <Heading size="md" color="$text900">Order Summary</Heading>
              <Badge action="info" variant="solid" rounded="$full">
                <BadgeText>{cart.length}</BadgeText>
              </Badge>
          </HStack>

          <FlatList
            data={cart}
            keyExtractor={(item) => item.product.id + (item.isBulk ? '_bulk' : '_unit')}
            contentContainerStyle={{ padding: 20, paddingBottom: 160 }}
            renderItem={renderItem}
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
      />
    </Box>
  );
};

export default CheckoutScreen;
