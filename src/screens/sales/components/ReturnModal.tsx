import React, { useState } from 'react';
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
  Box,
} from '@gluestack-ui/themed';
import { getButtonHeight } from '../../../utils/platformStyles';
import { Customer, Product } from '../../../db/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerId: string, productId: string, quantity: number, isBulk: boolean, price: number) => void;
  customer: Customer | null;
  products: Product[];
  currency: string;
}

const ReturnModal: React.FC<Props> = ({ isOpen, onClose, onSave, customer, products, currency }) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState('1');
  const [isBulk, setIsBulk] = useState(false);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleSave = () => {
    if (!customer || !selectedProduct || !quantity || parseFloat(quantity) <= 0) return;
    const price = isBulk ? selectedProduct.bulkPrice : selectedProduct.price;
    onSave(customer.id, selectedProduct.id, parseFloat(quantity), isBulk, price);
    setSelectedProductId('');
    setQuantity('1');
    onClose();
  };

  if (!customer) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalBackdrop />
      <ModalContent rounded="$3xl">
        <ModalHeader>
          <VStack>
            <Heading size="lg" fontWeight="$black">Return Item</Heading>
            <Text size="xs" color="$text500">Restore to stock & reduce debt for {customer.name}</Text>
          </VStack>
          <ModalCloseButton><Icon as={CloseIcon} /></ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <VStack space="xl" py="$4">
            <FormControl isRequired>
              <FormControlLabel mb="$1"><FormControlLabelText>Select Product</FormControlLabelText></FormControlLabel>
              <Select onValueChange={setSelectedProductId}>
                <SelectTrigger borderRadius={16} bg="$backgroundLight50">
                  <SelectInput placeholder="Choose product to return" />
                  <SelectIcon mr="$3"><Icon as={ChevronDownIcon} /></SelectIcon>
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
                    {products.map(p => (
                        <SelectItem key={p.id} label={p.name} value={p.id} />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
            </FormControl>

            {selectedProduct && (
                <VStack space="md">
                    <HStack justifyContent="space-between">
                        <Button
                            variant={!isBulk ? "solid" : "outline"}
                            action={!isBulk ? "primary" : "secondary"}
                            onPress={() => setIsBulk(false)}
                            flex={1}
                            mr="$2"
                            borderRadius={12}
                        >
                            <ButtonText>Unit ({currency}{selectedProduct.price})</ButtonText>
                        </Button>
                        <Button
                            variant={isBulk ? "solid" : "outline"}
                            action={isBulk ? "primary" : "secondary"}
                            onPress={() => setIsBulk(true)}
                            flex={1}
                            borderRadius={12}
                        >
                            <ButtonText>Carton ({currency}{selectedProduct.bulkPrice})</ButtonText>
                        </Button>
                    </HStack>

                    <FormControl isRequired>
                      <FormControlLabel mb="$1"><FormControlLabelText>Quantity to Return</FormControlLabelText></FormControlLabel>
                      <Input borderRadius={16} bg="$backgroundLight50">
                        <InputField
                            placeholder="1"
                            value={quantity}
                            onChangeText={setQuantity}
                            keyboardType="numeric"
                        />
                      </Input>
                    </FormControl>

                    <Box bg="$primary50" p="$3" rounded="$xl">
                        <HStack justifyContent="space-between" alignItems="center">
                            <Text size="sm" color="$primary700" fontWeight="$bold">Debt Reduction</Text>
                            <Text size="md" color="$primary700" fontWeight="$black">
                                {currency}{( (isBulk ? selectedProduct.bulkPrice : selectedProduct.price) * parseFloat(quantity || '0') ).toFixed(2)}
                            </Text>
                        </HStack>
                    </Box>
                </VStack>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" action="secondary" onPress={onClose} mr="$3" borderRadius={16}>
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button action="primary" onPress={handleSave} borderRadius={16} bg="$primary600" style={{ height: getButtonHeight(50) }}>
            <ButtonText fontWeight="$bold">Process Return</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ReturnModal;
