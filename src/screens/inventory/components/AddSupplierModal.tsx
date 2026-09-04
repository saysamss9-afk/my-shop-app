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
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  VStack,
  Input,
  InputField,
  CloseIcon,
} from '@gluestack-ui/themed';
import { getButtonHeight } from '../../../utils/platformStyles';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, contact: string) => void;
}

const AddSupplierModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');

  const handleSave = () => {
    if (!name) return;
    onSave(name, contact);
    setName('');
    setContact('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalBackdrop />
      <ModalContent rounded="$3xl">
        <ModalHeader>
          <Heading size="lg" fontWeight="$black">Add New Supplier</Heading>
          <ModalCloseButton><Icon as={CloseIcon} /></ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <VStack space="xl" py="$4">
            <FormControl isRequired>
              <FormControlLabel mb="$1"><FormControlLabelText>Supplier Name</FormControlLabelText></FormControlLabel>
              <Input borderRadius={16} bg="$backgroundLight50">
                <InputField
                    placeholder="e.g. Wholesale Ltd"
                    value={name}
                    onChangeText={setName}
                    autoCorrect={true}
                    autoCapitalize="words"
                />
              </Input>
            </FormControl>
            <FormControl>
              <FormControlLabel mb="$1"><FormControlLabelText>Contact Info (Phone/Email)</FormControlLabelText></FormControlLabel>
              <Input borderRadius={16} bg="$backgroundLight50">
                <InputField
                    placeholder="+233..."
                    value={contact}
                    onChangeText={setContact}
                    autoCorrect={false}
                    autoCapitalize="none"
                />
              </Input>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" action="secondary" onPress={onClose} mr="$3" borderRadius={16}>
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button action="primary" onPress={handleSave} borderRadius={16} bg="$primary600" style={{ height: getButtonHeight(50) }}>
            <ButtonText fontWeight="$bold">Save Supplier</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddSupplierModal;
