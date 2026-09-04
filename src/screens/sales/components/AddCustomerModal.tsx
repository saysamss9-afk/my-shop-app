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
} from '@gluestack-ui/themed';
import { getButtonHeight } from '../../../utils/platformStyles';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, phone: string) => void;
}

const AddCustomerModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSave = () => {
    if (!name) return;
    onSave(name, phone);
    setName('');
    setPhone('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalBackdrop />
      <ModalContent rounded="$3xl">
        <ModalHeader>
          <Heading size="lg" fontWeight="$black">Add New Customer</Heading>
          <ModalCloseButton><Icon as={CloseIcon} /></ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <VStack space="xl" py="$4">
            <FormControl isRequired>
              <FormControlLabel mb="$1"><FormControlLabelText>Full Name</FormControlLabelText></FormControlLabel>
              <Input borderRadius={16} bg="$backgroundLight50">
                <InputField placeholder="Customer Name" value={name} onChangeText={setName} />
              </Input>
            </FormControl>
            <FormControl>
              <FormControlLabel mb="$1"><FormControlLabelText>Phone Number</FormControlLabelText></FormControlLabel>
              <Input borderRadius={16} bg="$backgroundLight50">
                <InputField placeholder="054..." value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              </Input>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" action="secondary" onPress={onClose} mr="$3" borderRadius={16}>
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button action="primary" onPress={handleSave} borderRadius={16} bg="$primary600" style={{ height: getButtonHeight(50) }}>
            <ButtonText fontWeight="$bold">Save Customer</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddCustomerModal;
