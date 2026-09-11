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
import type { Customer, Product } from '../../../db/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerId: string, productId: string, quantity: number, isBulk: boolean, price: number) => void;
  customer: Customer | null;
  currency: string;
  fetchItemsTaken: (id: string) => Promise<any[]>;
}

const ReturnModal: React.FC<Props> = ({ isOpen, onClose, onSave, customer, currency, fetchItemsTaken }) => {
  const [itemsTaken, setItemsTaken] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState('1');
  const [isBulk, setIsBulk] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customer) {
      setLoading(true);
      fetchItemsTaken(customer.id).then(data => {
        setItemsTaken(data);
        setLoading(false);
      });
    }
  }, [isOpen, customer, fetchItemsTaken]);

  const selectedItem = itemsTaken.find(p => p.id === selectedProductId && (isBulk ? p.isBulk === 1 : p.isBulk === 0));

  const handleSave = () => {
    if (!customer || !selectedItem || !quantity || parseFloat(quantity) <= 0) return;

    if (parseFloat(quantity) > selectedItem.totalTaken) {
        Alert.alert("Invalid Quantity", `Customer only took ${selectedItem.totalTaken} items.`);
        return;
    }

    onSave(customer.id, selectedItem.id, parseFloat(quantity), isBulk, selectedItem.priceAtSale);
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
            <Text size="xs" color="$text500">Items taken on credit by {customer.name}</Text>
          </VStack>
          <ModalCloseButton><Icon as={CloseIcon} /></ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          {loading ? (
            <Center py="$10">
                <Spinner color="$primary600" />
            </Center>
          ) : itemsTaken.length === 0 ? (
            <Center py="$10">
                <Text color="$text400">No active credit items for this customer.</Text>
            </Center>
          ) : (
            <VStack space="xl" py="$4">
              <FormControl isRequired>
                <FormControlLabel mb="$1"><FormControlLabelText>Select Credit Item</FormControlLabelText></FormControlLabel>
                <Select
                    onValueChange={(v) => {
                        const [id, bulk] = v.split('|');
                        setSelectedProductId(id);
                        setIsBulk(bulk === '1');
                    }}
                >
                  <SelectTrigger borderRadius={16} bg="$backgroundLight50">
                    <SelectInput placeholder="Choose item to return" />
                    <SelectIcon mr="$3"><Icon as={ChevronDownIcon} /></SelectIcon>
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent>
                      <SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
                      {itemsTaken.map(p => (
                          <SelectItem
                            key={`${p.id}_${p.isBulk}`}
                            label={`${p.name} (${p.isBulk ? p.bulkUnit || 'Carton' : p.unit || 'pcs'})`}
                            value={`${p.id}|${p.isBulk}`}
                          />
                      ))}
                    </SelectContent>
                  </SelectPortal>
                </Select>
              </FormControl>

              {selectedItem && (
                  <VStack space="md">
                      <Box bg="$backgroundLight50" p="$4" rounded="$xl" borderWidth={1} borderColor="$borderLight">
                          <HStack justifyContent="space-between">
                              <VStack>
                                  <Text size="xs" fontWeight="$bold" color="$text500">TOTAL TAKEN</Text>
                                  <Heading size="md" color="$text900">{selectedItem.totalTaken} {selectedItem.isBulk ? (selectedItem.bulkUnit || 'Carton') : (selectedItem.unit || 'pcs')}</Heading>
                              </VStack>
                              <VStack alignItems="flex-end">
                                  <Text size="xs" fontWeight="$bold" color="$text500">UNIT PRICE</Text>
                                  <Heading size="md" color="$primary700">{currency}{selectedItem.priceAtSale.toFixed(2)}</Heading>
                              </VStack>
                          </HStack>
                      </Box>

                      <FormControl isRequired>
                        <FormControlLabel mb="$1"><FormControlLabelText>Quantity to Return</FormControlLabelText></FormControlLabel>
                        <Input borderRadius={16} bg="$backgroundLight50">
                          <InputField
                              placeholder="e.g. 1"
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
                                  {currency}{( selectedItem.priceAtSale * parseFloat(quantity || '0') ).toFixed(2)}
                              </Text>
                          </HStack>
                      </Box>
                  </VStack>
              )}
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" action="secondary" onPress={onClose} mr="$3" borderRadius={16}>
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button
            action="primary"
            onPress={handleSave}
            borderRadius={16}
            bg="$primary600"
            style={{ height: getButtonHeight(50) }}
            isDisabled={!selectedItem}
          >
            <ButtonText fontWeight="$bold">Process Return</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ReturnModal;
