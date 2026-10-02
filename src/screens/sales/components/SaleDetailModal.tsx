import React from 'react';
import { Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { displayAlert } from '../../../utils/alert';
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
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sale: any | null;
  items: any[];
  currency: string;
  onPrint?: (sale: any, items: any[]) => void;
  onRefundItem?: (saleItemId: string, quantity: number) => void;
}

const SaleDetailModal: React.FC<Props> = ({
  isOpen,
  onClose,
  sale,
  items,
  currency,
  onPrint,
  onRefundItem,
}) => {
  const insets = useSafeAreaInsets();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const flexDir = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' : 'left';

  if (!sale) return null;

  const formatDate = (timestamp: number) => {
    const value = Number(timestamp) || 0;
    if (!value) return 'N/A';
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const totalAmount = Number(sale.totalAmount || 0);
  const amountPaid = sale.amountPaid !== undefined && sale.amountPaid !== null
    ? Number(sale.amountPaid)
    : (sale.paymentStatus === 'DEBT' ? 0 : totalAmount);
  const balance = sale.balance !== undefined && sale.balance !== null
    ? Number(sale.balance)
    : (sale.paymentStatus === 'DEBT' ? totalAmount : 0);

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Box
        flex={1}
        bg="rgba(0,0,0,0.5)"
        justifyContent="center"
        p="$4"
        pt={insets.top + 20}
        pb={insets.bottom + 20}
      >
        <Box bg="$white" rounded="$3xl" overflow="hidden" maxHeight="90%">
          {/* Header */}
          <Box p="$5" bg="$primary800">
            <HStack justifyContent="space-between" alignItems="center" flexDirection={flexDir}>
              <VStack space="2xs">
                <Text color="$primary100" size="xs" fontWeight="$bold" textTransform="uppercase" textAlign={textAlign}>
                  Transaction Details
                </Text>
                <Heading color="white" size="lg" textAlign={textAlign}>
                  #{String(sale.id || '').slice(-8).toUpperCase()}
                </Heading>
              </VStack>
              <Pressable
                onPress={onClose}
                p="$2"
                bg="rgba(255,255,255,0.2)"
                rounded="$full"
                accessibilityLabel="Close modal"
                accessibilityRole="button"
              >
                <Icon as={CloseIcon} color="white" />
              </Pressable>
            </HStack>
          </Box>

          <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
            <VStack p="$5" space="lg">
              {/* Info Grid */}
              <VStack space="md">
                <HStack space="md" flexDirection={flexDir}>
                  <Box flex={1} bg="$backgroundLight50" p="$3" rounded="$2xl" borderWidth={1} borderColor="$borderLight">
                    <Text size="2xs" color="$text500" fontWeight="$bold" textTransform="uppercase" textAlign={textAlign}>
                      DATE & TIME
                    </Text>
                    <Text size="xs" fontWeight="$bold" color="$text900" mt="$1" numberOfLines={2} textAlign={textAlign}>
                      {formatDate(sale.timestamp)}
                    </Text>
                  </Box>

                  <Box flex={1} bg="$backgroundLight50" p="$3" rounded="$2xl" borderWidth={1} borderColor="$borderLight">
                    <Text size="2xs" color="$text500" fontWeight="$bold" textTransform="uppercase" textAlign={textAlign}>
                      PAYMENT & STATUS
                    </Text>
                    <HStack space="xs" alignItems="center" mt="$1" flexWrap="nowrap" flexDirection={flexDir}>
                      <Box bg={sale.isReverted === 1 ? "$error100" : "$primary100"} px="$2" py="$0.5" rounded="$md">
                        <Text
                          size="2xs"
                          fontWeight="$bold"
                          color={sale.isReverted === 1 ? "$error700" : "$primary800"}
                          numberOfLines={1}
                        >
                          {sale.paymentMethod || 'CASH'} • {sale.paymentStatus || 'PAID'}
                          {sale.isReverted === 1 ? ' [REVERTED]' : ''}
                        </Text>
                      </Box>
                    </HStack>
                  </Box>
                </HStack>

                <HStack space="md" flexDirection={flexDir}>
                  <Box flex={1} bg="$backgroundLight50" p="$3" rounded="$2xl" borderWidth={1} borderColor="$borderLight">
                    <Text size="2xs" color="$text500" fontWeight="$bold" textTransform="uppercase" textAlign={textAlign}>
                      INITIATED BY
                    </Text>
                    <HStack space="xs" alignItems="center" mt="$1" flexDirection={flexDir}>
                      <MaterialCommunityIcons name="account-tie" size={14} color="#666" />
                      <Text size="xs" fontWeight="$bold" color="$text900" numberOfLines={1} ellipsizeMode="tail" textAlign={textAlign}>
                        {sale.staffName || 'Staff'}
                      </Text>
                    </HStack>
                  </Box>

                  {sale.customerName ? (
                    <Box flex={1} bg="$backgroundLight50" p="$3" rounded="$2xl" borderWidth={1} borderColor="$borderLight">
                      <Text size="2xs" color="$text500" fontWeight="$bold" textTransform="uppercase" textAlign={textAlign}>
                        CUSTOMER
                      </Text>
                      <HStack space="xs" alignItems="center" mt="$1" flexDirection={flexDir}>
                        <MaterialCommunityIcons name="account" size={14} color="#666" />
                        <Text size="xs" fontWeight="$bold" color="$text900" numberOfLines={1} ellipsizeMode="tail" textAlign={textAlign}>
                          {sale.customerName}
                        </Text>
                      </HStack>
                    </Box>
                  ) : (
                    <Box flex={1} bg="$backgroundLight50" p="$3" rounded="$2xl" borderWidth={1} borderColor="$borderLight">
                      <Text size="2xs" color="$text500" fontWeight="$bold" textTransform="uppercase" textAlign={textAlign}>
                        CUSTOMER
                      </Text>
                      <HStack space="xs" alignItems="center" mt="$1" flexDirection={flexDir}>
                        <MaterialCommunityIcons name="account-outline" size={14} color="#999" />
                        <Text size="xs" color="$text400" numberOfLines={1} textAlign={textAlign}>
                          Walk-in
                        </Text>
                      </HStack>
                    </Box>
                  )}
                </HStack>
              </VStack>

              <Divider />

              {/* Items List */}
              <VStack space="sm">
                <HStack justifyContent="space-between" alignItems="center" mb="$1" flexDirection={flexDir}>
                  <Text size="xs" color="$text500" fontWeight="$bold" textTransform="uppercase">
                    ITEMS INVOLVED ({items.length})
                  </Text>
                </HStack>

                {items.length === 0 ? (
                  <Center py="$4">
                    <Text size="xs" color="$text400">No items recorded for this sale.</Text>
                  </Center>
                ) : (
                  items.map((item, index) => {
                    const itemQty = Number(item.quantity) || 0;
                    const itemPrice = Number(item.priceAtSale) || 0;
                    const itemTotal = itemQty * itemPrice;
                    const unitLabel = item.isBulk ? (item.bulkUnit || 'Bulk') : (item.unit || 'Unit');

                    return (
                      <Box
                        key={item.id || index}
                        bg="$backgroundLight50"
                        p="$3"
                        rounded="$xl"
                        borderWidth={1}
                        borderColor="$borderLight"
                      >
                        <HStack justifyContent="space-between" alignItems="center" space="md" flexDirection={flexDir}>
                          {/* Product Info Column */}
                          <VStack flex={1} space="2xs">
                            <Text
                              fontWeight="$bold"
                              color="$text900"
                              size="sm"
                              numberOfLines={1}
                              ellipsizeMode="tail"
                              textAlign={textAlign}
                            >
                              {item.productName || item.productname || 'Removed Product'}
                            </Text>
                            <HStack space="xs" alignItems="center" flexWrap="nowrap" flexDirection={flexDir}>
                              <Box bg="$primary50" px="$2" py="$0.5" rounded="$md">
                                <Text size="2xs" color="$primary800" fontWeight="$bold" numberOfLines={1}>
                                  {itemQty} {unitLabel}
                                </Text>
                              </Box>
                              <Text size="2xs" color="$text500" numberOfLines={1}>
                                × {currency}{itemPrice.toFixed(2)}
                              </Text>
                            </HStack>
                          </VStack>

                          {/* Item Price and Refund Action */}
                          <HStack space="sm" alignItems="center" flexShrink={0} flexDirection={flexDir}>
                            <Text fontWeight="$black" color="$text900" size="sm" numberOfLines={1}>
                              {currency}{itemTotal.toFixed(2)}
                            </Text>
                            {sale.isReverted !== 1 && onRefundItem && (
                              <Pressable
                                onPress={() => {
                                  displayAlert(
                                    "Return Item",
                                    `Reverse 1 unit of "${item.productName || item.productname || 'product'}" back to stock?`,
                                    [
                                      { text: "Cancel", style: "cancel" },
                                      { text: "Confirm", style: "destructive", onPress: () => onRefundItem(item.id, 1) }
                                    ]
                                  );
                                }}
                                p="$2"
                                minWidth={36}
                                minHeight={36}
                                justifyContent="center"
                                alignItems="center"
                                bg="$error50"
                                rounded="$lg"
                                accessibilityLabel="Return item"
                                accessibilityRole="button"
                              >
                                <MaterialCommunityIcons name="undo-variant" size={16} color="#DC2626" />
                              </Pressable>
                            )}
                          </HStack>
                        </HStack>
                      </Box>
                    );
                  })
                )}
              </VStack>
            </VStack>
          </ScrollView>

          {/* Footer */}
          <Box p="$5" bg="$white" borderTopWidth={1} borderColor="$borderLight">
            <VStack space="xs" mb="$4">
              <HStack justifyContent="space-between" alignItems="center" flexDirection={flexDir}>
                <Text size="xs" color="$text600">Total Payable:</Text>
                <Text size="sm" fontWeight="$bold" color="$text900" numberOfLines={1}>
                  {currency}{totalAmount.toFixed(2)}
                </Text>
              </HStack>
              <HStack justifyContent="space-between" alignItems="center" flexDirection={flexDir}>
                <Text size="xs" color="$text600">Amount Paid:</Text>
                <Text size="sm" fontWeight="$bold" color="$success700" numberOfLines={1}>
                  {currency}{amountPaid.toFixed(2)}
                </Text>
              </HStack>
              {(balance > 0 || sale.paymentStatus === 'DEBT' || sale.paymentStatus === 'PARTIAL') && (
                <HStack justifyContent="space-between" alignItems="center" flexDirection={flexDir}>
                  <Text size="xs" color="$error700" fontWeight="$bold">Unpaid Debt Balance:</Text>
                  <Text size="sm" fontWeight="$bold" color="$error700" numberOfLines={1}>
                    {currency}{balance.toFixed(2)}
                  </Text>
                </HStack>
              )}
            </VStack>

            <HStack space="md" flexDirection={flexDir}>
              <Button
                flex={1}
                size="md"
                variant="outline"
                action="secondary"
                borderColor="$primary800"
                onPress={() => onPrint?.(sale, items)}
                borderRadius="$xl"
                minHeight={44}
              >
                <HStack space="xs" alignItems="center" justifyContent="center" flexDirection={flexDir}>
                  <Icon as={MaterialCommunityIcons as any} {...({ name: 'printer' } as any)} color="$primary800" size="xs" />
                  <ButtonText color="$primary800" fontWeight="$bold" size="sm" numberOfLines={1}>
                    Print Receipt
                  </ButtonText>
                </HStack>
              </Button>

              <Button
                flex={1}
                size="md"
                variant="solid"
                action="primary"
                bg="$primary800"
                onPress={onClose}
                borderRadius="$xl"
                minHeight={44}
              >
                <ButtonText fontWeight="$bold" size="sm" numberOfLines={1}>
                  Close
                </ButtonText>
              </Button>
            </HStack>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default SaleDetailModal;
