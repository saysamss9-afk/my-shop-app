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
  Textarea,
  TextareaInput,
} from '@gluestack-ui/themed';
import { getButtonHeight } from '../../../utils/platformStyles';
import { Customer } from '../../../db/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerId: string, amount: number, paymentMethod: string, note?: string) => void;
  customer: Customer | null;
  currency: string;
}

const PaymentModal: React.FC<Props> = ({ isOpen, onClose, onSave, customer, currency }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [note, setNote] = useState('');

  const handleSave = () => {
    if (!customer || !amount || parseFloat(amount) <= 0) return;
    onSave(customer.id, parseFloat(amount), paymentMethod, note);
    setAmount('');
    setNote('');
    onClose();
  };

  if (!customer) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalBackdrop />
      <ModalContent rounded="$3xl">
        <ModalHeader>
          <VStack>
            <Heading size="lg" fontWeight="$black">Record Payment</Heading>
            <Text size="xs" color="$text500">For {customer.name}</Text>
          </VStack>
          <ModalCloseButton><Icon as={CloseIcon} /></ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <VStack space="xl" py="$4">
            <Box bg="$backgroundLight50" p="$4" rounded="$2xl">
                <HStack justifyContent="space-between" alignItems="center">
                    <Text size="sm" color="$text600">Current Debt</Text>
                    <Text size="lg" color="$error600" fontWeight="$black">
                        {currency}{customer.currentBalance.toFixed(2)}
                    </Text>
                </HStack>
            </Box>

            <FormControl isRequired>
              <FormControlLabel mb="$1"><FormControlLabelText>Amount Paid</FormControlLabelText></FormControlLabel>
              <Input borderRadius={16} bg="$backgroundLight50">
                <InputField
                    placeholder="0.00"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                />
              </Input>
            </FormControl>

            <FormControl>
              <FormControlLabel mb="$1"><FormControlLabelText>Payment Method</FormControlLabelText></FormControlLabel>
              <Select onValueChange={setPaymentMethod} defaultValue="CASH">
                <SelectTrigger borderRadius={16} bg="$backgroundLight50">
                  <SelectInput placeholder="Select method" />
                  <SelectIcon mr="$3"><Icon as={ChevronDownIcon} /></SelectIcon>
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
                    <SelectItem label="Cash" value="CASH" />
                    <SelectItem label="Mobile Money" value="MOMO" />
                    <SelectItem label="Bank Transfer" value="BANK" />
                  </SelectContent>
                </SelectPortal>
              </Select>
            </FormControl>

            <FormControl>
              <FormControlLabel mb="$1"><FormControlLabelText>Notes</FormControlLabelText></FormControlLabel>
              <Textarea borderRadius={16} bg="$backgroundLight50">
                <TextareaInput placeholder="Add a note (optional)" value={note} onChangeText={setNote} />
              </Textarea>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" action="secondary" onPress={onClose} mr="$3" borderRadius={16}>
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button action="primary" onPress={handleSave} borderRadius={16} bg="$success600" style={{ height: getButtonHeight(50) }}>
            <ButtonText fontWeight="$bold">Confirm Payment</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PaymentModal;
