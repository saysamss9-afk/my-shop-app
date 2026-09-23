import React, { useState, useCallback, useMemo } from 'react';
import { FlatList, StatusBar, ScrollView } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text as GlueText,
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
  InputSlot,
} from '@gluestack-ui/themed';
import { Store, RefreshCw, AlertTriangle, XCircle, TrendingUp, Wallet, ShoppingCart, History, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSuppliers } from '../../hooks/useSuppliers';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import SupplierListItem from './components/SupplierListItem';
import AddSupplierModal from './components/AddSupplierModal';
import SupplierPaymentModal from './components/SupplierPaymentModal';
import SupplierDetailModal from './components/SupplierDetailModal';
import { getAppShadow } from '../../utils/platformStyles';
import { SyncStatus } from '../../sync/SyncManager';

import { useFocusEffect } from '@react-navigation/native';

const SupplierScreen = ({ route, navigation }: any) => {
  const { shopId } = route.params;
  const {
    suppliers, stats, isLoading, syncStatus, currency,
    addSupplier, recordPayment, triggerManualSync, getSupplierProducts, refreshSuppliers
  } = useSuppliers(shopId);

  // Reload supplier data whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshSuppliers();
    }, [refreshSuppliers])
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();

  const filteredSuppliers = useMemo(() => {
    if (!searchQuery) return suppliers;
    const lowerQuery = searchQuery.toLowerCase();
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(lowerQuery) ||
      (s.contactInfo && s.contactInfo.toLowerCase().includes(lowerQuery))
    );
  }, [suppliers, searchQuery]);

  const handlePay = useCallback((supplier: any) => {
    setSelectedSupplier(supplier);
    setIsPaymentModalOpen(true);
  }, []);

  const handlePurchase = useCallback((supplier: any) => {
    navigation.navigate('Purchase', { shopId, initialSupplierId: supplier.id });
  }, [navigation, shopId]);

  const handleProfilePress = useCallback((supplier: any) => {
    setSelectedSupplier(supplier);
    setIsDetailModalOpen(true);
  }, []);

  const renderItem = useCallback(({ item }: any) => (
    <SupplierListItem
        item={item}
        currency={currency}
        onPay={handlePay}
        onPurchase={handlePurchase}
        onPress={() => handleProfilePress(item)}
    />
  ), [currency, handlePay, handlePurchase, handleProfilePress]);

  const SummaryCard = ({ title, value, subValue, icon, color }: any) => (
    <Box
        bg="$white"
        p="$4"
        rounded="$2xl"
        mr="$4"
        w={160}
        style={{ ...getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(0,0,0,0.04)' }) }}
    >
        <VStack space="sm">
            <HStack justifyContent="space-between" alignItems="center">
                <Center w={32} h={32} bg={`${color}10`} rounded="$lg">
                    <Icon as={icon} color={color} size="sm" />
                </Center>
                <GlueText size="2xs" color="$text400" fontWeight="$bold">{title}</GlueText>
            </HStack>
            <VStack>
                <Heading size="md" color="$text900" fontWeight="$black">{value}</Heading>
                <GlueText size="2xs" color="$text500">{subValue}</GlueText>
            </VStack>
        </VStack>
    </Box>
  );

  return (
    <ScreenWrapper withHeader>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <Box px="$4" pt={Math.max(insets.top, 10)} pb="$2">
        <HStack justifyContent="space-between" alignItems="center" mb="$4">
          <HStack space="md" alignItems="center">
            <Pressable onPress={() => navigation.goBack()} p="$2.5" bg="$white" rounded="$full" style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.05)' }) }}>
              <ArrowLeft size={22} color="#111827" />
            </Pressable>
            <VStack>
              <Heading size="lg" color="$text900" fontWeight="$black">Suppliers</Heading>
              <GlueText size="xs" color="$text500">Product Sourcing</GlueText>
            </VStack>
          </HStack>

          <HStack space="sm" alignItems="center">
            <Pressable
                onPress={() => navigation.navigate('PurchaseHistory', { shopId })}
                p="$2.5"
                bg="$white"
                rounded="$full"
                style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.05)' }) }}
            >
                <History size={22} color="#4B5563" />
            </Pressable>

            {syncStatus === SyncStatus.Syncing ? (
                <HStack space="xs" alignItems="center" bg="$primary50" px="$3" py="$1.5" rounded="$full">
                    <Spinner color="$primary600" size="small" />
                    <GlueText size="xs" color="$primary600" fontWeight="$bold">Syncing...</GlueText>
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
                        <GlueText size="xs" color="$white" fontWeight="$bold">
                            {syncStatus === SyncStatus.Error ? 'Retry' : 'Sync'}
                        </GlueText>
                    </HStack>
                </Pressable>
            )}
          </HStack>
        </HStack>

        {/* Dashboard Horizontal Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            <SummaryCard
                title="TOTAL PAYABLE"
                value={`${currency}${stats.totalPayable.toLocaleString()}`}
                subValue={`${stats.owedSuppliers} Suppliers Owed`}
                icon={Wallet}
                color="#EF4444"
            />
            <SummaryCard
                title="PAID THIS MONTH"
                value={`${currency}${stats.paidThisMonth.toLocaleString()}`}
                subValue="Supplier Payments"
                icon={TrendingUp}
                color="#10B981"
            />
            <SummaryCard
                title="PURCHASES"
                value={`${currency}${stats.purchasesThisMonth.toLocaleString()}`}
                subValue="New Product Value"
                icon={ShoppingCart}
                color="#6366F1"
            />
            <SummaryCard
                title="NETWORK"
                value={stats.totalSuppliers}
                subValue="Total Suppliers"
                icon={Store}
                color="#F59E0B"
            />
        </ScrollView>

        {/* Search Bar */}
        <Input borderRadius={16} bg="$white" style={{ ...getAppShadow({ offsetY: 2, radius: 10, color: 'rgba(0,0,0,0.02)' }) }}>
          <InputSlot pl="$3">
            <Icon as={SearchIcon} color="$text400" />
          </InputSlot>
          <InputField
            placeholder="Search suppliers..."
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

      {isLoading ? (
        <Center flex={1}>
          <Spinner size="large" color="$primary600" />
        </Center>
      ) : (
        <FlatList
          data={filteredSuppliers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          ListEmptyComponent={
            <Center mt="$10">
              <VStack space="md" alignItems="center">
                <Center w={100} h={100} bg="$backgroundLight100" rounded="$full">
                    <Icon as={Store} size="xl" color="$text300" />
                </Center>
                <GlueText color="$text400">
                    {searchQuery ? 'No matching suppliers.' : 'No suppliers added yet.'}
                </GlueText>
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
        <FabLabel fontWeight="$black">New Supplier</FabLabel>
      </Fab>

      <AddSupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={addSupplier}
      />

      <SupplierPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedSupplier(null);
        }}
        onSave={recordPayment}
        supplier={selectedSupplier}
        currency={currency}
      />

      <SupplierDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedSupplier(null);
        }}
        supplier={selectedSupplier}
        currency={currency}
        fetchProducts={getSupplierProducts}
      />
    </ScreenWrapper>
  );
};

export default SupplierScreen;
