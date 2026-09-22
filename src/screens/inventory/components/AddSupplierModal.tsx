import React, { useState } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { displayAlert } from '../../../utils/alert';
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
  HStack,
  Input,
  InputField,
  CloseIcon,
  Text as GlueText,
} from '@gluestack-ui/themed';
import { getButtonHeight } from '../../../utils/platformStyles';
import type { Supplier } from '../../../db/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplierData: Partial<Supplier>) => void;
}

const AddSupplierModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
  });

  const handleSave = () => {
    if (!formData.name) {
        displayAlert("Required", "Supplier Name is required.");
        return;
    }
    onSave({
        ...formData,
        contactInfo: formData.phone // Backward compatibility
    });
    setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '' });
    onClose();
  };

  const insets = useSafeAreaInsets();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalBackdrop />
      <ModalContent rounded="$3xl" maxHeight="90%" w="$full" style={{ marginBottom: insets.bottom + 12 }}>
        <ModalHeader>
          <VStack>
            <Heading size="lg" fontWeight="$black">Add New Supplier</Heading>
            <GlueText size="xs" color="$text500">Provide official contact and business details.</GlueText>
          </VStack>
          <ModalCloseButton><Icon as={CloseIcon} /></ModalCloseButton>
        </ModalHeader>
        <ModalBody p="$0">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 24 }}
            >
              <VStack space="xl">
              <FormControl isRequired>
                <FormControlLabel mb="$1"><FormControlLabelText>Supplier / Business Name</FormControlLabelText></FormControlLabel>
                <Input borderRadius={16} bg="$backgroundLight50">
                  <InputField
                      placeholder="e.g. Wholesale Ltd"
                      value={formData.name}
                      onChangeText={(t) => setFormData({...formData, name: t})}
                      autoCorrect={false}
                      autoCapitalize="words"
                  />
                </Input>
              </FormControl>

              <HStack space="md">
                  <FormControl flex={1}>
                    <FormControlLabel mb="$1"><FormControlLabelText>Contact Person</FormControlLabelText></FormControlLabel>
                    <Input borderRadius={16} bg="$backgroundLight50">
                      <InputField
                          placeholder="Full Name"
                          value={formData.contactPerson}
                          onChangeText={(t) => setFormData({...formData, contactPerson: t})}
                          autoCorrect={false}
                      />
                    </Input>
                  </FormControl>
                  <FormControl flex={1}>
                    <FormControlLabel mb="$1"><FormControlLabelText>Phone Number</FormControlLabelText></FormControlLabel>
                    <Input borderRadius={16} bg="$backgroundLight50">
                      <InputField
                          placeholder="+233..."
                          value={formData.phone}
                          onChangeText={(t) => setFormData({...formData, phone: t})}
                          keyboardType="phone-pad"
                      />
                    </Input>
                  </FormControl>
              </HStack>

              <FormControl>
                <FormControlLabel mb="$1"><FormControlLabelText>Email Address</FormControlLabelText></FormControlLabel>
                <Input borderRadius={16} bg="$backgroundLight50">
                  <InputField
                      placeholder="business@example.com"
                      value={formData.email}
                      onChangeText={(t) => setFormData({...formData, email: t})}
                      keyboardType="email-address"
                      autoCapitalize="none"
                  />
                </Input>
              </FormControl>

              <FormControl>
                <FormControlLabel mb="$1"><FormControlLabelText>Physical Address</FormControlLabelText></FormControlLabel>
                <Input borderRadius={16} bg="$backgroundLight50">
                  <InputField
                      placeholder="Street, City, Region"
                      value={formData.address}
                      onChangeText={(t) => setFormData({...formData, address: t})}
                      multiline
                  />
                </Input>
              </FormControl>
            </VStack>
          </ScrollView>
          </KeyboardAvoidingView>
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
