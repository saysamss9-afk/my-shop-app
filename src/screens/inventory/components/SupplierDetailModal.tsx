import React, { useState, useEffect } from 'react';
import { ScrollView, FlatList } from 'react-native';
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
import { getButtonHeight } from '../../../utils/platformStyles';
import type { Supplier, Product } from '../../../db/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  supplier: (Supplier & { productCount: number }) | null;
  currency: string;
  fetchProducts: (id: string) => Promise<Product[]>;
}

const SupplierDetailModal: React.FC<Props> = ({
  isOpen,
  onClose,
  supplier,
  currency,
  fetchProducts,
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalBackdrop />
      <ModalContent rounded="$3xl" maxHeight="85%" w="$full" style={{ marginBottom: insets.bottom + 12 }}>
        <ModalHeader borderBottomWidth={1} borderBottomColor="$borderLight">
          <VStack flex={1} mr="$2">
            <Heading size="lg" fontWeight="$black" numberOfLines={2}>{supplier.name}</Heading>
            <GlueText size="xs" color="$text500">Supplier Profile & Linked Products</GlueText>
          </VStack>
          <ModalCloseButton>
            <Icon as={CloseIcon} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody p="$0">
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
            <VStack space="lg">
              {/* Contact Info Card */}
              <Box bg="$backgroundLight50" p="$4" rounded="$2xl">
                <VStack space="md">
                  <HStack space="md" alignItems="center">
                    <Icon as={User} size="sm" color="$primary600" />
                    <GlueText size="sm" fontWeight="$bold" flex={1}>{supplier.contactPerson || 'No contact person specified'}</GlueText>
                  </HStack>
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
                 <Box flex={1} bg="$error50" p="$3" rounded="$xl">
                    <HStack space="xs" alignItems="center" mb="$1">
                      <Icon as={Wallet} size="xs" color="$error600" />
                      <GlueText size="xs" color="$error600" fontWeight="$bold">BALANCE</GlueText>
                    </HStack>
                    <Heading size="md" color="$error700" numberOfLines={1}>{currency}{(supplier.currentBalance ?? 0).toFixed(2)}</Heading>
                 </Box>
                 <Box flex={1} bg="$primary50" p="$3" rounded="$xl">
                    <HStack space="xs" alignItems="center" mb="$1">
                      <Icon as={Package} size="xs" color="$primary600" />
                      <GlueText size="xs" color="$primary600" fontWeight="$bold">PRODUCTS</GlueText>
                    </HStack>
                    <Heading size="md" color="$primary700">{products.length}</Heading>
                 </Box>
              </HStack>

              <Divider my="$2" />

              <Heading size="sm" fontWeight="$bold">Associated Products ({products.length})</Heading>

              {loading ? (
                <Center py="$8">
                  <Spinner color="$primary600" />
                </Center>
              ) : products.length === 0 ? (
                <Center py="$8">
                  <GlueText color="$text400">No products linked to this supplier yet.</GlueText>
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
                        {item.barcode && <GlueText size="xs" color="$text500">Barcode: {item.barcode}</GlueText>}
                      </VStack>
                      <VStack alignItems="flex-end" flexShrink={0}>
                        <GlueText size="sm" fontWeight="$bold" color={item.stockQuantity <= item.minStockLevel ? "$error600" : "$success600"}>
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
        <ModalFooter borderTopWidth={1} borderTopColor="$borderLight" pt="$3">
          <Button action="secondary" variant="outline" onPress={onClose} borderRadius={16} w="100%">
            <ButtonText>Close Profile</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SupplierDetailModal;
