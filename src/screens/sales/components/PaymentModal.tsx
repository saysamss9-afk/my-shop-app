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
  Box,
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
import type { Customer } from '../../../db/types';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (isSubmitting) return;
    if (!customer || !amount || parseFloat(amount) <= 0) return;
    setIsSubmitting(true);
    try {
      await onSave(customer.id, parseFloat(amount), paymentMethod, note);
      setAmount('');
      setNote('');
      onClose();
    } catch (e) {
      setIsSubmitting(false);
    }
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
                        {currency}{(customer.currentBalance ?? 0).toFixed(2)}
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
                    editable={!isSubmitting}
                />
              </Input>
            </FormControl>

            <FormControl>
              <FormControlLabel mb="$1"><FormControlLabelText>Payment Method</FormControlLabelText></FormControlLabel>
              <Select onValueChange={setPaymentMethod} defaultValue="CASH" isDisabled={isSubmitting}>
                <SelectTrigger borderRadius={16} bg="$backgroundLight50">
                  <SelectInput placeholder="Select method" />
                  <SelectIcon as={ChevronDownIcon} mr="$3" />
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
                <TextareaInput
                    placeholder="Add a note (optional)"
                    value={note}
                    onChangeText={setNote}
                    autoCorrect={false}
                    editable={!isSubmitting}
                />
              </Textarea>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" action="secondary" onPress={onClose} mr="$3" borderRadius={16} isDisabled={isSubmitting}>
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button action="primary" onPress={handleSave} borderRadius={16} bg="$success600" style={{ height: getButtonHeight(50) }} isDisabled={isSubmitting}>
            <ButtonText fontWeight="$bold">{isSubmitting ? 'Saving...' : 'Confirm Payment'}</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PaymentModal;
