import React from 'react';
import { ScrollView } from 'react-native';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  Heading,
  ModalCloseButton,
  Icon,
  ModalBody,
  VStack,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  Input,
  InputField,
  Menu,
  MenuItem,
  MenuItemLabel,
  Pressable,
  HStack,
  Text,
  ModalFooter,
  Button,
  ButtonText,
  Spinner,
  CloseIcon,
  ChevronDownIcon,
} from '@gluestack-ui/themed';

const SHOP_TYPES = [
  'Provision',
  'Supermarket',
  'Electrical',
  'Spare Parts',
  'Clothing',
  'Pharmacy',
  'Hardware',
  'Other'
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editForm: any;
  setEditForm: (form: any) => void;
  onSave: () => void;
  processing: boolean;
}

const EditRequestModal: React.FC<Props> = ({ isOpen, onClose, editForm, setEditForm, onSave, processing }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalBackdrop />
      <ModalContent rounded="$3xl">
        <ModalHeader>
          <Heading size="lg">Refine Request</Heading>
          <ModalCloseButton>
            <Icon as={CloseIcon} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <ScrollView showsVerticalScrollIndicator={false}>
            <VStack space="lg" py="$4">
              <FormControl isRequired>
                <FormControlLabel mb="$1">
                  <FormControlLabelText>Owner Name</FormControlLabelText>
                </FormControlLabel>
                <Input borderRadius={10}>
                  <InputField
                    value={editForm.ownerName}
                    onChangeText={(text) => setEditForm({ ...editForm, ownerName: text })}
                  />
                </Input>
              </FormControl>

              <FormControl isRequired>
                <FormControlLabel mb="$1">
                  <FormControlLabelText>WhatsApp Number</FormControlLabelText>
                </FormControlLabel>
                <Input borderRadius={10}>
                  <InputField
                    value={editForm.whatsappNumber}
                    onChangeText={(text) => setEditForm({ ...editForm, whatsappNumber: text })}
                    keyboardType="phone-pad"
                  />
                </Input>
              </FormControl>

              <FormControl isRequired>
                <FormControlLabel mb="$1">
                  <FormControlLabelText>Shop Name</FormControlLabelText>
                </FormControlLabel>
                <Input borderRadius={10}>
                  <InputField
                    value={editForm.shopName}
                    onChangeText={(text) => setEditForm({ ...editForm, shopName: text })}
                  />
                </Input>
              </FormControl>

              <Menu
                trigger={({ ...triggerProps }) => (
                  <Pressable {...triggerProps} borderWidth={1} borderColor="$borderLight" p="$3" rounded="$lg">
                    <HStack justifyContent="space-between" alignItems="center">
                      <Text size="sm">Type: {editForm.shopType || 'Select'}</Text>
                      <Icon as={ChevronDownIcon} />
                    </HStack>
                  </Pressable>
                )}
              >
                {SHOP_TYPES.map(type => (
                  <MenuItem key={type} textValue={type} onPress={() => setEditForm({ ...editForm, shopType: type })}>
                    <MenuItemLabel size="sm">{type}</MenuItemLabel>
                  </MenuItem>
                ))}
              </Menu>

              <FormControl>
                <FormControlLabel mb="$1">
                  <FormControlLabelText>Location</FormControlLabelText>
                </FormControlLabel>
                <Input borderRadius={10}>
                  <InputField
                    value={editForm.location}
                    onChangeText={(text) => setEditForm({ ...editForm, location: text })}
                    multiline
                  />
                </Input>
              </FormControl>
            </VStack>
          </ScrollView>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" action="secondary" onPress={onClose} mr="$3" borderRadius="$lg">
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button action="primary" onPress={onSave} borderRadius="$lg" bg="$primary800">
            {processing ? <Spinner color="white" /> : <ButtonText>Save Changes</ButtonText>}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditRequestModal;
