import React, { useState } from 'react';
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
  VStack,
  HStack,
  Text,
  CloseIcon,
  Box,
  Divider,
  Pressable,
} from '@gluestack-ui/themed';
import { RotateCcw } from 'lucide-react-native';
import PurchaseReturnModal from './PurchaseReturnModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  purchase: any;
  onReturnItem?: (item: any, quantity: number, reason: string) => void;
}

const PurchaseDetailModal: React.FC<Props> = ({ isOpen, onClose, purchase, onReturnItem }) => {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  if (!purchase) return null;

  const handleReturnPress = (item: any) => {
    setSelectedItem(item);
    setIsReturnModalOpen(true);
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalBackdrop />
      <ModalContent rounded="$3xl">
        <ModalHeader>
          <VStack>
            <Heading size="lg" fontWeight="$black">Purchase Details</Heading>
            <Text size="xs" color="$text500">Invoice: {purchase.invoiceNumber || 'N/A'}</Text>
          </VStack>
          <ModalCloseButton><Icon as={CloseIcon} /></ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <ScrollView showsVerticalScrollIndicator={false}>
            <VStack space="lg" py="$4">
              {/* Summary Info */}
              <Box bg="$backgroundLight50" p="$4" rounded="$2xl">
                <HStack justifyContent="space-between" mb="$2">
                    <Text size="xs" color="$text500" fontWeight="$bold">SUPPLIER</Text>
                    <Text size="sm" fontWeight="$bold">{purchase.supplierName}</Text>
                </HStack>
                <HStack justifyContent="space-between" mb="$2">
                    <Text size="xs" color="$text500" fontWeight="$bold">DATE</Text>
                    <Text size="sm">{new Date(purchase.timestamp).toLocaleString()}</Text>
                </HStack>
                <HStack justifyContent="space-between">
                    <Text size="xs" color="$text500" fontWeight="$bold">STATUS</Text>
                    <Text size="sm" fontWeight="$bold" color={purchase.paymentStatus === 'PAID' ? '$success700' : '$error600'}>
                        {purchase.paymentStatus}
                    </Text>
                </HStack>
              </Box>

              {/* Items List */}
              <VStack space="sm">
                <Heading size="xs" color="$text400" fontWeight="$bold">PRODUCTS BOUGHT</Heading>
                {purchase.items?.map((item: any, idx: number) => (
                    <Box key={idx} py="$2">
                        <HStack justifyContent="space-between" alignItems="center">
                            <VStack flex={1}>
                                <Text size="sm" fontWeight="$bold" color="$text900">{item.productName}</Text>
                                <Text size="xs" color="$text500">{item.quantity} {item.isBulk ? 'Cartons' : 'Units'} @ {purchase.currency || '₵'}{item.costPrice.toFixed(2)}</Text>
                            </VStack>
                            <HStack space="md" alignItems="center">
                                <Text size="sm" fontWeight="$black">{purchase.currency || '₵'}{(item.quantity * item.costPrice).toFixed(2)}</Text>
                                <Pressable onPress={() => handleReturnPress(item)} p="$2" bg="$error50" rounded="$lg">
                                    <Icon as={RotateCcw} color="$error600" size="xs" />
                                </Pressable>
                            </HStack>
                        </HStack>
                        {idx < purchase.items.length - 1 && <Divider mt="$2" />}
                    </Box>
                ))}
              </VStack>

              {/* Financial Totals */}
              <Box borderTopWidth={1} borderColor="$borderLight" pt="$4">
                <HStack justifyContent="space-between" mb="$1">
                    <Text size="sm">Subtotal</Text>
                    <Text size="sm" fontWeight="$bold">{purchase.currency || '₵'}{purchase.totalCost.toFixed(2)}</Text>
                </HStack>
                <HStack justifyContent="space-between" mb="$1">
                    <Text size="sm" color="$success700">Amount Paid</Text>
                    <Text size="sm" fontWeight="$bold" color="$success700">- {purchase.currency || '₵'}{purchase.amountPaid.toFixed(2)}</Text>
                </HStack>
                <Divider my="$2" />
                <HStack justifyContent="space-between">
                    <Heading size="sm">Balance Owed</Heading>
                    <Heading size="sm" color="$error600">{purchase.currency || '₵'}{purchase.balance.toFixed(2)}</Heading>
                </HStack>
              </Box>
            </VStack>
          </ScrollView>
        </ModalBody>
        <ModalFooter>
          <Button action="secondary" variant="outline" onPress={onClose} borderRadius={16} flex={1}>
            <ButtonText>Close</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>

    <PurchaseReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        item={selectedItem}
        onSave={(qty, reason) => onReturnItem?.(selectedItem, qty, reason)}
    />
    </>
  );
};

export default PurchaseDetailModal;

export default PurchaseDetailModal;
