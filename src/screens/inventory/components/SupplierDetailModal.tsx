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
  ModalFooter,
  ModalCloseButton,
  ModalBody,
  VStack,
  HStack,
  CloseIcon,
  Text as GlueText,
  Box,
  Divider,
  Center,
  Spinner,
} from '@gluestack-ui/themed';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Wallet,
  Package,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Supplier, Product } from '../../../db/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  supplier: (Supplier & { productCount: number }) | null;
  currency: string;
  fetchProducts: (id: string) => Promise<Product[]>;
  onOrderProducts?: (supplier: Supplier) => void;
}

const SupplierDetailModal: React.FC<Props> = ({
  isOpen,
  onClose,
  supplier,
  currency,
  fetchProducts,
  onOrderProducts,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && supplier) {
      setLoading(true);
      fetchProducts(supplier.id).then(data => {
        setProducts(data);
        setLoading(false);
      });
    }
  }, [isOpen, supplier, fetchProducts]);

  const insets = useSafeAreaInsets();

  if (!supplier) return null;

  const currentBalance = Number(supplier.currentBalance ?? 0);
  const formattedBalance = currentBalance.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalBackdrop />
      <ModalContent rounded="$3xl" maxHeight="85%" w="$full" style={{ marginBottom: insets.bottom + 12 }}>
        <ModalHeader borderBottomWidth={1} borderBottomColor="$borderLight" p="$4">
          <VStack flex={1} mr="$2">
            <Heading size="lg" fontWeight="$black" numberOfLines={2}>{supplier.name}</Heading>
            <GlueText size="xs" color="$text500">Supplier Directory Profile</GlueText>
          </VStack>
          <ModalCloseButton>
            <Icon as={CloseIcon} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody p="$0">
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 18 }}>
            <VStack space="lg">
              {/* Contact Info Card */}
              <Box bg="$backgroundLight50" p="$4" rounded="$2xl" borderWidth={1} borderColor="$borderLight">
                <VStack space="md">
                  {supplier.contactPerson && (
                    <HStack space="md" alignItems="center">
                      <Icon as={User} size="sm" color="$primary600" />
                      <GlueText size="sm" fontWeight="$bold" flex={1}>{supplier.contactPerson}</GlueText>
                    </HStack>
                  )}
                  {(supplier.phone || supplier.contactInfo) && (
                    <HStack space="md" alignItems="center">
                      <Icon as={Phone} size="sm" color="$primary600" />
                      <GlueText size="sm" flex={1}>{supplier.phone || supplier.contactInfo}</GlueText>
                    </HStack>
                  )}
                  {supplier.email && (
                    <HStack space="md" alignItems="center">
                      <Icon as={Mail} size="sm" color="$primary600" />
                      <GlueText size="sm" flex={1}>{supplier.email}</GlueText>
                    </HStack>
                  )}
                  {supplier.address && (
                    <HStack space="md" alignItems="flex-start">
                      <Icon as={MapPin} size="sm" color="$primary600" style={{ marginTop: 2 }} />
                      <GlueText size="sm" flex={1}>{supplier.address}</GlueText>
                    </HStack>
                  )}
                </VStack>
              </Box>

              {/* Financial Summary */}
              <HStack space="md">
                <Box flex={1} bg={currentBalance > 0 ? "$error50" : "$success50"} p="$3.5" rounded="$2xl" borderWidth={1} borderColor={currentBalance > 0 ? "$error200" : "$success200"}>
                  <HStack space="xs" alignItems="center" mb="$1">
                    <Icon as={Wallet} size="xs" color={currentBalance > 0 ? "$error600" : "$success600"} />
                    <GlueText size="xs" color={currentBalance > 0 ? "$error600" : "$success600"} fontWeight="$bold">BALANCE</GlueText>
                  </HStack>
                  <Heading size="md" color={currentBalance > 0 ? "$error700" : "$success700"} numberOfLines={1}>
                    {currency}{formattedBalance}
                  </Heading>
                </Box>
                <Box flex={1} bg="$primary50" p="$3.5" rounded="$2xl" borderWidth={1} borderColor="$primary200">
                  <HStack space="xs" alignItems="center" mb="$1">
                    <Icon as={Package} size="xs" color="$primary600" />
                    <GlueText size="xs" color="$primary600" fontWeight="$bold">PRODUCTS</GlueText>
                  </HStack>
                  <Heading size="md" color="$primary700">{products.length}</Heading>
                </Box>
              </HStack>

              <Divider my="$1" />

              <HStack justifyContent="space-between" alignItems="center">
                <Heading size="sm" fontWeight="$bold">Linked Products ({products.length})</Heading>
                {onOrderProducts && (
                  <Button size="xs" action="primary" variant="solid" bg="$primary600" borderRadius={10} onPress={() => { onClose(); onOrderProducts(supplier); }}>
                    <ButtonText size="2xs" fontWeight="$bold">+ New Purchase</ButtonText>
                  </Button>
                )}
              </HStack>

              {loading ? (
                <Center py="$8">
                  <Spinner color="$primary600" />
                </Center>
              ) : products.length === 0 ? (
                <Center py="$8">
                  <GlueText color="$text400" size="sm">No products linked to this supplier yet.</GlueText>
                </Center>
              ) : (
                <VStack space="sm">
                  {products.map((item) => (
                    <HStack
                      key={item.id}
                      bg="$white"
                      p="$3"
                      rounded="$xl"
                      justifyContent="space-between"
                      alignItems="center"
                      borderWidth={1}
                      borderColor="$borderLight"
                    >
                      <VStack flex={1} mr="$2">
                        <GlueText fontWeight="$bold" color="$text900">{item.name}</GlueText>
                        <HStack space="xs" alignItems="center">
                          {item.barcode && <GlueText size="2xs" color="$text500">Barcode: {item.barcode}</GlueText>}
                          {item.status === 'DRAFT' && (
                            <Box bg="$warning100" px="$1.5" py="$0.5" rounded="$md">
                              <GlueText size="2xs" color="$warning800" fontWeight="$bold">DRAFT</GlueText>
                            </Box>
                          )}
                        </HStack>
                      </VStack>
                      <VStack alignItems="flex-end" flexShrink={0}>
                        <GlueText
                          size="sm"
                          fontWeight="$bold"
                          color={
                            (Number(item.stockQuantity || 0) + (Number(item.bulkStockQuantity || 0) * (Number(item.bulkQuantity) > 0 ? Number(item.bulkQuantity) : 1))) <= Number(item.minStockLevel || 0)
                              ? "$error600"
                              : "$success600"
                          }
                        >
                          {item.stockQuantity} {item.unit}
                        </GlueText>
                        <GlueText size="2xs" color="$text400">In Stock</GlueText>
                      </VStack>
                    </HStack>
                  ))}
                </VStack>
              )}
            </VStack>
          </ScrollView>
        </ModalBody>
        <ModalFooter borderTopWidth={1} borderTopColor="$borderLight" p="$3">
          <HStack space="md" w="100%">
            <Button action="secondary" variant="outline" onPress={onClose} borderRadius={16} flex={1}>
              <ButtonText>Close Profile</ButtonText>
            </Button>
            {onOrderProducts && (
              <Button action="primary" onPress={() => { onClose(); onOrderProducts(supplier); }} borderRadius={16} bg="$primary600" flex={1}>
                <ButtonText fontWeight="$bold">New Purchase</ButtonText>
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SupplierDetailModal;
