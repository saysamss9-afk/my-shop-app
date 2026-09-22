import React, { useState, useMemo } from 'react';
import { ScrollView, StatusBar, Keyboard } from 'react-native';
import { displayAlert } from '../../utils/alert';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text as GlueText,
  Icon,
  Pressable,
  Center,
  Spinner,
  Button,
  ButtonText,
  Input,
  InputField,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  AddIcon,
  ArrowLeftIcon,
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
  ChevronDownIcon,
  TrashIcon,
} from '@gluestack-ui/themed';
import { ShoppingCart, FileText, Calendar, PlusCircle } from 'lucide-react-native';
import { usePurchase } from '../../hooks/usePurchase';
import type { PurchaseItem } from '../../hooks/usePurchase';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import { getAppShadow, getButtonHeight } from '../../utils/platformStyles';
import AddPurchaseItemModal from './components/AddPurchaseItemModal';

const PurchaseScreen = ({ route, navigation }: any) => {
  const { shopId, initialSupplierId } = route.params;
  const {
    suppliers,
    products,
    purchaseCart,
    isLoading,
    submitPurchase,
    addToCart,
    removeFromCart,
    currency
  } = usePurchase(shopId);

  const [supplierId, setSupplierId] = useState(initialSupplierId || '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amountPaid, setAmountPaid] = useState('0');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  const subtotal = useMemo(() =>
    purchaseCart.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0),
  [purchaseCart]);

  const balance = subtotal - parseFloat(amountPaid || '0');

  const handleSave = async () => {
    if (!supplierId) {
        displayAlert("Required", "Please select a supplier.");
        return;
    }
    if (purchaseCart.length === 0) {
        displayAlert("Required", "Please add at least one product.");
        return;
    }

    const success = await submitPurchase(supplierId, invoiceNumber, parseFloat(amountPaid || '0'));
    if (success) {
        displayAlert(
          "Success",
          "Purchase recorded successfully.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
    }
  };

  return (
    <ScreenWrapper withHeader>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <Box px="$4" pt="$2" pb="$4">
        <HStack space="md" alignItems="center">
          <Pressable onPress={() => navigation.goBack()} p="$2" bg="$white" rounded="$full">
            <Icon as={ArrowLeftIcon} color="$text900" />
          </Pressable>
          <VStack>
            <Heading size="lg" color="$text900" fontWeight="$black">New Purchase</Heading>
            <GlueText size="xs" color="$text500">Record product intake</GlueText>
          </VStack>
        </HStack>
      </Box>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <VStack space="xl">
          {/* Supplier & Invoice Info */}
          <Box bg="$white" p="$5" rounded="$3xl" style={getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(0,0,0,0.03)' })}>
            <VStack space="lg">
                <FormControl isRequired>
                    <FormControlLabel><FormControlLabelText>Supplier</FormControlLabelText></FormControlLabel>
                    <Select onValueChange={setSupplierId} selectedValue={supplierId}>
                        <SelectTrigger borderRadius={16} bg="$backgroundLight50">
                            <SelectInput
                                placeholder="Select Supplier"
                                value={suppliers.find(s => s.id === supplierId)?.name || ''}
                            />
                            <SelectIcon as={ChevronDownIcon} mr="$3" />
                        </SelectTrigger>
                        <SelectPortal>
                            <SelectBackdrop />
                            <SelectContent>
                                <SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
                                {suppliers.map(s => (
                                    <SelectItem key={s.id} label={s.name} value={s.id} />
                                ))}
                            </SelectContent>
                        </SelectPortal>
                    </Select>
                </FormControl>

                <HStack space="md">
                    <FormControl flex={1}>
                        <FormControlLabel><FormControlLabelText>Invoice #</FormControlLabelText></FormControlLabel>
                        <Input borderRadius={16} bg="$backgroundLight50">
                            <InputField
                                placeholder="INV-0000"
                                value={invoiceNumber}
                                onChangeText={setInvoiceNumber}
                                autoCapitalize="characters"
                                autoCorrect={false}
                            />
                        </Input>
                    </FormControl>
                    <FormControl flex={1}>
                        <FormControlLabel><FormControlLabelText>Date</FormControlLabelText></FormControlLabel>
                        <Box h={45} bg="$backgroundLight50" rounded={16} justifyContent="center" px="$3">
                            <GlueText size="sm">{new Date().toLocaleDateString()}</GlueText>
                        </Box>
                    </FormControl>
                </HStack>
            </VStack>
          </Box>

          {/* Products List */}
          <VStack space="md">
            <HStack justifyContent="space-between" alignItems="center">
                <Heading size="md" fontWeight="$bold">Products</Heading>
                <Button
                    size="sm"
                    variant="outline"
                    action="primary"
                    onPress={() => {
                        Keyboard.dismiss();
                        setIsItemModalOpen(true);
                    }}
                    borderRadius={12}
                >
                    <Icon as={PlusCircle} mr="$2" size="sm" />
                    <ButtonText size="xs">Add Product</ButtonText>
                </Button>
            </HStack>

            {purchaseCart.length === 0 ? (
                <Center p="$10" bg="$backgroundLight50" rounded="$3xl" borderStyle="dashed" borderWidth={1} borderColor="$borderLight">
                    <GlueText size="sm" color="$text400">No products added yet.</GlueText>
                </Center>
            ) : (
                purchaseCart.map((item, index) => (
                    <Box key={index} bg="$white" p="$4" rounded="$2xl" style={getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.02)' })}>
                        <HStack justifyContent="space-between" alignItems="center">
                            <VStack flex={1}>
                                <Heading size="xs">{item.name}</Heading>
                                <GlueText size="xs" color="$text500">
                                    {item.quantity} {item.isBulk ? 'Cartons' : 'Units'} @ {currency}{(item.costPrice ?? 0).toFixed(2)}
                                </GlueText>
                            </VStack>
                            <HStack space="md" alignItems="center">
                                <Heading size="sm" color="$primary600">{currency}{((item.quantity || 0) * (item.costPrice || 0)).toFixed(2)}</Heading>
                                <Pressable onPress={() => removeFromCart(index)}>
                                    <Icon as={TrashIcon} color="$error500" size="sm" />
                                </Pressable>
                            </HStack>
                        </HStack>
                    </Box>
                ))
            )}
          </VStack>

          {/* Summary & Payment */}
          <Box bg="$white" p="$5" rounded="$3xl" style={getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(0,0,0,0.03)' })}>
            <VStack space="lg">
                <HStack justifyContent="space-between">
                    <GlueText size="sm" color="$text600">Subtotal</GlueText>
                    <Heading size="md" fontWeight="$black">{currency}{(subtotal ?? 0).toFixed(2)}</Heading>
                </HStack>

                <FormControl>
                    <FormControlLabel><FormControlLabelText>Amount Paid Now</FormControlLabelText></FormControlLabel>
                    <Input borderRadius={16} bg="$backgroundLight50">
                        <InputField
                            placeholder="0.00"
                            value={amountPaid}
                            onChangeText={setAmountPaid}
                            keyboardType="numeric"
                        />
                    </Input>
                </FormControl>

                <HStack justifyContent="space-between" bg="$error50" p="$3" rounded="$xl">
                    <GlueText size="sm" color="$error700" fontWeight="$bold">Balance (Credit)</GlueText>
                    <Heading size="md" color="$error700" fontWeight="$black">{currency}{(balance ?? 0).toFixed(2)}</Heading>
                </HStack>
            </VStack>
          </Box>

          <Button
            size="lg"
            onPress={handleSave}
            bg="$primary600"
            borderRadius={20}
            isDisabled={isLoading}
            style={{ height: getButtonHeight(56), marginTop: 10 }}
          >
            {isLoading ? <Spinner color="$white" /> : <ButtonText fontWeight="$black">Save Purchase</ButtonText>}
          </Button>
        </VStack>
      </ScrollView>

      <AddPurchaseItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        products={products}
        onAdd={addToCart}
      />
    </ScreenWrapper>
  );
};

export default PurchaseScreen;
