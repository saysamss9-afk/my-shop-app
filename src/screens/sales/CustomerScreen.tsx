import React, { useState, useCallback, useMemo } from 'react';
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
  Fab,
  FabIcon,
  FabLabel,
  AddIcon,
  ArrowLeftIcon,
  SearchIcon,
  Input,
  InputField,
  InputIcon,
  InputSlot,
  useToast,
  Toast,
  ToastTitle,
  ToastDescription,
} from '@gluestack-ui/themed';
import { User, RefreshCw, AlertTriangle, XCircle } from 'lucide-react-native';
import { useCustomers } from '../../hooks/useCustomers';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import CustomerListItem from './components/CustomerListItem';
import AddCustomerModal from './components/AddCustomerModal';
import PaymentModal from './components/PaymentModal';
import ReturnModal from './components/ReturnModal';
import CustomerDetailModal from './components/CustomerDetailModal';
import { getAppShadow } from '../../utils/platformStyles';
import type { Customer } from '../../db/types';
import { SyncStatus } from '../../sync/SyncManager';

const CustomerScreen = ({ route, navigation }: any) => {
  const { shopId } = route.params;
  const {
    customers, isLoading, syncStatus, currency,
    addCustomer, recordPayment, returnProduct, triggerManualSync, error,
    getCustomerHistory, getItemsTakenOnCredit
  } = useCustomers(shopId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toast = useToast();

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const lowerQuery = searchQuery.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(lowerQuery) ||
      (c.phone && c.phone.includes(lowerQuery))
    );
  }, [customers, searchQuery]);

  const handlePay = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setIsPaymentModalOpen(true);
  }, []);

  const handleReturn = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setIsReturnModalOpen(true);
  }, []);

  const handleProfilePress = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  }, []);

  const onAddCustomer = async (name: string, phone: string) => {
    try {
      await addCustomer(name, phone);
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast nativeId={id} action="success" variant="solid">
            <VStack space="xs">
              <ToastTitle>Customer Added</ToastTitle>
              <ToastDescription>{name} has been added successfully.</ToastDescription>
            </VStack>
          </Toast>
        ),
      });
    } catch (e: any) {
      Alert.alert("Error", "Failed to add customer: " + e.message);
    }
  };

  const onRecordPayment = async (customerId: string, amount: number, method: string, note?: string) => {
    try {
      await recordPayment(customerId, amount, method, note);
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast nativeId={id} action="success" variant="solid">
            <VStack space="xs">
              <ToastTitle>Payment Recorded</ToastTitle>
              <ToastDescription>Payment of {currency}{amount.toFixed(2)} received.</ToastDescription>
            </VStack>
          </Toast>
        ),
      });
    } catch (e: any) {
      Alert.alert("Error", "Failed to record payment: " + e.message);
    }
  };

  const handleReturnProduct = async (customerId: string, productId: string, qty: number, isBulk: boolean, price: number) => {
    try {
      await returnProduct(customerId, productId, qty, isBulk, price);
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast nativeId={id} action="success" variant="solid">
            <VStack space="xs">
              <ToastTitle>Item Returned</ToastTitle>
              <ToastDescription>Stock restored and debt reduced by {currency}{(price * qty).toFixed(2)}.</ToastDescription>
            </VStack>
          </Toast>
        ),
      });
    } catch (e: any) {
      Alert.alert("Error", "Failed to process return: " + e.message);
    }
  };

  const renderItem = useCallback(({ item }: any) => (
    <CustomerListItem
        item={item}
        currency={currency}
        onPay={handlePay}
        onReturn={handleReturn}
        onPress={() => handleProfilePress(item)}
    />
  ), [currency, handlePay, handleReturn, handleProfilePress]);

  return (
    <ScreenWrapper withHeader>
      <StatusBar barStyle="dark-content" backgroundColor="#F3ECFF" />

      {/* Header */}
      <Box px="$4" pt="$2" pb="$2">
        <HStack justifyContent="space-between" alignItems="center" mb="$4">
          <HStack space="md" alignItems="center">
            <Pressable onPress={() => navigation.goBack()} p="$2" bg="$white" rounded="$full">
              <Icon as={ArrowLeftIcon} color="$text900" />
            </Pressable>
            <VStack>
              <Heading size="lg" color="$text900" fontWeight="$black">Customers</Heading>
              <Text size="xs" color="$text500">Manage debt and relationships</Text>
            </VStack>
          </HStack>

          <HStack space="sm" alignItems="center">
            {syncStatus === SyncStatus.Syncing ? (
                <HStack space="xs" alignItems="center" bg="$primary50" px="$3" py="$1.5" rounded="$full">
                    <Spinner color="$primary600" size="small" />
                    <Text size="xs" color="$primary600" fontWeight="$bold">Syncing...</Text>
                </HStack>
            ) : (
                <Pressable
                    onPress={triggerManualSync}
                    bg={syncStatus === SyncStatus.Error ? "$error50" : "$primary600"}
                    px="$4"
                    py="$2"
                    rounded="$full"
                    style={{ ...getAppShadow({ offsetY: 4, radius: 8, color: 'rgba(110,59,230,0.15)' }) }}
                >
                    <HStack space="xs" alignItems="center">
                        <Icon
                            as={syncStatus === SyncStatus.Error ? AlertTriangle : RefreshCw}
                            color="$white"
                            size="xs"
                        />
                        <Text size="xs" color="$white" fontWeight="$bold">
                            {syncStatus === SyncStatus.Error ? 'Retry' : 'Sync Now'}
                        </Text>
                    </HStack>
                </Pressable>
            )}
          </HStack>
        </HStack>

        {/* Search Bar */}
        <Input borderRadius={16} bg="$white" style={{ ...getAppShadow({ offsetY: 2, radius: 10, color: 'rgba(0,0,0,0.02)' }) }}>
          <InputSlot pl="$3">
            <InputIcon as={SearchIcon} color="$text400" />
          </InputSlot>
          <InputField
            placeholder="Search name or phone..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <InputSlot pr="$3" onPress={() => setSearchQuery('')}>
              <Icon as={XCircle} color="$text300" size="sm" />
            </InputSlot>
          ) : null}
        </Input>
      </Box>

      {error ? (
        <Center p="$10">
          <VStack space="md" alignItems="center">
            <Icon as={AlertTriangle} size="xl" color="$error600" />
            <Text textAlign="center" color="$text600">{error}</Text>
            <Button size="sm" action="secondary" variant="outline" onPress={triggerManualSync}>
              <ButtonText>Try Reloading</ButtonText>
            </Button>
          </VStack>
        </Center>
      ) : isLoading ? (
        <Center flex={1}>
          <Spinner size="large" color="$primary600" />
        </Center>
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          ListEmptyComponent={
            <Center mt="$20">
              <VStack space="md" alignItems="center">
                <Center w={100} h={100} bg="$backgroundLight100" rounded="$full">
                    <Icon as={User} size="xl" color="$text300" />
                </Center>
                <Text color="$text400">
                  {searchQuery ? 'No matching customers found.' : 'No customers added yet.'}
                </Text>
              </VStack>
            </Center>
          }
        />
      )}

      <Fab
        size="lg"
        placement="bottom right"
        onPress={() => setIsModalOpen(true)}
        bg="$primary600"
        m="$6"
        style={{ ...getAppShadow({ offsetY: 10, radius: 26, color: 'rgba(110,59,230,0.28)' }) }}
      >
        <FabIcon as={AddIcon} mr="$2" />
        <FabLabel fontWeight="$black">New Customer</FabLabel>
      </Fab>

      <AddCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onAddCustomer}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedCustomer(null);
        }}
        onSave={onRecordPayment}
        customer={selectedCustomer}
        currency={currency}
      />

      <ReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => {
            setIsReturnModalOpen(false);
            setSelectedCustomer(null);
        }}
        onSave={handleReturnProduct}
        customer={selectedCustomer}
        currency={currency}
        fetchItemsTaken={getItemsTakenOnCredit}
      />

      <CustomerDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        currency={currency}
        fetchHistory={getCustomerHistory}
      />
    </ScreenWrapper>
  );
};

export default CustomerScreen;

