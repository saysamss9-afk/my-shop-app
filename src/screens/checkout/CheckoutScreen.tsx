import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StatusBar, Modal as RNModal } from 'react-native';
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
  Divider,
  CloseIcon,
  TrashIcon,
  AddIcon,
  RemoveIcon,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from '@gluestack-ui/themed';
import { Appbar } from 'react-native-paper';
import { Wallet, Scan } from 'lucide-react-native';
import { useCheckout } from '../../hooks/useCheckout';
import { useInventory } from '../../hooks/useInventory';
import AppIcon from '../../components/common/AppIcon';
import { ScannerView } from '../../components/ScannerView';

const CheckoutScreen = ({ route, navigation }: any) => {
  const { shopId, employeeId } = route.params;
  const {
    cart,
    total,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    processSale,
    searchProductByBarcode,
  } = useCheckout(shopId, employeeId);

  const { products } = useInventory(shopId);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isScannerVisible, setIsScannerVisible] = useState(false);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.barcode && p.barcode === searchQuery)
  );

  const handleCameraScan = async (barcode: string) => {
    const found = await searchProductByBarcode(barcode);
    if (!found) {
        console.log("Product not found for barcode:", barcode);
    }
  };

  const handleCompleteSale = async () => {
    await processSale('CASH');
    setShowPaymentModal(false);
    navigation.goBack();
  };

  return (
    <Box flex={1} bg="$backgroundLight50">
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />

      {/* Modern Solid Header */}
      <Box bg="$primary800">
        <Appbar.Header style={{ backgroundColor: 'transparent', elevation: 0 }}>
          <Appbar.BackAction color="white" onPress={() => navigation.goBack()} />
          <Appbar.Content
            title="Point of Sale"
            titleStyle={{ color: 'white', fontWeight: '900', fontSize: 20 }}
          />
          <Pressable onPress={() => setIsScannerVisible(true)} p="$3">
            <Icon as={Scan} color="white" size="md" />
          </Pressable>
        </Appbar.Header>
      </Box>

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
                    <Heading size="xl" color="$primary800">Total: ${total.toFixed(2)}</Heading>
                    <Button size="lg" w="$full" onPress={() => setIsScannerVisible(false)} borderRadius="$xl" bg="$primary800">
                        <ButtonText fontWeight="$bold">Done Scanning</ButtonText>
                    </Button>
                </VStack>
            </Box>
        </Box>
      </RNModal>

      {/* Search Section */}
      <Box p="$5" bg="$white" borderBottomWidth={1} borderColor="$borderLight" zIndex={10}>
        <Input variant="outline" size="md" borderRadius={12}>
          <InputSlot pl="$3">
            <InputIcon as={SearchIcon} color="$primary800" />
          </InputSlot>
          <InputField
            placeholder="Search products to add..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
             <InputSlot pr="$3" onPress={() => setSearchQuery('')}>
               <InputIcon as={CloseIcon} />
             </InputSlot>
          )}
        </Input>

        {searchQuery.length > 0 && (
          <Box position="absolute" top={75} left={20} right={20} bg="$white" rounded="$xl" borderWidth={1} borderColor="$borderLight" shadowColor="$black">
            <VStack>
              {filteredProducts.slice(0, 5).map((item, index) => (
                <React.Fragment key={item.id}>
                  <Pressable
                    onPress={() => {
                        addToCart(item);
                        setSearchQuery('');
                    }}
                    p="$4"
                    sx={{ ':active': { bg: '$backgroundLight50' } }}
                  >
                    <HStack justifyContent="space-between" alignItems="center">
                      <VStack space="xs">
                          <Text fontWeight="$bold" color="$text900">{item.name}</Text>
                          <Text size="xs" color="$text500">Stock: {item.stockQuantity} • ${item.price.toFixed(2)}</Text>
                      </VStack>
                      <Icon as={AddIcon} color="$primary800" />
                    </HStack>
                  </Pressable>
                  {index < Math.min(filteredProducts.length, 5) - 1 && <Divider />}
                </React.Fragment>
              ))}
            </VStack>
          </Box>
        )}
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
            keyExtractor={(item) => item.product.id}
            contentContainerStyle={{ padding: 20, paddingBottom: 160 }}
            renderItem={({ item }) => (
              <Box bg="$white" p="$4" rounded="$2xl" mb="$3" borderWidth={1} borderColor="$borderLight">
                  <HStack space="md" alignItems="center">
                      <VStack flex={1} space="xs">
                          <Text fontWeight="$bold" color="$text900">{item.product.name}</Text>
                          <Text size="xs" color="$text500">${item.product.price.toFixed(2)} / unit</Text>
                      </VStack>
                      <HStack alignItems="center" space="sm" bg="$backgroundLight50" p="$1" rounded="$lg">
                          <Pressable p="$1" onPress={() => updateQuantity(item.product.id, item.quantity - 1)}>
                              <Icon as={RemoveIcon} size="xs" />
                          </Pressable>
                          <Text fontWeight="$bold" minWidth={20} textAlign="center">{item.quantity}</Text>
                          <Pressable p="$1" onPress={() => updateQuantity(item.product.id, item.quantity + 1)}>
                              <Icon as={AddIcon} size="xs" />
                          </Pressable>
                      </HStack>
                      <VStack alignItems="flex-end" minWidth={70}>
                          <Text fontWeight="$bold" color="$primary800">${(item.product.price * item.quantity).toFixed(2)}</Text>
                          <Pressable onPress={() => removeFromCart(item.product.id)} mt="$1">
                              <Icon as={TrashIcon} size="sm" color="$error600" />
                          </Pressable>
                      </VStack>
                  </HStack>
              </Box>
            )}
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

      {/* Checkout Footer */}
      <Box position="absolute" bottom={0} left={0} right={0} p="$5" bg="$white" borderTopLeftRadius="$3xl" borderTopRightRadius="$3xl" shadowColor="$black">
        <VStack space="lg">
            <VStack space="xs">
                <HStack justifyContent="space-between" alignItems="center">
                    <Text size="sm" color="$text500">Subtotal</Text>
                    <Text size="sm" color="$text900">${total.toFixed(2)}</Text>
                </HStack>
                <HStack justifyContent="space-between" alignItems="center">
                    <Heading size="lg" color="$text900">Total Amount</Heading>
                    <Heading size="xl" color="$primary800">${total.toFixed(2)}</Heading>
                </HStack>
            </VStack>
            <Button
              size="lg"
              action="primary"
              onPress={() => setShowPaymentModal(true)}
              isDisabled={cart.length === 0 || isLoading}
              borderRadius={16}
              bg="$primary800"
              h="$12"
            >
              <ButtonText fontWeight="$bold">Collect Payment</ButtonText>
              {isLoading ? <Spinner color="white" ml="$2" /> : <Icon as={Wallet} color="white" ml="$2" size="sm" />}
            </Button>
        </VStack>
      </Box>

      {/* Payment Confirmation Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} size="lg">
        <ModalBackdrop />
        <ModalContent rounded="$3xl">
          <ModalHeader>
            <Heading size="lg">Finalize Sale</Heading>
            <ModalCloseButton>
              <Icon as={CloseIcon} />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
              <VStack space="xl" py="$6" alignItems="center">
                <VStack space="xs" alignItems="center">
                    <Text size="sm" color="$text500">Amount Due</Text>
                    <Heading size="3xl" color="$primary800" fontWeight="$black">${total.toFixed(2)}</Heading>
                </VStack>
                <Divider />
                <HStack space="md" alignItems="center" bg="$backgroundLight50" p="$4" rounded="$xl" w="$full">
                    <Icon as={Wallet} color="$text600" />
                    <Text size="md">Method: <Text fontWeight="$bold">CASH</Text></Text>
                </HStack>
              </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" action="secondary" onPress={() => setShowPaymentModal(false)} mr="$3" borderRadius="$lg">
              <ButtonText>Back</ButtonText>
            </Button>
            <Button action="primary" onPress={handleCompleteSale} borderRadius="$lg" bg="$primary800">
              <ButtonText fontWeight="$bold">Confirm Transaction</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CheckoutScreen;
