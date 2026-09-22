import React, { useState } from 'react';
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
  Textarea,
  TextareaInput,
  Box,
} from '@gluestack-ui/themed';
import { getButtonHeight } from '../../../utils/platformStyles';
import type { Supplier } from '../../../db/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplierId: string, amount: number, paymentMethod: string, reference?: string, note?: string) => void;
  supplier: Supplier | null;
  currency: string;
}

const SupplierPaymentModal: React.FC<Props> = ({ isOpen, onClose, onSave, supplier, currency }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');

  const handleSave = () => {
    if (!supplier || !amount || parseFloat(amount) <= 0) return;
    onSave(supplier.id, parseFloat(amount), paymentMethod, reference, note);
    setAmount('');
    setReference('');
    setNote('');
    onClose();
  };

  const insets = useSafeAreaInsets();

  if (!supplier) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalBackdrop />
      <ModalContent rounded="$3xl" style={{ marginBottom: insets.bottom + 12, maxHeight: '90%' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ModalHeader>
            <VStack>
              <Heading size="lg" fontWeight="$black">Record Payment</Heading>
              <Text size="xs" color="$text500">To {supplier.name}</Text>
            </VStack>
            <ModalCloseButton><Icon as={CloseIcon} /></ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <VStack space="xl" py="$4">
                <Box bg="$backgroundLight50" p="$4" rounded="$2xl">
                    <HStack justifyContent="space-between" alignItems="center">
                        <Text size="sm" color="$text600">Outstanding Balance</Text>
                        <Text size="lg" color="$error600" fontWeight="$black">
                            {currency}{(supplier.currentBalance ?? 0).toFixed(2)}
                        </Text>
                    </HStack>
                </Box>

                <FormControl isRequired>
                  <FormControlLabel mb="$1"><FormControlLabelText>Payment Amount</FormControlLabelText></FormControlLabel>
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
                      <SelectIcon as={ChevronDownIcon} mr="$3" />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectBackdrop />
                      <SelectContent>
                        <SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
                        <SelectItem label="Cash" value="CASH" />
                        <SelectItem label="Mobile Money" value="MOMO" />
                        <SelectItem label="Bank Transfer" value="BANK" />
                        <SelectItem label="Cheque" value="CHECK" />
                      </SelectContent>
                    </SelectPortal>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormControlLabel mb="$1"><FormControlLabelText>Reference Number</FormControlLabelText></FormControlLabel>
                  <Input borderRadius={16} bg="$backgroundLight50">
                    <InputField
                        placeholder="e.g. PAY-00121"
                        value={reference}
                        onChangeText={setReference}
                        autoCapitalize="characters"
                        autoCorrect={false}
                    />
                  </Input>
                </FormControl>

                <FormControl>
                  <FormControlLabel mb="$1"><FormControlLabelText>Notes</FormControlLabelText></FormControlLabel>
                  <Textarea borderRadius={16} bg="$backgroundLight50">
                    <TextareaInput
                        placeholder="e.g. Part payment for August delivery"
                        value={note}
                        onChangeText={setNote}
                        autoCorrect={false}
                    />
                  </Textarea>
                </FormControl>
              </VStack>
            </ScrollView>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" action="secondary" onPress={onClose} mr="$3" borderRadius={16}>
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button action="primary" onPress={handleSave} borderRadius={16} bg="$success600" style={{ height: getButtonHeight(50) }}>
              <ButtonText fontWeight="$bold">Confirm Payment</ButtonText>
            </Button>
          </ModalFooter>
        </KeyboardAvoidingView>
      </ModalContent>
    </Modal>
  );
};

export default SupplierPaymentModal;
