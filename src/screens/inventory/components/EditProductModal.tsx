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
  Text as GlueText,
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
  Pressable,
} from '@gluestack-ui/themed';
import { Camera, Scan, Package, LockIcon, Zap } from 'lucide-react-native';
import { getButtonHeight } from '../../../utils/platformStyles';
import type { Product } from '../../../db/types';

const BULK_UNITS = ['Carton', 'Pack', 'Bag', 'Crate', 'Box', 'Bundle', 'Set'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  categories: any[];
  onSave: (product: Product) => void;
  onScanPress: (target: 'unit' | 'bulk') => void;
  generateBarcode: () => string;
  canEdit?: boolean;
}

const EditProductModal: React.FC<Props> = ({
  isOpen,
  onClose,
  product,
  categories,
  onSave,
  onScanPress,
  generateBarcode,
  canEdit = true,
}) => {
  const [formData, setFormData] = useState<any>(null);
  const [hasBulkOption, setHasBulkOption] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      try {
        setFormData({
            ...product,
            bulkQuantity: String(product.bulkQuantity ?? 1),
            bulkPrice: String(product.bulkPrice ?? 0),
            bulkStockQuantity: String(product.bulkStockQuantity ?? 0),
            bulkUnit: product.bulkUnit || 'Carton',
            price: String(product.price ?? 0),
            costPrice: String(product.costPrice ?? 0),
            stockQuantity: String(product.stockQuantity ?? 0),
            minStockLevel: String(product.minStockLevel ?? 0),
          });
          setHasBulkOption(!!product.bulkPrice && product.bulkPrice > 0);
      } catch (e) {
        console.error("EditProductModal: Failed to initialize form data", e);
        // Fallback to empty strings if everything fails
        setFormData({ ...product, price: '0', costPrice: '0', stockQuantity: '0', bulkUnit: 'Carton' });
      }
    }
  }, [isOpen, product]);

  if (!formData) return null;

  const handleLocalSave = () => {
    if (!canEdit) return;
    if (!formData.name || !formData.price || !formData.costPrice) {
        Alert.alert("Error", "Please fill in all required fields (Name, Selling Price, Cost Price)");
        return;
    }

    onSave({
      ...formData,
      barcode: formData.barcode || generateBarcode(),
      bulkBarcode: (hasBulkOption && (formData.bulkBarcode || parseFloat(formData.bulkPrice) > 0)) ? (formData.bulkBarcode || generateBarcode()) : '',
      bulkUnit: hasBulkOption ? formData.bulkUnit : null,
      bulkQuantity: hasBulkOption ? parseFloat(formData.bulkQuantity) || 1 : 1,
      bulkPrice: hasBulkOption ? parseFloat(formData.bulkPrice) || 0 : 0,
      bulkStockQuantity: hasBulkOption ? parseFloat(formData.bulkStockQuantity) || 0 : 0,
      price: parseFloat(formData.price) || 0,
      costPrice: parseFloat(formData.costPrice) || 0,
      stockQuantity: parseFloat(formData.stockQuantity) || 0,
      minStockLevel: parseFloat(formData.minStockLevel) || 0,
      status: 'ACTIVE'
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalBackdrop />
      <ModalContent rounded="$3xl">
        <ModalHeader>
          <VStack>
            <HStack space="xs" alignItems="center">
                <Heading size="lg" fontWeight="$black">
                {product?.status === 'DRAFT' ? 'Review New Item' : 'Product Details'}
                </Heading>
                {!canEdit && <Icon as={LockIcon} size="sm" color="$text400" />}
            </HStack>
            {product?.status === 'DRAFT' && canEdit && (
                <GlueText size="xs" color="$warning600" fontWeight="$bold">Assign barcode and pricing to activate</GlueText>
            )}
            {!canEdit && (
                <GlueText size="xs" color="$text400">View-only mode (Manager access required to edit)</GlueText>
            )}
          </VStack>
          <ModalCloseButton>
            <Icon as={CloseIcon} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <ScrollView showsVerticalScrollIndicator={false}>
            <VStack space="xl" py="$4" opacity={canEdit ? 1 : 0.8}>
              <FormControl isRequired isDisabled={!canEdit}>
                <FormControlLabel mb="$1">
                  <FormControlLabelText size="sm">Product Name</FormControlLabelText>
                </FormControlLabel>
                <Input borderRadius={16} bg="$backgroundLight50">
                  <InputField
                    placeholder="e.g. Milo 500g"
                    value={formData.name}
                    onChangeText={text => setFormData({ ...formData, name: text })}
                    autoCorrect={false}
                  />
                </Input>
              </FormControl>

              {/* Barcodes */}
              <HStack space="md">
                <VStack flex={1} space="xs">
                    <FormControlLabel><FormControlLabelText size="xs">Unit Barcode</FormControlLabelText></FormControlLabel>
                    <HStack space="xs">
                        <Input flex={1} borderRadius={12} bg="$backgroundLight50" isDisabled={!canEdit}>
                            <InputField
                                size="sm"
                                placeholder="Scan/Type"
                                value={formData.barcode || ''}
                                onChangeText={t => setFormData({...formData, barcode: t})}
                            />
                        </Input>
                        {canEdit && (
                            <HStack space="xs">
                                <Button size="xs" variant="outline" onPress={() => onScanPress('unit')} borderRadius={10} px="$2" borderColor="$primary300">
                                    <Icon as={Camera} size="xs" color="$primary600" />
                                </Button>
                                <Button size="xs" variant="outline" onPress={() => setFormData({...formData, barcode: generateBarcode()})} borderRadius={10} px="$2" borderColor="$warning300">
                                    <Icon as={Zap} size="xs" color="$warning600" />
                                </Button>
                            </HStack>
                        )}
                    </HStack>
                </VStack>
                <VStack flex={1} space="xs">
                    <FormControlLabel><FormControlLabelText size="xs">{hasBulkOption ? formData.bulkUnit : 'Bulk'} Barcode</FormControlLabelText></FormControlLabel>
                    <HStack space="xs">
                        <Input flex={1} borderRadius={12} bg="$backgroundLight50" isDisabled={!canEdit || !hasBulkOption}>
                            <InputField
                                size="sm"
                                placeholder={hasBulkOption ? "Scan/Type" : "N/A"}
                                value={formData.bulkBarcode || ''}
                                onChangeText={t => setFormData({...formData, bulkBarcode: t})}
                            />
                        </Input>
                        {canEdit && (
                            <HStack space="xs">
                                <Button size="xs" variant="outline" onPress={() => onScanPress('bulk')} borderRadius={10} px="$2" borderColor="$primary300" isDisabled={!hasBulkOption}>
                                    <Icon as={Camera} size="xs" color={hasBulkOption ? "$primary600" : "$text300"} />
                                </Button>
                                <Button size="xs" variant="outline" onPress={() => setFormData({...formData, bulkBarcode: generateBarcode()})} borderRadius={10} px="$2" borderColor="$warning300" isDisabled={!hasBulkOption}>
                                    <Icon as={Zap} size="xs" color={hasBulkOption ? "$warning600" : "$text300"} />
                                </Button>
                            </HStack>
                        )}
                    </HStack>
                </VStack>
              </HStack>

              {/* Bulk Toggle Option */}
              {canEdit && (
                <Pressable onPress={() => setHasBulkOption(!hasBulkOption)}>
                    <HStack space="sm" alignItems="center" bg="$backgroundLight50" p="$3" rounded="$xl" borderWidth={1} borderColor={hasBulkOption ? "$primary300" : "$borderLight"}>
                        <Box w={20} h={20} rounded="$full" borderWidth={2} borderColor={hasBulkOption ? "$primary600" : "$text300"} alignItems="center" justifyContent="center">
                            {hasBulkOption && <Box w={10} h={10} rounded="$full" bg="$primary600" />}
                        </Box>
                        <VStack flex={1}>
                            <GlueText size="sm" fontWeight="$bold" color={hasBulkOption ? "$primary700" : "$text600"}>Enable Bulk Selling</GlueText>
                            <GlueText size="xs" color="$text400">Items sold in packs, cartons, or bags</GlueText>
                        </VStack>
                    </HStack>
                </Pressable>
              )}

              {/* Stock Management */}
              <Box bg="$primary50" p="$4" rounded="$2xl">
                <HStack space="xs" alignItems="center" mb="$3">
                    <Icon as={Package} size="xs" color="$primary600" />
                    <Heading size="xs" color="$primary700">STOCK ON HAND</Heading>
                </HStack>
                <HStack space="md">
                    <FormControl isRequired flex={1} isDisabled={!canEdit}>
                        <FormControlLabel><FormControlLabelText size="xs">Unit Stock ({formData.unit})</FormControlLabelText></FormControlLabel>
                        <Input borderRadius={12} bg="$white">
                            <InputField value={formData.stockQuantity} onChangeText={t => setFormData({...formData, stockQuantity: t})} keyboardType="numeric" />
                        </Input>
                    </FormControl>
                    {hasBulkOption && (
                        <FormControl isRequired flex={1} isDisabled={!canEdit}>
                            <FormControlLabel><FormControlLabelText size="xs">{formData.bulkUnit} Stock</FormControlLabelText></FormControlLabel>
                            <Input borderRadius={12} bg="$white">
                                <InputField value={formData.bulkStockQuantity} onChangeText={t => setFormData({...formData, bulkStockQuantity: t})} keyboardType="numeric" />
                            </Input>
                        </FormControl>
                    )}
                </HStack>
              </Box>

              {/* Pricing */}
              <Box bg="$backgroundLight50" p="$4" rounded="$2xl">
                <Heading size="xs" mb="$3" color="$text400">FINANCIALS</Heading>
                <VStack space="md">
                    <HStack space="md">
                        <FormControl isRequired flex={1} isDisabled={!canEdit}>
                            <FormControlLabel><FormControlLabelText size="xs">Cost Price (Unit)</FormControlLabelText></FormControlLabel>
                            <Input borderRadius={12} bg="$white">
                                <InputField value={formData.costPrice} onChangeText={t => setFormData({...formData, costPrice: t})} keyboardType="numeric" />
                            </Input>
                        </FormControl>
                        <FormControl isRequired flex={1} isDisabled={!canEdit}>
                            <FormControlLabel><FormControlLabelText size="xs">Selling Price (Unit)</FormControlLabelText></FormControlLabel>
                            <Input borderRadius={12} bg="$white">
                                <InputField value={formData.price} onChangeText={t => setFormData({...formData, price: t})} keyboardType="numeric" />
                            </Input>
                        </FormControl>
                    </HStack>

                    {hasBulkOption && (
                        <VStack space="md" p="$3" bg="$white" rounded="$xl" borderWidth={1} borderColor="$primary100" opacity={canEdit ? 1 : 0.8}>
                             <FormControl isRequired isDisabled={!canEdit}>
                                <FormControlLabel><FormControlLabelText size="xs">Bulk Unit Type</FormControlLabelText></FormControlLabel>
                                <Select onValueChange={(v) => setFormData({...formData, bulkUnit: v})} selectedValue={formData.bulkUnit}>
                                    <SelectTrigger borderRadius={12} bg="$backgroundLight50">
                                        <SelectInput placeholder="Select Unit" />
                                        <SelectIcon mr="$3"><Icon as={ChevronDownIcon} /></SelectIcon>
                                    </SelectTrigger>
                                    <SelectPortal>
                                        <SelectBackdrop />
                                        <SelectContent>
                                            <SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
                                            {BULK_UNITS.map(u => (
                                                <SelectItem key={u} label={u} value={u} />
                                            ))}
                                        </SelectContent>
                                    </SelectPortal>
                                </Select>
                            </FormControl>
                            <HStack space="md">
                                <FormControl isRequired flex={1} isDisabled={!canEdit}>
                                    <FormControlLabel><FormControlLabelText size="xs">{formData.bulkUnit} Price</FormControlLabelText></FormControlLabel>
                                    <Input borderRadius={12} bg="$backgroundLight50">
                                        <InputField value={formData.bulkPrice} onChangeText={t => setFormData({...formData, bulkPrice: t})} keyboardType="numeric" />
                                    </Input>
                                </FormControl>
                                <FormControl isRequired flex={1} isDisabled={!canEdit}>
                                    <FormControlLabel><FormControlLabelText size="xs">Units per {formData.bulkUnit}</FormControlLabelText></FormControlLabel>
                                    <Input borderRadius={12} bg="$backgroundLight50">
                                        <InputField value={formData.bulkQuantity} onChangeText={t => setFormData({...formData, bulkQuantity: t})} keyboardType="numeric" />
                                    </Input>
                                </FormControl>
                            </HStack>
                        </VStack>
                    )}
                </VStack>
              </Box>

              <HStack space="md">
                <FormControl flex={1} isDisabled={!canEdit}>
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

                <FormControl flex={1} isDisabled={!canEdit}>
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
            <ButtonText>{canEdit ? 'Cancel' : 'Close'}</ButtonText>
          </Button>
          {canEdit && (
            <Button action="primary" onPress={handleLocalSave} borderRadius={16} bg="$primary600" style={{ height: getButtonHeight(50) }}>
                <ButtonText fontWeight="$bold">Save Changes</ButtonText>
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditProductModal;
