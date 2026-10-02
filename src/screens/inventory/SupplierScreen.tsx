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
  SearchIcon,
  Input,
  InputField,
  InputSlot,
} from '@gluestack-ui/themed';
import { Store, RefreshCw, AlertTriangle, XCircle, TrendingUp, Wallet, ShoppingCart, History, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSuppliers } from '../../hooks/useSuppliers';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import ModernLoader from '../../components/common/ModernLoader';
import SupplierListItem from './components/SupplierListItem';
import AddSupplierModal from './components/AddSupplierModal';
import SupplierPaymentModal from './components/SupplierPaymentModal';
import SupplierDetailModal from './components/SupplierDetailModal';
import { getAppShadow } from '../../utils/platformStyles';
import { SyncStatus } from '../../sync/SyncManager';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';

const SupplierScreen = ({ route, navigation }: any) => {
  const { shopId } = route.params;
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const flexDir = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' : 'left';

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
  const [filterMode, setFilterMode] = useState<'ALL' | 'OWED' | 'CLEAR'>('ALL');
  const insets = useSafeAreaInsets();

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const matchesSearch = !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.contactInfo && s.contactInfo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.phone && s.phone.toLowerCase().includes(searchQuery.toLowerCase()));

      const balance = Number(s.currentBalance ?? 0);
      if (filterMode === 'OWED') return matchesSearch && balance > 0;
      if (filterMode === 'CLEAR') return matchesSearch && balance <= 0;
      return matchesSearch;
    });
  }, [suppliers, searchQuery, filterMode]);

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
      p="$3.5"
      rounded="$2xl"
      mr={isRTL ? "$0" : "$3"}
      ml={isRTL ? "$3" : "$0"}
      w={165}
      borderWidth={1}
      borderColor="$borderLight"
      style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.03)' }) }}
    >
      <VStack space="xs">
        <HStack justifyContent="space-between" alignItems="center" flexDirection={flexDir}>
          <Center w={30} h={30} bg={`${color}12`} rounded="$lg">
            <Icon as={icon} color={color} size="xs" />
          </Center>
          <GlueText size="2xs" color="$text400" fontWeight="$bold">{title}</GlueText>
        </HStack>
        <VStack alignItems={isRTL ? "flex-start" : "flex-end"} mt="$1">
          <Heading size="sm" color="$text900" fontWeight="$black" numberOfLines={1} textAlign={textAlign}>
            {value}
          </Heading>
          <GlueText size="2xs" color="$text500" numberOfLines={1} textAlign={textAlign}>
            {subValue}
          </GlueText>
        </VStack>
      </VStack>
    </Box>
  );

  const renderHeader = useCallback(() => (
    <VStack space="md" pb="$4">
      {/* Top Title & Sync Bar */}
      <Box pt={Math.max(insets.top, 10)}>
        <HStack justifyContent="space-between" alignItems="center" flexDirection={flexDir}>
          <HStack space="md" alignItems="center" flexDirection={flexDir}>
            <Pressable
              onPress={() => navigation.goBack()}
              p="$3"
              minWidth={44}
              minHeight={44}
              justifyContent="center"
              alignItems="center"
              bg="$white"
              rounded="$full"
              accessibilityLabel="Go back"
              accessibilityRole="button"
              style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.05)' }) }}
            >
              <ArrowLeft size={22} color="#111827" style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }} />
            </Pressable>
            <VStack>
              <Heading size="lg" color="$text900" fontWeight="$black" textAlign={textAlign}>Suppliers</Heading>
              <GlueText size="xs" color="$text500" textAlign={textAlign}>Product Sourcing Directory</GlueText>
            </VStack>
          </HStack>

          <HStack space="sm" alignItems="center" flexDirection={flexDir}>
            <Pressable
              onPress={() => navigation.navigate('PurchaseHistory', { shopId })}
              p="$3"
              minWidth={44}
              minHeight={44}
              justifyContent="center"
              alignItems="center"
              bg="$white"
              rounded="$full"
              accessibilityLabel="Purchase History"
              accessibilityRole="button"
              style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.05)' }) }}
            >
              <History size={22} color="#4B5563" />
            </Pressable>

            {syncStatus === SyncStatus.Syncing ? (
              <HStack space="xs" alignItems="center" bg="$primary50" px="$3" py="$1.5" rounded="$full" flexDirection={flexDir}>
                <Spinner color="$primary600" size="small" />
                <GlueText size="xs" color="$primary600" fontWeight="$bold">Syncing...</GlueText>
              </HStack>
            ) : (
              <Pressable
                onPress={triggerManualSync}
                bg={syncStatus === SyncStatus.Error ? "$error50" : "$primary600"}
                px="$3.5"
                py="$2"
                minHeight={38}
                justifyContent="center"
                rounded="$full"
                accessibilityLabel="Sync suppliers"
                accessibilityRole="button"
                style={{ ...getAppShadow({ offsetY: 4, radius: 8, color: 'rgba(110,59,230,0.15)' }) }}
              >
                <HStack space="xs" alignItems="center" flexDirection={flexDir}>
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
      </Box>

      {/* Dashboard Metrics Carousel */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
        <HStack flexDirection={flexDir}>
          <SummaryCard
            title="TOTAL PAYABLE"
            value={`${currency}${stats.totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subValue={`${stats.owedSuppliers} Owed`}
            icon={Wallet}
            color="#EF4444"
          />
          <SummaryCard
            title="PAID THIS MONTH"
            value={`${currency}${stats.paidThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subValue="Settled Vendor Debt"
            icon={TrendingUp}
            color="#10B981"
          />
          <SummaryCard
            title="PURCHASES"
            value={`${currency}${stats.purchasesThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subValue="New Inventory Stock"
            icon={ShoppingCart}
            color="#6366F1"
          />
          <SummaryCard
            title="NETWORK"
            value={stats.totalSuppliers}
            subValue="Active Vendors"
            icon={Store}
            color="#F59E0B"
          />
        </HStack>
      </ScrollView>

      {/* Search Bar & Quick Filter Pills */}
      <VStack space="xs">
        <Input borderRadius={16} bg="$white" style={{ flexDirection: flexDir, ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.02)' }) }}>
          <InputSlot pl="$3">
            <Icon as={SearchIcon} color="$text400" />
          </InputSlot>
          <InputField
            placeholder="Search suppliers by name or phone..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign={textAlign}
          />
          {searchQuery ? (
            <InputSlot pr="$3" onPress={() => setSearchQuery('')}>
              <Icon as={XCircle} color="$text300" size="sm" />
            </InputSlot>
          ) : null}
        </Input>

        {/* Filter Pills Row */}
        <HStack space="xs" mt="$2" flexDirection={flexDir}>
          <Pressable
            onPress={() => setFilterMode('ALL')}
            bg={filterMode === 'ALL' ? "$primary600" : "$backgroundLight100"}
            px="$3"
            py="$1.5"
            rounded="$full"
            accessibilityLabel="All suppliers"
            accessibilityRole="button"
          >
            <GlueText size="2xs" color={filterMode === 'ALL' ? "white" : "$text700"} fontWeight="$bold">
              All ({suppliers.length})
            </GlueText>
          </Pressable>

          <Pressable
            onPress={() => setFilterMode('OWED')}
            bg={filterMode === 'OWED' ? "$error600" : "$backgroundLight100"}
            px="$3"
            py="$1.5"
            rounded="$full"
            accessibilityLabel="Owed suppliers"
            accessibilityRole="button"
          >
            <GlueText size="2xs" color={filterMode === 'OWED' ? "white" : "$text700"} fontWeight="$bold">
              Owed Debt ({suppliers.filter(s => Number(s.currentBalance || 0) > 0).length})
            </GlueText>
          </Pressable>

          <Pressable
            onPress={() => setFilterMode('CLEAR')}
            bg={filterMode === 'CLEAR' ? "$success600" : "$backgroundLight100"}
            px="$3"
            py="$1.5"
            rounded="$full"
            accessibilityLabel="Clear suppliers"
            accessibilityRole="button"
          >
            <GlueText size="2xs" color={filterMode === 'CLEAR' ? "white" : "$text700"} fontWeight="$bold">
              Clear/Paid ({suppliers.filter(s => Number(s.currentBalance || 0) <= 0).length})
            </GlueText>
          </Pressable>
        </HStack>
      </VStack>
    </VStack>
  ), [insets.top, flexDir, isRTL, navigation, shopId, syncStatus, triggerManualSync, stats, currency, searchQuery, filterMode, suppliers]);

  return (
    <ScreenWrapper withHeader>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {isLoading ? (
        <ModernLoader label="Loading Suppliers..." subLabel="Fetching supplier directory" icon="store" />
      ) : (
        <FlatList
          data={filteredSuppliers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
          ListEmptyComponent={
            <Center mt="$16">
              <VStack space="md" alignItems="center">
                <Center w={90} h={90} bg="$backgroundLight100" rounded="$full">
                  <Icon as={Store} size="xl" color="$text300" />
                </Center>
                <GlueText color="$text400" size="sm">
                  {searchQuery ? 'No matching suppliers found.' : 'No suppliers added yet.'}
                </GlueText>
              </VStack>
            </Center>
          }
        />
      )}

      {/* Floating Action Button */}
      <Fab
        size="lg"
        placement="bottom right"
        onPress={() => setIsModalOpen(true)}
        bg="$primary600"
        m="$6"
        accessibilityLabel="Add New Supplier"
        accessibilityRole="button"
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
        onOrderProducts={handlePurchase}
      />
    </ScreenWrapper>
  );
};

export default SupplierScreen;
