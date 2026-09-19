import React, { useState } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Heading,
  Icon,
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
  Divider,
  Button,
  ButtonText,
  CloseIcon,
  Box,
  Center,
  Pressable,
} from '@gluestack-ui/themed';
import { Wallet, CreditCard, User, Smartphone, ShoppingBag } from 'lucide-react-native';
import type { Customer } from '../../../db/types';
import type { CartItem } from '../../../hooks/useCheckout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  currency: string;
  onConfirm: (method: string) => void;
  selectedCustomer: Customer | null;
  cart: CartItem[];
}

const PaymentModal: React.FC<Props> = ({ isOpen, onClose, total, currency, onConfirm, selectedCustomer, cart }) => {
  const [method, setMethod] = useState('CASH');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm(method);
    } catch (e) {
      setIsSubmitting(false);
    }
  };

  const PAYMENT_METHODS = [
    { id: 'CASH', label: 'Cash Payment', icon: Wallet, color: '$primary600', bgColor: '$primary50' },
    { id: 'MOMO', label: 'Mobile Money', icon: Smartphone, color: '$success600', bgColor: '$success50' },
    { id: 'CARD', label: 'POS / Card', icon: CreditCard, color: '$info600', bgColor: '$info50' },
  ];

  const insets = useSafeAreaInsets();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalBackdrop />
      <ModalContent rounded="$3xl" style={{ marginBottom: insets.bottom + 12, maxHeight: '90%' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ModalHeader borderBottomWidth={1} borderBottomColor="$borderLight">
            <Heading size="lg" fontWeight="$black">Finalize Sale</Heading>
            <ModalCloseButton><Icon as={CloseIcon} /></ModalCloseButton>
          </ModalHeader>
          <ModalBody>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <VStack space="xl" py="$6">
                  {/* Amount Summary */}
                  <VStack space="xs" alignItems="center">
                      <Text size="sm" color="$text500" fontWeight="$bold">Total Amount Due</Text>
                      <Heading size="3xl" color="$primary800" fontWeight="$black">{currency}{total.toFixed(2)}</Heading>

                      {selectedCustomer ? (
                          <HStack space="xs" alignItems="center" bg="$backgroundLight100" px="$3" py="$1" rounded="$full" mt="$2">
                             <Icon as={User} size="xs" color="$text600" />
                             <Text size="xs" fontWeight="$bold" color="$text700">Customer: {selectedCustomer.name}</Text>
                          </HStack>
                      ) : (
                          <Text size="xs" color="$text400" mt="$2">Walk-in Customer</Text>
                      )}
                  </VStack>

                  {/* Order Preview */}
                  <VStack space="sm" bg="$backgroundLight50" p="$4" rounded="$2xl">
                      <HStack space="xs" alignItems="center" mb="$1">
                        <Icon as={ShoppingBag} size="xs" color="$text500" />
                        <Text size="xs" fontWeight="$bold" color="$text600">ORDER SUMMARY ({cart.length} items)</Text>
                      </HStack>
                      <VStack space="xs">
                        {cart.map((item, idx) => (
                            <HStack key={`${item.product.id}_${idx}`} justifyContent="space-between" alignItems="center">
                                <Text size="sm" flex={1} numberOfLines={1} color="$text800">
                                    {item.product.name} {item.isBulk ? `(${item.product.bulkUnit || 'Carton'})` : ''}
                                </Text>
                                <Text size="sm" fontWeight="$bold" color="$text900">
                                    {item.quantity} x {currency}{(item.isBulk ? item.product.bulkPrice : item.product.price).toFixed(2)}
                                </Text>
                            </HStack>
                        ))}
                      </VStack>
                  </VStack>

                  <Divider />

                  {/* Payment Selection */}
                  <VStack space="md">
                      <Text size="sm" fontWeight="$black" color="$text800">Select Payment Method</Text>

                      <HStack space="sm" flexWrap="wrap">
                          {PAYMENT_METHODS.map((m) => (
                              <Pressable
                                key={m.id}
                                flex={1}
                                minWidth={140}
                                onPress={() => !isSubmitting && setMethod(m.id)}
                              >
                                  <VStack
                                    space="xs"
                                    alignItems="center"
                                    justifyContent="center"
                                    bg={method === m.id ? m.bgColor : '$white'}
                                    borderWidth={2}
                                    borderColor={method === m.id ? m.color : '$borderLight'}
                                    p="$4"
                                    rounded="$2xl"
                                  >
                                      <Icon as={m.icon} color={method === m.id ? m.color : '$text400'} size="md" />
                                      <Text size="xs" fontWeight="$bold" color={method === m.id ? m.color : '$text600'}>{m.label}</Text>
                                  </VStack>
                              </Pressable>
                          ))}
                      </HStack>

                      <Divider my="$2" />

                      {/* Debt Option */}
                      {selectedCustomer ? (
                          <Pressable onPress={() => !isSubmitting && setMethod('DEBT')}>
                              <HStack
                                space="md"
                                alignItems="center"
                                bg={method === 'DEBT' ? '$error50' : '$white'}
                                borderWidth={2}
                                borderColor={method === 'DEBT' ? '$error600' : '$borderLight'}
                                p="$4"
                                rounded="$2xl"
                              >
                                  <Center w={40} h={40} bg="$error100" rounded="$full">
                                    <Icon as={User} color="$error600" />
                                  </Center>
                                  <VStack flex={1}>
                                    <Text fontWeight="$bold" color={method === 'DEBT' ? '$error700' : '$text900'}>Sell on Credit (Debt)</Text>
                                    <Text size="xs" color="$text500">Record this balance to {selectedCustomer.name}'s profile</Text>
                                  </VStack>
                                  <Box w={20} h={20} rounded="$full" borderWidth={2} borderColor={method === 'DEBT' ? '$error600' : '$text200'} alignItems="center" justifyContent="center">
                                      {method === 'DEBT' && <Box w={10} h={10} rounded="$full" bg="$error600" />}
                                  </Box>
                              </HStack>
                          </Pressable>
                      ) : (
                          <Box bg="$backgroundLight100" p="$4" rounded="$2xl" opacity={0.6} borderWidth={1} borderStyle="dashed" borderColor="$text300">
                              <HStack space="md" alignItems="center">
                                  <Icon as={User} color="$text400" />
                                  <VStack>
                                    <Text color="$text400" fontWeight="$bold">Credit Option Unavailable</Text>
                                    <Text size="xs" color="$text400">Select a customer first to enable debt selling.</Text>
                                  </VStack>
                              </HStack>
                          </Box>
                      )}
                  </VStack>
                </VStack>
            </ScrollView>
        </ModalBody>
        <ModalFooter borderTopWidth={1} borderTopColor="$borderLight" pt="$4">
          <Button variant="outline" action="secondary" onPress={onClose} mr="$3" borderRadius="$xl" flex={1} isDisabled={isSubmitting}>
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button
            action="primary"
            onPress={handleConfirm}
            borderRadius="$xl"
            bg={method === 'DEBT' ? '$error600' : '$primary600'}
            flex={2}
            isDisabled={isSubmitting}
          >
            <ButtonText fontWeight="$bold">{isSubmitting ? 'Saving...' : 'Finish & Save'}</ButtonText>
          </Button>
        </ModalFooter>
        </KeyboardAvoidingView>
      </ModalContent>
    </Modal>
  );
};

export default PaymentModal;
