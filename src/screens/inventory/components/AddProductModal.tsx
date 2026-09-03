import React from 'react';
import { ScrollView } from 'react-native';
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
} from '@gluestack-ui/themed';
import { Camera } from 'lucide-react-native';
import { getButtonHeight } from '../../../utils/platformStyles';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  entryMode: 'UNIT' | 'BULK';
  newProduct: any;
  setNewProduct: (product: any) => void;
  onSave: () => void;
  onScanPress: (target: 'unit' | 'bulk') => void;
  onAutoBarcode: () => void;
}

const AddProductModal: React.FC<Props> = ({
  isOpen,
  onClose,
  entryMode,
  newProduct,
  setNewProduct,
  onSave,
  onScanPress,
  onAutoBarcode,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalBackdrop />
      <ModalContent rounded="$3xl">
        <ModalHeader>
          <Heading size="lg" fontWeight="$black">
            {entryMode === 'UNIT' ? 'Add New Unit Item' : 'Add New Bulk Item'}
          </Heading>
          <ModalCloseButton>
            <Icon as={CloseIcon} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <ScrollView showsVerticalScrollIndicator={false}>
            <VStack space="xl" py="$4">
              <FormControl isRequired>
                <FormControlLabel mb="$1">
                  <FormControlLabelText size="sm">Product Name</FormControlLabelText>
                </FormControlLabel>
                <Input borderRadius={16} bg="$backgroundLight50">
                  <InputField
                    placeholder="e.g. Milo 500g"
                    value={newProduct.name}
                    onChangeText={text => setNewProduct({ ...newProduct, name: text })}
                  />
                </Input>
              </FormControl>

              {entryMode === 'UNIT' ? (
                <>
                  <FormControl>
                    <FormControlLabel mb="$1">
                      <FormControlLabelText size="sm">Barcode / Code (Type or Scan)</FormControlLabelText>
                    </FormControlLabel>
                    <HStack space="sm">
                      <Input flex={1} borderRadius={16} bg="$backgroundLight50">
                        <InputField
                          placeholder="Manual barcode entry..."
                          value={newProduct.barcode}
                          onChangeText={text => setNewProduct({ ...newProduct, barcode: text })}
                        />
                      </Input>
                      <Button
                          variant="outline"
                          action="primary"
                          onPress={() => onScanPress('unit')}
                          borderRadius={16}
                          borderColor="$primary600"
                          px="$3"
                      >
                          <Icon as={Camera} color="$primary600" size="sm" />
                      </Button>
                      <Button
                          variant="outline"
                          action="primary"
                          onPress={onAutoBarcode}
                          borderRadius={16}
                          borderColor="$primary600"
                      >
                          <ButtonText size="xs" color="$primary600">Auto</ButtonText>
                      </Button>
                    </HStack>
                  </FormControl>

                  <HStack space="md">
                    <FormControl isRequired flex={1}>
                      <FormControlLabel mb="$1">
                        <FormControlLabelText size="sm">Unit Price</FormControlLabelText>
                      </FormControlLabel>
                      <Input borderRadius={16} bg="$backgroundLight50">
                        <InputField
                          placeholder="0.00"
                          value={newProduct.price}
                          keyboardType="numeric"
                          onChangeText={text => setNewProduct({ ...newProduct, price: text })}
                        />
                      </Input>
                    </FormControl>
                    <FormControl isRequired flex={1}>
                      <FormControlLabel mb="$1">
                        <FormControlLabelText size="sm">Unit Stock</FormControlLabelText>
                      </FormControlLabel>
                      <Input borderRadius={16} bg="$backgroundLight50">
                        <InputField
                          placeholder="0"
                          value={newProduct.stockQuantity}
                          keyboardType="numeric"
                          onChangeText={text => setNewProduct({ ...newProduct, stockQuantity: text })}
                        />
                      </Input>
                    </FormControl>
                  </HStack>

                  <HStack space="md">
                    <FormControl flex={1}>
                      <FormControlLabel mb="$1">
                        <FormControlLabelText size="sm">Cost Price</FormControlLabelText>
                      </FormControlLabel>
                      <Input borderRadius={16} bg="$backgroundLight50">
                        <InputField
                          placeholder="0.00"
                          value={newProduct.costPrice}
                          keyboardType="numeric"
                          onChangeText={text => setNewProduct({ ...newProduct, costPrice: text })}
                        />
                      </Input>
                    </FormControl>
                    <FormControl flex={1}>
                      <FormControlLabel mb="$1">
                        <FormControlLabelText size="sm">Min Stock Level</FormControlLabelText>
                      </FormControlLabel>
                      <Input borderRadius={16} bg="$backgroundLight50">
                        <InputField
                          placeholder="5"
                          value={newProduct.minStockLevel}
                          keyboardType="numeric"
                          onChangeText={text => setNewProduct({ ...newProduct, minStockLevel: text })}
                        />
                      </Input>
                    </FormControl>
                  </HStack>

                </>
              ) : (
                <>
                  <FormControl>
                    <FormControlLabel mb="$1">
                      <FormControlLabelText size="sm">Carton Barcode (Type or Scan)</FormControlLabelText>
                    </FormControlLabel>
                    <HStack space="sm">
                      <Input flex={1} borderRadius={16} bg="$backgroundLight50">
                        <InputField
                            placeholder="Scan or type carton barcode..."
                            value={newProduct.bulkBarcode}
                            onChangeText={text => setNewProduct({ ...newProduct, bulkBarcode: text })}
                        />
                      </Input>
                      <Button
                          variant="outline"
                          action="primary"
                          onPress={() => onScanPress('bulk')}
                          borderRadius={16}
                          borderColor="$primary600"
                          px="$3"
                      >
                          <Icon as={Camera} color="$primary600" size="sm" />
                      </Button>
                    </HStack>
                  </FormControl>

                  <HStack space="md">
                    <FormControl isRequired flex={1}>
                      <FormControlLabel mb="$1">
                        <FormControlLabelText size="sm">Carton Price</FormControlLabelText>
                      </FormControlLabel>
                      <Input borderRadius={16} bg="$backgroundLight50">
                        <InputField
                          placeholder="0.00"
                          value={newProduct.bulkPrice}
                          keyboardType="numeric"
                          onChangeText={text => setNewProduct({ ...newProduct, bulkPrice: text })}
                        />
                      </Input>
                    </FormControl>
                    <FormControl isRequired flex={1}>
                      <FormControlLabel mb="$1">
                        <FormControlLabelText size="sm">Carton Stock</FormControlLabelText>
                      </FormControlLabel>
                      <Input borderRadius={16} bg="$backgroundLight50">
                        <InputField
                          placeholder="0"
                          value={newProduct.bulkStockQuantity}
                          keyboardType="numeric"
                          onChangeText={text => setNewProduct({ ...newProduct, bulkStockQuantity: text })}
                        />
                      </Input>
                    </FormControl>
                  </HStack>

                  <FormControl isRequired>
                    <FormControlLabel mb="$1">
                      <FormControlLabelText size="sm">Units per Carton</FormControlLabelText>
                    </FormControlLabel>
                    <Input borderRadius={16} bg="$backgroundLight50">
                      <InputField
                        placeholder="12"
                        value={newProduct.bulkQuantity}
                        keyboardType="numeric"
                        onChangeText={text => setNewProduct({ ...newProduct, bulkQuantity: text })}
                      />
                    </Input>
                  </FormControl>

                </>
              )}

            </VStack>
          </ScrollView>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" action="secondary" onPress={onClose} mr="$3" borderRadius={16}>
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button action="primary" onPress={onSave} borderRadius={16} bg="$primary600" style={{ height: getButtonHeight(50) }}>
            <ButtonText fontWeight="$bold">Add to Inventory</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddProductModal;
