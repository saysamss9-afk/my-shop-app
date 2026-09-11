import React, { useState, useEffect } from 'react';
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
  CloseIcon,
  Text as GlueText,
  Box,
  Divider,
  Center,
  Spinner,
} from '@gluestack-ui/themed';
import { Phone, Mail, Package, User, Wallet, Calendar, Clock } from 'lucide-react-native';
import type { Customer } from '../../../db/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  currency: string;
  fetchHistory: (id: string) => Promise<any[]>;
}

const CustomerDetailModal: React.FC<Props> = ({
  isOpen,
  onClose,
  customer,
  currency,
  fetchHistory,
}) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customer) {
      setLoading(true);
      fetchHistory(customer.id).then(data => {
        setHistory(data);
        setLoading(false);
      });
    }
  }, [isOpen, customer, fetchHistory]);

  if (!customer) return null;

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalBackdrop />
      <ModalContent rounded="$3xl" h="85%">
        <ModalHeader borderBottomWidth={1} borderBottomColor="$borderLight">
          <VStack>
            <Heading size="lg" fontWeight="$black">{customer.name}</Heading>
            <GlueText size="xs" color="$text500">Customer Profile & Purchase History</GlueText>
          </VStack>
          <ModalCloseButton>
            <Icon as={CloseIcon} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <VStack space="lg" py="$4">
            {/* Contact Info Card */}
            <Box bg="$backgroundLight50" p="$4" rounded="$2xl">
              <VStack space="md">
                <HStack space="md" alignItems="center">
                  <Icon as={Phone} size="sm" color="$primary600" />
                  <GlueText size="sm">{customer.phone || 'No phone number'}</GlueText>
                </HStack>
                {customer.email && (
                  <HStack space="md" alignItems="center">
                    <Icon as={Mail} size="sm" color="$primary600" />
                    <GlueText size="sm">{customer.email}</GlueText>
                  </HStack>
                )}
              </VStack>
            </Box>

            {/* Financial Summary */}
            <Box bg="$error50" p="$4" rounded="$2xl">
              <HStack space="sm" alignItems="center" mb="$1">
                <Icon as={Wallet} size="sm" color="$error600" />
                <GlueText size="sm" color="$error600" fontWeight="$bold">TOTAL OUTSTANDING DEBT</GlueText>
              </HStack>
              <Heading size="2xl" color="$error700">{currency}{customer.currentBalance.toLocaleString()}</Heading>
            </Box>

            <Divider my="$2" />

            <Heading size="sm" fontWeight="$black" color="$text800">Items Taken</Heading>

            {loading ? (
              <Center py="$10">
                <Spinner color="$primary600" />
              </Center>
            ) : history.length === 0 ? (
              <Center py="$10">
                <GlueText color="$text400">No purchase history found.</GlueText>
              </Center>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <VStack space="md" pb="$10">
                  {history.map((item, idx) => (
                    <Box
                        key={`${item.saleId}_${idx}`}
                        bg="$white"
                        p="$4"
                        rounded="$2xl"
                        borderWidth={1}
                        borderColor="$borderLight"
                    >
                      <HStack justifyContent="space-between" alignItems="flex-start" mb="$3">
                        <VStack flex={1}>
                            <GlueText fontWeight="$bold" size="md" color="$text900">{item.productName}</GlueText>
                            <GlueText size="xs" color="$text500">
                                {item.isBulk ? (item.bulkUnit || 'Carton') : (item.unit || 'pcs')}
                            </GlueText>
                        </VStack>
                        <VStack alignItems="flex-end">
                            <GlueText size="sm" fontWeight="$black" color="$primary700">
                                {item.quantity} x {currency}{item.priceAtSale.toFixed(2)}
                            </GlueText>
                            <GlueText size="xs" color="$text400">Total: {currency}{(item.quantity * item.priceAtSale).toFixed(2)}</GlueText>
                        </VStack>
                      </HStack>

                      <HStack space="md" borderTopWidth={1} borderTopColor="$backgroundLight50" pt="$2">
                          <HStack space="xs" alignItems="center">
                              <Icon as={Calendar} size="xs" color="$text400" />
                              <GlueText size="xs" color="$text500">{formatDate(item.timestamp)}</GlueText>
                          </HStack>
                          <HStack space="xs" alignItems="center">
                              <Icon as={Clock} size="xs" color="$text400" />
                              <GlueText size="xs" color="$text500">{formatTime(item.timestamp)}</GlueText>
                          </HStack>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </ScrollView>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter borderTopWidth={1} borderTopColor="$borderLight" pt="$3">
          <Button action="secondary" variant="outline" onPress={onClose} borderRadius={16} w="100%">
            <ButtonText>Close Profile</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CustomerDetailModal;
