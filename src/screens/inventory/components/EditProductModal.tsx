import React, { useState, useEffect } from 'react';
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
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  VStack,
  HStack,
  Input,
  InputField,
  CloseIcon,
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
import { Camera, Scan } from 'lucide-react-native';
import { getButtonHeight } from '../../../utils/platformStyles';
import { Product } from '../../../db/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  categories: any[];
  onSave: (product: Product) => void;
  onScanPress: (target: 'unit' | 'bulk') => void;
  generateBarcode: () => string;
}

const EditProductModal: React.FC<Props> = ({
  isOpen,
  onClose,
  product,
  categories,
  onSave,
  onScanPress,
  generateBarcode,
}) => {
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && product) {
      setFormData({
        ...product,
        bulkQuantity: product.bulkQuantity.toString(),
        bulkPrice: product.bulkPrice.toString(),
        price: product.price.toString(),
        costPrice: product.costPrice.toString(),
        minStockLevel: product.minStockLevel.toString(),
      });
    }
  }, [isOpen, product]);

  if (!formData) return null;

  const handleLocalSave = () => {
    if (!formData.name || !formData.price || !formData.costPrice) {
        Alert.alert("Error", "Please fill in all required fields (Name, Selling Price, Cost Price)");
        return;
    }

    onSave({
      ...formData,
      bulkQuantity: parseFloat(formData.bulkQuantity) || 1,
      bulkPrice: parseFloat(formData.bulkPrice) || 0,
      price: parseFloat(formData.price) || 0,
      costPrice: parseFloat(formData.costPrice) || 0,
      minStockLevel: parseFloat(formData.minStockLevel) || 0,
      status: 'ACTIVE' // Mark as active once reviewed/edited
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalBackdrop />
      <ModalContent rounded="$3xl">
        <ModalHeader>
          <VStack>
            <Heading size="lg" fontWeight="$black">
              {product?.status === 'DRAFT' ? 'Review New Item' : 'Edit Product'}
            </Heading>
            {product?.status === 'DRAFT' && (
                <Text size="xs" color="$warning600" fontWeight="$bold">Assign barcode and pricing to activate</Text>
            )}
          </VStack>
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
                    value={formData.name}
                    onChangeText={text => setFormData({ ...formData, name: text })}
                  />
                </Input>
              </FormControl>

              {/* Barcodes */}
              <HStack space="md">
                <VStack flex={1} space="xs">
                    <FormControlLabel><FormControlLabelText size="xs">Unit Barcode</FormControlLabelText></FormControlLabel>
                    <HStack space="xs">
                        <Input flex={1} borderRadius={12} bg="$backgroundLight50">
                            <InputField
                                size="sm"
                                value={formData.barcode || ''}
                                onChangeText={t => setFormData({...formData, barcode: t})}
                            />
                        </Input>
                        <Button size="xs" variant="outline" onPress={() => onScanPress('unit')} borderRadius={10} px="$2">
                            <Icon as={Camera} size="xs" />
                        </Button>
                    </HStack>
                </VStack>
                <VStack flex={1} space="xs">
                    <FormControlLabel><FormControlLabelText size="xs">Carton Barcode</FormControlLabelText></FormControlLabel>
                    <HStack space="xs">
                        <Input flex={1} borderRadius={12} bg="$backgroundLight50">
                            <InputField
                                size="sm"
                                value={formData.bulkBarcode || ''}
                                onChangeText={t => setFormData({...formData, bulkBarcode: t})}
                            />
                        </Input>
                        <Button size="xs" variant="outline" onPress={() => onScanPress('bulk')} borderRadius={10} px="$2">
                            <Icon as={Camera} size="xs" />
                        </Button>
                    </HStack>
                </VStack>
              </HStack>

              {/* Pricing */}
              <Box bg="$backgroundLight50" p="$4" rounded="$2xl">
                <Heading size="xs" mb="$3" color="$text400">FINANCIALS</Heading>
                <VStack space="md">
                    <HStack space="md">
                        <FormControl isRequired flex={1}>
                            <FormControlLabel><FormControlLabelText size="xs">Cost Price</FormControlLabelText></FormControlLabel>
                            <Input borderRadius={12} bg="$white">
                                <InputField value={formData.costPrice} onChangeText={t => setFormData({...formData, costPrice: t})} keyboardType="numeric" />
                            </Input>
                        </FormControl>
                        <FormControl isRequired flex={1}>
                            <FormControlLabel><FormControlLabelText size="xs">Selling Price</FormControlLabelText></FormControlLabel>
                            <Input borderRadius={12} bg="$white">
                                <InputField value={formData.price} onChangeText={t => setFormData({...formData, price: t})} keyboardType="numeric" />
                            </Input>
                        </FormControl>
                    </HStack>
                    <HStack space="md">
                        <FormControl flex={1}>
                            <FormControlLabel><FormControlLabelText size="xs">Carton Price</FormControlLabelText></FormControlLabel>
                            <Input borderRadius={12} bg="$white">
                                <InputField value={formData.bulkPrice} onChangeText={t => setFormData({...formData, bulkPrice: t})} keyboardType="numeric" />
                            </Input>
                        </FormControl>
                        <FormControl flex={1}>
                            <FormControlLabel><FormControlLabelText size="xs">Units/Carton</FormControlLabelText></FormControlLabel>
                            <Input borderRadius={12} bg="$white">
                                <InputField value={formData.bulkQuantity} onChangeText={t => setFormData({...formData, bulkQuantity: t})} keyboardType="numeric" />
                            </Input>
                        </FormControl>
                    </HStack>
                </VStack>
              </Box>

              <HStack space="md">
                <FormControl flex={1}>
                  <FormControlLabel mb="$1">
                    <FormControlLabelText size="sm">Category</FormControlLabelText>
                  </FormControlLabel>
                  <Select onValueChange={(v) => setFormData({...formData, categoryId: v})} selectedValue={formData.categoryId}>
                    <SelectTrigger borderRadius={16} bg="$backgroundLight50">
                        <SelectInput placeholder="Select Category" />
                        <SelectIcon mr="$3"><Icon as={ChevronDownIcon} /></SelectIcon>
                    </SelectTrigger>
                    <SelectPortal>
                        <SelectBackdrop />
                        <SelectContent>
                            <SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
                            {categories.map(c => (
                                <SelectItem key={c.id} label={c.name} value={c.id} />
                            ))}
                        </SelectContent>
                    </SelectPortal>
                  </Select>
                </FormControl>

                <FormControl flex={1}>
                  <FormControlLabel mb="$1">
                    <FormControlLabelText size="sm">Min Stock Alert</FormControlLabelText>
                  </FormControlLabel>
                  <Input borderRadius={16} bg="$backgroundLight50">
                    <InputField
                      value={formData.minStockLevel}
                      keyboardType="numeric"
                      onChangeText={text => setFormData({ ...formData, minStockLevel: text })}
                    />
                  </Input>
                </FormControl>
              </HStack>

            </VStack>
          </ScrollView>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" action="secondary" onPress={onClose} mr="$3" borderRadius={16}>
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button action="primary" onPress={handleLocalSave} borderRadius={16} bg="$primary600" style={{ height: getButtonHeight(50) }}>
            <ButtonText fontWeight="$bold">Save & Activate</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditProductModal;
