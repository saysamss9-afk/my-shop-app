import React, { useState, useEffect } from 'react';
import { ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
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
import { Camera, Package, Info, Zap } from 'lucide-react-native';
import { getButtonHeight } from '../../../utils/platformStyles';
import { displayAlert } from '../../../utils/alert';
import type { Category } from '../../../db/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BULK_UNITS = ['Carton', 'Pack', 'Bag', 'Crate', 'Box', 'Bundle', 'Set'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  entryMode: 'UNIT' | 'BULK';
  categories: Category[];
  onSave: (product: any) => void;
  onScanPress: (target: 'unit' | 'bulk') => void;
  generateBarcode: () => string;
}

const AddProductModal: React.FC<Props> = ({
  isOpen,
  onClose,
  entryMode,
  categories,
  onSave,
  onScanPress,
  generateBarcode,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    bulkBarcode: '',
    bulkQuantity: '1',
    bulkPrice: '',
    bulkStockQuantity: '0',
    bulkUnit: 'Carton',
    price: '',
    costPrice: '',
    stockQuantity: '0',
    minStockLevel: '5',
    unit: 'pcs',
    categoryId: null as string | null,
  });

  const [hasBulkOption, setHasBulkOption] = useState(entryMode === 'BULK');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        barcode: '',
        bulkBarcode: '',
        bulkQuantity: '1',
        bulkPrice: '',
        bulkStockQuantity: entryMode === 'BULK' ? '1' : '0',
        bulkUnit: 'Carton',
        price: '',
        costPrice: '',
        stockQuantity: entryMode === 'UNIT' ? '1' : '0',
        minStockLevel: '5',
        unit: 'pcs',
        categoryId: null,
      });
      setHasBulkOption(entryMode === 'BULK');
    }
  }, [isOpen, entryMode]);

  const insets = useSafeAreaInsets();

  const handleLocalSave = () => {
    if (!formData.name) {
        displayAlert("Required", "Product Name is required.");
        return;
    }
    if (!formData.price && (!hasBulkOption || !formData.bulkPrice)) {
        displayAlert("Required", "Please provide a Selling Price.");
        return;
    }

    // Ensure barcodes exist as per requirement: "must either be scanned, or auto generated"
    const finalData = {
      ...formData,
      barcode: formData.barcode || generateBarcode(),
      bulkBarcode: (hasBulkOption && (formData.bulkBarcode || formData.bulkPrice)) ? (formData.bulkBarcode || generateBarcode()) : '',
      bulkPrice: hasBulkOption ? formData.bulkPrice : '0',
      bulkQuantity: hasBulkOption ? formData.bulkQuantity : '1',
      bulkStockQuantity: hasBulkOption ? formData.bulkStockQuantity : '0',
      bulkUnit: hasBulkOption ? formData.bulkUnit : null,
    };

    onSave(finalData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalBackdrop />
      <ModalContent rounded="$3xl" maxHeight="90%" w="$full" style={{ marginBottom: insets.bottom + 12 }}>
        <ModalHeader>
          <VStack>
            <Heading size="lg" fontWeight="$black">Add New Product</Heading>
            <GlueText size="xs" color="$text500">Provide complete product and pricing details.</GlueText>
          </VStack>
          <ModalCloseButton>
            <Icon as={CloseIcon} />
          </ModalCloseButton>
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

              <FormControl>
                <FormControlLabel mb="$1">
                  <FormControlLabelText size="sm">Category</FormControlLabelText>
                </FormControlLabel>
                <Select onValueChange={(v) => setFormData({...formData, categoryId: v})} selectedValue={formData.categoryId}>
                    <SelectTrigger borderRadius={16} bg="$backgroundLight50">
                        <SelectInput placeholder="Select Category" />
                        <SelectIcon as={ChevronDownIcon} mr="$3" />
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

              {/* Barcodes - Dynamically reordered based on selection */}
              <VStack space="md">
                {entryMode === 'UNIT' ? (
                  <>
                    {/* Unit Barcode on Top */}
                    <VStack space="xs">
                        <FormControlLabel><FormControlLabelText size="sm" fontWeight="$bold">Unit Barcode</FormControlLabelText></FormControlLabel>
                        <HStack space="xs">
                            <Input flex={1} borderRadius={12} bg="$backgroundLight50">
                                <InputField
                                    size="md"
                                    placeholder="Scan or type barcode"
                                    value={formData.barcode}
                                    onChangeText={t => setFormData({...formData, barcode: t})}
                                />
                            </Input>
                            <Button size="md" variant="outline" onPress={() => onScanPress('unit')} borderRadius={10} px="$3" borderColor="$primary300">
                                <Icon as={Camera} size="sm" color="$primary600" />
                            </Button>
                            <Button size="md" variant="outline" onPress={() => setFormData({...formData, barcode: generateBarcode()})} borderRadius={10} px="$3" borderColor="$warning300">
                                <Icon as={Zap} size="sm" color="$warning600" />
                            </Button>
                        </HStack>
                    </VStack>

                    {/* Bulk Barcode below */}
                    <VStack space="xs" opacity={hasBulkOption ? 1 : 0.6}>
                        <FormControlLabel><FormControlLabelText size="sm" fontWeight="$bold">{hasBulkOption ? formData.bulkUnit : 'Bulk'} Barcode</FormControlLabelText></FormControlLabel>
                        <HStack space="xs">
                            <Input flex={1} borderRadius={12} bg="$backgroundLight50" isDisabled={!hasBulkOption}>
                                <InputField
                                    size="md"
                                    placeholder={hasBulkOption ? "Scan or type barcode" : "Enable bulk below to enter"}
                                    value={formData.bulkBarcode}
                                    onChangeText={t => setFormData({...formData, bulkBarcode: t})}
                                />
                            </Input>
                            <Button size="md" variant="outline" onPress={() => onScanPress('bulk')} borderRadius={10} px="$3" borderColor="$primary300" isDisabled={!hasBulkOption}>
                                <Icon as={Camera} size="sm" color={hasBulkOption ? "$primary600" : "$text300"} />
                            </Button>
                            <Button size="md" variant="outline" onPress={() => setFormData({...formData, bulkBarcode: generateBarcode()})} borderRadius={10} px="$3" borderColor="$warning300" isDisabled={!hasBulkOption}>
                                <Icon as={Zap} size="sm" color={hasBulkOption ? "$warning600" : "$text300"} />
                            </Button>
                        </HStack>
                    </VStack>
                  </>
                ) : (
                  <>
                    {/* Bulk Barcode on Top */}
                    <VStack space="xs">
                        <FormControlLabel><FormControlLabelText size="sm" fontWeight="$bold">{formData.bulkUnit} Barcode</FormControlLabelText></FormControlLabel>
                        <HStack space="xs">
                            <Input flex={1} borderRadius={12} bg="$backgroundLight50">
                                <InputField
                                    size="md"
                                    placeholder="Scan or type barcode"
                                    value={formData.bulkBarcode}
                                    onChangeText={t => setFormData({...formData, bulkBarcode: t})}
                                />
                            </Input>
                            <Button size="md" variant="outline" onPress={() => onScanPress('bulk')} borderRadius={10} px="$3" borderColor="$primary300">
                                <Icon as={Camera} size="sm" color="$primary600" />
                            </Button>
                            <Button size="md" variant="outline" onPress={() => setFormData({...formData, bulkBarcode: generateBarcode()})} borderRadius={10} px="$3" borderColor="$warning300">
                                <Icon as={Zap} size="sm" color="$warning600" />
                            </Button>
                        </HStack>
                    </VStack>

                    {/* Unit Barcode below */}
                    <VStack space="xs">
                        <FormControlLabel><FormControlLabelText size="sm" fontWeight="$bold">Unit Barcode</FormControlLabelText></FormControlLabel>
                        <HStack space="xs">
                            <Input flex={1} borderRadius={12} bg="$backgroundLight50">
                                <InputField
                                    size="md"
                                    placeholder="Scan or type barcode"
                                    value={formData.barcode}
                                    onChangeText={t => setFormData({...formData, barcode: t})}
                                />
                            </Input>
                            <Button size="md" variant="outline" onPress={() => onScanPress('unit')} borderRadius={10} px="$3" borderColor="$primary300">
                                <Icon as={Camera} size="sm" color="$primary600" />
                            </Button>
                            <Button size="md" variant="outline" onPress={() => setFormData({...formData, barcode: generateBarcode()})} borderRadius={10} px="$3" borderColor="$warning300">
                                <Icon as={Zap} size="sm" color="$warning600" />
                            </Button>
                        </HStack>
                    </VStack>
                  </>
                )}
              </VStack>

              {/* Bulk Toggle Option */}
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

              {/* Stock Management */}
              <Box bg="$primary50" p="$4" rounded="$2xl">
                <HStack space="xs" alignItems="center" mb="$3">
                    <Icon as={Package} size="xs" color="$primary600" />
                    <Heading size="xs" color="$primary700">INITIAL STOCK</Heading>
                </HStack>
                <HStack space="md">
                    <FormControl isRequired flex={1}>
                        <FormControlLabel><FormControlLabelText size="xs">Unit Stock ({formData.unit})</FormControlLabelText></FormControlLabel>
                        <Input borderRadius={12} bg="$white">
                            <InputField value={formData.stockQuantity} onChangeText={t => setFormData({...formData, stockQuantity: t})} keyboardType="numeric" />
                        </Input>
                    </FormControl>
                    {hasBulkOption && (
                        <FormControl isRequired flex={1}>
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
                        <FormControl isRequired flex={1}>
                            <FormControlLabel><FormControlLabelText size="xs">Cost Price (Unit)</FormControlLabelText></FormControlLabel>
                            <Input borderRadius={12} bg="$white">
                                <InputField placeholder="0.00" value={formData.costPrice} onChangeText={t => setFormData({...formData, costPrice: t})} keyboardType="numeric" />
                            </Input>
                        </FormControl>
                        <FormControl isRequired flex={1}>
                            <FormControlLabel><FormControlLabelText size="xs">Selling Price (Unit)</FormControlLabelText></FormControlLabel>
                            <Input borderRadius={12} bg="$white">
                                <InputField placeholder="0.00" value={formData.price} onChangeText={t => setFormData({...formData, price: t})} keyboardType="numeric" />
                            </Input>
                        </FormControl>
                    </HStack>

                    {hasBulkOption && (
                        <VStack space="md" p="$3" bg="$white" rounded="$xl" borderWidth={1} borderColor="$primary100">
                            <FormControl isRequired>
                                <FormControlLabel><FormControlLabelText size="xs">Bulk Unit Type</FormControlLabelText></FormControlLabel>
                                <Select onValueChange={(v) => setFormData({...formData, bulkUnit: v})} selectedValue={formData.bulkUnit}>
                                        <SelectTrigger borderRadius={12} bg="$backgroundLight50">
                                        <SelectInput placeholder="Select Unit" />
                                        <SelectIcon as={ChevronDownIcon} mr="$3" />
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
                                <FormControl isRequired flex={1}>
                                    <FormControlLabel><FormControlLabelText size="xs">{formData.bulkUnit} Price</FormControlLabelText></FormControlLabel>
                                    <Input borderRadius={12} bg="$backgroundLight50">
                                        <InputField placeholder="0.00" value={formData.bulkPrice} onChangeText={t => setFormData({...formData, bulkPrice: t})} keyboardType="numeric" />
                                    </Input>
                                </FormControl>
                                <FormControl isRequired flex={1}>
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

              <FormControl>
                <FormControlLabel mb="$1">
                    <FormControlLabelText size="sm">Min Stock Alert (Units)</FormControlLabelText>
                </FormControlLabel>
                <Input borderRadius={16} bg="$backgroundLight50">
                    <InputField
                        value={formData.minStockLevel}
                        keyboardType="numeric"
                        onChangeText={text => setFormData({ ...formData, minStockLevel: text })}
                    />
                </Input>
              </FormControl>

            </VStack>
          </ScrollView>
          </KeyboardAvoidingView>
        </ModalBody>
        <ModalFooter style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <Button variant="outline" action="secondary" onPress={onClose} mr="$3" borderRadius={16}>
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button action="primary" onPress={handleLocalSave} borderRadius={16} bg="$primary600" style={{ height: getButtonHeight(50) }}>
            <ButtonText fontWeight="$bold">Add Product</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddProductModal;
