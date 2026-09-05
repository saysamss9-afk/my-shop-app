import React, { useState, useCallback } from 'react';
import { FlatList, StatusBar, Alert } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Icon,
  Pressable,
  Center,
  Spinner,
  ArrowLeftIcon,
  Badge,
  BadgeText,
} from '@gluestack-ui/themed';
import { ShoppingBag, Calendar, Hash, CreditCard } from 'lucide-react-native';
import { usePurchase } from '../../hooks/usePurchase';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import { getAppShadow } from '../../utils/platformStyles';
import PurchaseDetailModal from './components/PurchaseDetailModal';

const PurchaseHistoryScreen = ({ route, navigation }: any) => {
  const { shopId } = route.params;
  const { purchases, isLoading, refresh, getPurchaseItems, returnPurchaseItem } = usePurchase(shopId);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleShowDetails = async (purchase: any) => {
    const items = await getPurchaseItems(purchase.id);
    setSelectedPurchase({ ...purchase, items });
    setIsModalOpen(true);
  };

  const handleReturnItem = async (item: any, quantity: number, reason: string) => {
      const value = item.costPrice * quantity;
      const success = await returnPurchaseItem(
          selectedPurchase.id,
          selectedPurchase.supplierId,
          item.productId,
          quantity,
          value,
          reason,
          item.isBulk === 1
      );

      if (success) {
          Alert.alert("Success", "Purchase return recorded. Stock and debt updated.");
          setIsModalOpen(false); // Close details and refresh
      } else {
          Alert.alert("Error", "Failed to process return.");
      }
  };

  const renderItem = useCallback(({ item }: any) => {
    const date = new Date(item.timestamp).toLocaleDateString();
    const isDebt = item.paymentStatus !== 'PAID';

    return (
      <Pressable onPress={() => handleShowDetails(item)}>
        <Box
          bg="$white"
          p="$5"
          rounded="$3xl"
          mb="$4"
          borderWidth={1}
          borderColor="$borderLight"
          style={{ ...getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(0,0,0,0.03)' }) }}
        >
          <HStack justifyContent="space-between" alignItems="flex-start">
            <VStack space="xs" flex={1}>
              <HStack space="xs" alignItems="center">
                <Heading size="sm" color="$text900" fontWeight="$bold">
                  {item.supplierName}
                </Heading>
                <Badge size="sm" action={isDebt ? 'error' : 'success'} variant="solid" rounded="$full">
                  <BadgeText size="xxs">{item.paymentStatus}</BadgeText>
                </Badge>
              </HStack>

              <HStack space="md">
                <HStack space="xs" alignItems="center">
                  <Icon as={Calendar} size="xs" color="$text400" />
                  <Text size="xs" color="$text500">{date}</Text>
                </HStack>
                <HStack space="xs" alignItems="center">
                  <Icon as={Hash} size="xs" color="$text400" />
                  <Text size="xs" color="$text500">{item.invoiceNumber || 'No Invoice'}</Text>
                </HStack>
              </HStack>
            </VStack>

            <VStack alignItems="flex-end" space="xs">
              <Text size="xs" color="$text400" fontWeight="$bold">Total Value</Text>
              <Heading size="md" color="$primary600" fontWeight="$black">
                ₵{item.totalCost.toFixed(2)}
              </Heading>
              {isDebt && (
                <Text size="xxs" color="$error600" fontWeight="$bold">
                  Bal: ₵{item.balance.toFixed(2)}
                </Text>
              )}
            </VStack>
          </HStack>
        </Box>
      </Pressable>
    );
  }, []);

  return (
    <ScreenWrapper withHeader>
      <StatusBar barStyle="dark-content" backgroundColor="#F3ECFF" />

      <Box px="$4" pt="$2" pb="$4">
        <HStack space="md" alignItems="center">
          <Pressable onPress={() => navigation.goBack()} p="$2" bg="$white" rounded="$full">
            <Icon as={ArrowLeftIcon} color="$text900" />
          </Pressable>
          <VStack>
            <Heading size="lg" color="$text900" fontWeight="$black">Purchase History</Heading>
            <Text size="xs" color="$text500">View past inventory restocks</Text>
          </VStack>
        </HStack>
      </Box>

      {isLoading ? (
        <Center flex={1}>
          <Spinner size="large" color="$primary600" />
        </Center>
      ) : (
        <FlatList
          data={purchases}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          onRefresh={refresh}
          refreshing={isLoading}
          ListEmptyComponent={
            <Center mt="$20">
              <VStack space="md" alignItems="center">
                <Center w={100} h={100} bg="$backgroundLight100" rounded="$full">
                    <Icon as={ShoppingBag} size="xl" color="$text300" />
                </Center>
                <Text color="$text400">No purchase history found.</Text>
              </VStack>
            </Center>
          }
        />
      )}

      <PurchaseDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        purchase={selectedPurchase}
        onReturnItem={handleReturnItem}
      />
    </ScreenWrapper>
  );
};

export default PurchaseHistoryScreen;
