import React, { useState, useMemo } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import {
  Heading,
  Icon,
  Button,
  ButtonText,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  VStack,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  Input,
  InputField,
  CloseIcon,
  HStack,
  Text,
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
} from '@gluestack-ui/themed';
import { getButtonHeight } from '../../../utils/platformStyles';
import type { Product } from '../../../db/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAdd: (item: { id?: string; name: string; quantity: number; costPrice: number; isBulk: boolean; isNew: boolean }) => void;
}

const AddPurchaseItemModal: React.FC<Props> = ({ isOpen, onClose, products, onAdd }) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('NEW');
  const [newName, setNewName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [costPrice, setCostPrice] = useState('');
  const [isBulk, setIsBulk] = useState(false);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleAdd = () => {
    const isNew = selectedProductId === 'NEW';
    const name = isNew ? newName : (selectedProduct?.name || '');

    if (!name || !quantity || !costPrice) return;

    onAdd({
      id: isNew ? undefined : selectedProductId,
      name,
      quantity: parseFloat(quantity),
      costPrice: parseFloat(costPrice),
      isBulk,
      isNew
    });

    // Reset
    setSelectedProductId('NEW');
    setNewName('');
    setQuantity('1');
    setCostPrice('');
    setIsBulk(false);
    onClose();
  };

  const insets = useSafeAreaInsets();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalBackdrop />
      <ModalContent rounded="$3xl" style={{ marginBottom: insets.bottom + 12, maxHeight: '85%' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ModalHeader>
            <Heading size="lg" fontWeight="$black">Add Product</Heading>
            <ModalCloseButton><Icon as={CloseIcon} /></ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <VStack space="xl" py="$4">
            <FormControl isRequired>
              <FormControlLabel mb="$1"><FormControlLabelText>Select Product</FormControlLabelText></FormControlLabel>
              <Select onValueChange={(val) => {
                  setSelectedProductId(val);
                  const p = products.find(prod => prod.id === val);
                  if (p) setCostPrice((p.costPrice ?? 0).toString());
              }} selectedValue={selectedProductId}>
                <SelectTrigger borderRadius={16} bg="$backgroundLight50">
                  <SelectInput placeholder="Search existing or New" />
                  <SelectIcon as={ChevronDownIcon} mr="$3" />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
                    <SelectItem label="-- + ADD NEW PRODUCT --" value="NEW" />
                    {products.map(p => (
                        <SelectItem key={p.id} label={p.name} value={p.id} />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
            </FormControl>

            {selectedProductId === 'NEW' && (
                <FormControl isRequired>
                    <FormControlLabel mb="$1"><FormControlLabelText>New Product Name</FormControlLabelText></FormControlLabel>
                    <Input borderRadius={16} bg="$backgroundLight50">
                        <InputField
                            placeholder="Type product name..."
                            value={newName}
                            onChangeText={setNewName}
                            autoCapitalize="words"
                            autoCorrect={false}
                        />
                    </Input>
                </FormControl>
            )}

            <HStack space="md">
                <Button
                    variant={!isBulk ? "solid" : "outline"}
                    action="primary"
                    onPress={() => setIsBulk(false)}
                    flex={1}
                    borderRadius={12}
                >
                    <ButtonText size="xs">Unit ({selectedProduct?.unit || 'pcs'})</ButtonText>
                </Button>
                <Button
                    variant={isBulk ? "solid" : "outline"}
                    action="primary"
                    onPress={() => setIsBulk(true)}
                    flex={1}
                    borderRadius={12}
                >
                    <ButtonText size="xs">{selectedProduct?.bulkUnit || 'Bulk'}</ButtonText>
                </Button>
            </HStack>

            <HStack space="md">
                <FormControl isRequired flex={1}>
                  <FormControlLabel mb="$1"><FormControlLabelText>Quantity</FormControlLabelText></FormControlLabel>
                  <Input borderRadius={16} bg="$backgroundLight50">
                    <InputField
                        placeholder="1"
                        value={quantity}
                        onChangeText={setQuantity}
                        keyboardType="numeric"
                    />
                  </Input>
                </FormControl>

                <FormControl isRequired flex={1}>
                  <FormControlLabel mb="$1"><FormControlLabelText>Cost Price</FormControlLabelText></FormControlLabel>
                  <Input borderRadius={16} bg="$backgroundLight50">
                    <InputField
                        placeholder="0.00"
                        value={costPrice}
                        onChangeText={setCostPrice}
                        keyboardType="numeric"
                    />
                  </Input>
                </FormControl>
            </HStack>
          </VStack>
            </ScrollView>
          </ModalBody>
          <ModalFooter>
          <Button variant="outline" action="secondary" onPress={onClose} mr="$3" borderRadius={16}>
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button action="primary" onPress={handleAdd} borderRadius={16} bg="$primary600" style={{ height: getButtonHeight(50) }}>
            <ButtonText fontWeight="$bold">Add to Cart</ButtonText>
          </Button>
        </ModalFooter>
        </KeyboardAvoidingView>
      </ModalContent>
    </Modal>
  );
};

export default AddPurchaseItemModal;
