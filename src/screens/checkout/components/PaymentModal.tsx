import React, { useState } from 'react';
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
  Pressable,
} from '@gluestack-ui/themed';
import { Wallet, CreditCard, User } from 'lucide-react-native';
import { Customer } from '../../../db/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  currency: string;
  onConfirm: (method: string) => void;
  selectedCustomer: Customer | null;
}

const PaymentModal: React.FC<Props> = ({ isOpen, onClose, total, currency, onConfirm, selectedCustomer }) => {
  const [method, setMethod] = useState('CASH');

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalBackdrop />
      <ModalContent rounded="$3xl">
        <ModalHeader>
          <Heading size="lg">Finalize Sale</Heading>
          <ModalCloseButton><Icon as={CloseIcon} /></ModalCloseButton>
        </ModalHeader>
        <ModalBody>
            <VStack space="xl" py="$6" alignItems="center">
              <VStack space="xs" alignItems="center">
                  <Text size="sm" color="$text500">Amount Due</Text>
                  <Heading size="3xl" color="$primary800" fontWeight="$black">{currency}{total.toFixed(2)}</Heading>
              </VStack>
              <Divider />

              <VStack space="md" w="$full">
                  <Text size="sm" fontWeight="$bold" color="$text600">Select Payment Method</Text>

                  <Pressable onPress={() => setMethod('CASH')}>
                      <HStack
                        space="md"
                        alignItems="center"
                        bg={method === 'CASH' ? '$primary50' : '$backgroundLight50'}
                        borderWidth={method === 'CASH' ? 2 : 0}
                        borderColor="$primary600"
                        p="$4"
                        rounded="$xl"
                      >
                          <Icon as={Wallet} color={method === 'CASH' ? '$primary600' : '$text600'} />
                          <Text fontWeight={method === 'CASH' ? '$bold' : '$normal'}>Cash Payment</Text>
                      </HStack>
                  </Pressable>

                  {selectedCustomer ? (
                      <Pressable onPress={() => setMethod('DEBT')}>
                          <HStack
                            space="md"
                            alignItems="center"
                            bg={method === 'DEBT' ? '$error50' : '$backgroundLight50'}
                            borderWidth={method === 'DEBT' ? 2 : 0}
                            borderColor="$error600"
                            p="$4"
                            rounded="$xl"
                          >
                              <Icon as={User} color={method === 'DEBT' ? '$error600' : '$text600'} />
                              <VStack>
                                <Text fontWeight={method === 'DEBT' ? '$bold' : '$normal'}>Buy on Credit (Debt)</Text>
                                <Text size="xs" color="$text500">Customer: {selectedCustomer.name}</Text>
                              </VStack>
                          </HStack>
                      </Pressable>
                  ) : (
                      <Box bg="$backgroundLight100" p="$4" rounded="$xl" opacity={0.5}>
                          <HStack space="md" alignItems="center">
                              <Icon as={User} color="$text400" />
                              <Text color="$text400">Debt (Select customer first)</Text>
                          </HStack>
                      </Box>
                  )}
              </VStack>
            </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" action="secondary" onPress={onClose} mr="$3" borderRadius="$lg">
            <ButtonText>Back</ButtonText>
          </Button>
          <Button action="primary" onPress={() => onConfirm(method)} borderRadius="$lg" bg={method === 'DEBT' ? '$error600' : '$primary800'}>
            <ButtonText fontWeight="$bold">Confirm Transaction</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PaymentModal;
