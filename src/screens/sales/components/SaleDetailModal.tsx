import React from 'react';
import { Modal, ScrollView } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Pressable,
  Button,
  ButtonText,
  CloseIcon,
  Divider,
  Center,
} from '@gluestack-ui/themed';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sale: any | null;
  items: any[];
  currency: string;
  onPrint?: (sale: any, items: any[]) => void;
  onRefundItem?: (saleItemId: string, quantity: number) => void;
}

const SaleDetailModal: React.FC<Props> = ({ isOpen, onClose, sale, items, currency, onPrint, onRefundItem }) => {
  if (!sale) return null;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Box flex={1} bg="rgba(0,0,0,0.5)" justifyContent="center" p="$4">
        <Box bg="$white" rounded="$3xl" overflow="hidden">
          {/* Header */}
          <Box p="$6" bg="$primary800">
            <HStack justifyContent="space-between" alignItems="flex-start">
              <VStack space="xs">
                <Text color="$primary100" size="xs" fontWeight="$bold" textTransform="uppercase">Transaction Details</Text>
                <Heading color="white" size="lg">#{sale.id.slice(-8).toUpperCase()}</Heading>
              </VStack>
              <Pressable onPress={onClose} p="$2" bg="rgba(255,255,255,0.2)" rounded="$full">
                <Icon as={CloseIcon} color="white" />
              </Pressable>
            </HStack>
          </Box>

          <ScrollView style={{ maxHeight: 500 }}>
            <VStack p="$6" space="xl">
              {/* Info Grid */}
              <HStack space="md">
                <VStack flex={1} space="xs">
                  <Text size="xs" color="$text500">DATE & TIME</Text>
                  <Text size="sm" fontWeight="$bold" color="$text900">{formatDate(sale.timestamp)}</Text>
                </VStack>
                <VStack flex={1} space="xs">
                  <Text size="xs" color="$text500">PAYMENT & STATUS</Text>
                  <Text size="sm" fontWeight="$bold" color={sale.isReverted === 1 ? "$error700" : "$primary700"}>
                    {sale.paymentMethod} ({sale.paymentStatus}){sale.isReverted === 1 ? ' [REVERTED]' : ''}
                  </Text>
                </VStack>
              </HStack>

              <HStack space="md">
                <VStack flex={1} space="xs">
                  <Text size="xs" color="$text500">INITIATED BY</Text>
                  <HStack space="xs" alignItems="center">
                    <MaterialCommunityIcons name="account-tie" size={14} color="#666" />
                    <Text size="sm" fontWeight="$bold" color="$text900">{sale.staffName} ({sale.staffRole})</Text>
                  </HStack>
                </VStack>
                {sale.customerName && (
                  <VStack flex={1} space="xs">
                    <Text size="xs" color="$text500">CUSTOMER</Text>
                    <HStack space="xs" alignItems="center">
                      <MaterialCommunityIcons name="account" size={14} color="#666" />
                      <Text size="sm" fontWeight="$bold" color="$text900">{sale.customerName}</Text>
                    </HStack>
                  </VStack>
                )}
              </HStack>

              <Divider />

              {/* Items List */}
              <VStack space="md">
                <Text size="xs" color="$text500" fontWeight="$bold">ITEMS INVOLVED</Text>
                {items.map((item, index) => (
                  <HStack key={index} justifyContent="space-between" alignItems="center">
                    <VStack flex={1} space="0">
                      <Text fontWeight="$bold" color="$text900" size="sm">{item.productName || 'Removed Product'}</Text>
                      <Text size="xs" color="$text500">
                        {item.quantity} x {currency}{item.priceAtSale.toFixed(2)} {item.isBulk ? (item.bulkUnit || 'Bulk') : (item.unit || 'Unit')}
                      </Text>
                    </VStack>
                    <HStack space="md" alignItems="center">
                      <Text fontWeight="$bold" color="$text900">
                        {currency}{(item.quantity * item.priceAtSale).toFixed(2)}
                      </Text>
                      {sale.isReverted !== 1 && onRefundItem && (
                        <Pressable
                          onPress={() => {
                            if (typeof window !== 'undefined' && (window as any).confirm) {
                              if (window.confirm(`Reverse 1 unit of ${item.productName || 'product'} back to stock?`)) {
                                onRefundItem(item.id, 1);
                              }
                            } else {
                              import('react-native').then(({ Alert }) => {
                                Alert.alert(
                                  "Return Item",
                                  `Reverse 1 unit of "${item.productName || 'product'}" back to stock?`,
                                  [
                                    { text: "Cancel", style: "cancel" },
                                    { text: "Confirm", style: "destructive", onPress: () => onRefundItem(item.id, 1) }
                                  ]
                                );
                              });
                            }
                          }}
                          p="$2"
                          bg="$error50"
                          rounded="$lg"
                        >
                          <MaterialCommunityIcons name="undo-variant" size={16} color="#DC2626" />
                        </Pressable>
                      )}
                    </HStack>
                  </HStack>
                ))}
              </VStack>
            </VStack>
          </ScrollView>

          {/* Footer */}
          <Box p="$6" borderTopWidth={1} borderColor="$borderLight">
            <HStack justifyContent="space-between" alignItems="center">
              <Heading size="md" color="$text900">Total Amount</Heading>
              <Heading size="xl" color="$primary800">{currency}{sale.totalAmount.toFixed(2)}</Heading>
            </HStack>

            <HStack space="md" mt="$6">
                <Button
                    flex={1}
                    size="lg"
                    variant="outline"
                    action="secondary"
                    borderColor="$primary800"
                    onPress={() => onPrint?.(sale, items)}
                    borderRadius="$xl"
                >
                    <HStack space="xs" alignItems="center">
                        <Icon as={MaterialCommunityIcons} name="printer" color="$primary800" />
                        <ButtonText color="$primary800" fontWeight="$bold">Print Receipt</ButtonText>
                    </HStack>
                </Button>

                <Button
                    flex={1}
                    size="lg"
                    variant="solid"
                    action="primary"
                    bg="$primary800"
                    onPress={onClose}
                    borderRadius="$xl"
                >
                    <ButtonText fontWeight="$bold">Close</ButtonText>
                </Button>
            </HStack>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default SaleDetailModal;
