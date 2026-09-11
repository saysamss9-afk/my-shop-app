import React, { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
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
  Textarea,
  TextareaInput,
} from '@gluestack-ui/themed';
import { getButtonHeight } from '../../../utils/platformStyles';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: any; // PurchaseOrderItem
  onSave: (quantity: number, reason: string) => void;
}

const PurchaseReturnModal: React.FC<Props> = ({ isOpen, onClose, item, onSave }) => {
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('Damaged goods');

  if (!item) return null;

  const handleSave = () => {
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0 || qty > item.quantity) {
        Alert.alert("Invalid Quantity", `Please enter a valid quantity (max ${item.quantity})`);
        return;
    }
    onSave(qty, reason);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalBackdrop />
      <ModalContent rounded="$3xl">
        <ModalHeader>
          <VStack>
            <Heading size="lg" fontWeight="$black">Return Item</Heading>
            <Text size="xs" color="$text500">{item.productName}</Text>
          </VStack>
          <ModalCloseButton><Icon as={CloseIcon} /></ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <VStack space="xl" py="$4">
            <FormControl isRequired>
              <FormControlLabel mb="$1">
                <FormControlLabelText>Quantity to Return (Max {item.quantity})</FormControlLabelText>
              </FormControlLabel>
              <Input borderRadius={16} bg="$backgroundLight50">
                <InputField
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                />
              </Input>
            </FormControl>

            <FormControl isRequired>
              <FormControlLabel mb="$1"><FormControlLabelText>Reason for Return</FormControlLabelText></FormControlLabel>
              <Textarea borderRadius={16} bg="$backgroundLight50">
                <TextareaInput
                    placeholder="e.g. Damaged, Expired, Wrong item"
                    value={reason}
                    onChangeText={setReason}
                    autoCorrect={false}
                />
              </Textarea>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" action="secondary" onPress={onClose} mr="$3" borderRadius={16}>
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button action="primary" onPress={handleSave} borderRadius={16} bg="$error600" style={{ height: getButtonHeight(50) }}>
            <ButtonText fontWeight="$bold">Process Return</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PurchaseReturnModal;
