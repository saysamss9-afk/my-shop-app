import React, { useCallback, useState, useEffect } from 'react';
import { FlatList, SectionList, StatusBar, Alert } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Pressable,
  Center,
  Spinner,
  Divider,
  ArrowLeftIcon,
  Input,
  InputField,
  InputSlot,
} from '@gluestack-ui/themed';
import { RefreshCw, AlertTriangle, ChevronLeft, ChevronRight, Calendar } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSales } from '../../hooks/useSales';
import type { Sale } from '../../db/types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getAppShadow, isWeb } from '../../utils/platformStyles';
import { displayAlert } from '../../utils/alert';
import { SyncStatus } from '../../sync/SyncManager';
import { PrintingService } from '../../services/PrintingService';

// Sub-components
import SaleHistoryItem from './components/SaleHistoryItem';
import SaleDetailModal from './components/SaleDetailModal';
import ScreenWrapper from '../../components/common/ScreenWrapper';

const SaleHistoryScreen = ({ route, navigation }: any) => {
  const { shopId } = route.params;
  const { sales, isLoading, syncStatus, currency, revertSale, triggerManualSync, getSaleDetails, getShopInfo, refreshSales, refundSaleItem } = useSales(shopId);
  const insets = useSafeAreaInsets();

  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    // Group items fresh for each month by calculating range
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1, 0, 0, 0, 0).getTime();
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    refreshSales(startOfMonth, endOfMonth);
  }, [currentDate, refreshSales]);

  useEffect(() => {
    // Trigger sync once when the screen loads to ensure we have the latest items
    triggerManualSync();
  }, []);

  const handlePrevMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [saleItems, setSaleItems] = useState<any[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>([]);

  const toggleSelectSale = (id: string) => {
    setSelectedSaleIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handlePrintSelected = async () => {
    const selectedSales = filteredSales.filter((s: any) => selectedSaleIds.includes(s.id));
    if (selectedSales.length === 0) {
      displayAlert('Error', 'Please select at least one sale to print.');
      return;
    }

    const salesWithItems = await Promise.all(
      selectedSales.map(async (s: any) => ({
        ...s,
        items: await getSaleDetails(s.id)
      }))
    );

    const shopInfo = await getShopInfo();
    await PrintingService.printSalesSummary(shopInfo, salesWithItems, currency);
  };

  const filteredSales = sales.filter((sale: any) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query ? true : (
      sale.id.toLowerCase().includes(query) ||
      (sale.customerName && sale.customerName.toLowerCase().includes(query)) ||
      new Date(sale.timestamp).toLocaleDateString().toLowerCase().includes(query)
    );

    if (!selectedDateFilter) return matchesSearch;
    const date = new Date(sale.timestamp);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}` === selectedDateFilter && matchesSearch;
  });

  const monthLabel = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const groupedSales = React.useMemo(() => {
    const groups: { [key: string]: any[] } = {};

    filteredSales.forEach(sale => {
      const d = new Date(sale.timestamp);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(sale);
    });

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(dateKey => ({
        title: new Date(dateKey).toLocaleDateString(undefined, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
        data: groups[dateKey]
      }));
  }, [filteredSales]);

  const handlePrint = async (sale: any, items: any[]) => {
    try {
      const shopInfo = await getShopInfo();
      await PrintingService.printReceipt({
        shopName: shopInfo.name,
        address: shopInfo.address || '',
        saleId: sale.id.slice(-8).toUpperCase(),
        timestamp: new Date(sale.timestamp).toLocaleString(),
        items: items.map(i => ({
            name: i.productName || 'Item',
            quantity: i.quantity,
            price: i.priceAtSale,
        })),
        total: sale.totalAmount,
        employeeName: sale.staffName || 'Staff',
        customerName: sale.customerName || undefined,
        paymentMethod: sale.paymentMethod,
        currency: currency,
      });
    } catch (e) {
      console.error('Print error', e);
    }
  };

  const handleSelectSale = async (sale: any) => {
    setSelectedSale(sale);
    const items = await getSaleDetails(sale.id);
    setSaleItems(items);
    setShowDetailModal(true);
  };

  const handleRefundItem = async (saleItemId: string, qty: number) => {
    const success = await refundSaleItem(saleItemId, qty);
    if (success) {
      displayAlert("Success", "Returned item has been successfully reversed back to product stock.");
      if (selectedSale) {
        const updatedItems = await getSaleDetails(selectedSale.id);
        setSaleItems(updatedItems);
        if (updatedItems.length === 0) {
          setShowDetailModal(false);
        }
      }
    } else {
      displayAlert("Error", "Failed to reverse item stock.");
    }
  };

  const renderItem = useCallback(({ item }: { item: any }) => (
    <SaleHistoryItem
        item={item}
        currency={currency}
        onRevert={revertSale}
        onPress={handleSelectSale}
        isSelected={selectedSaleIds.includes(item.id)}
        onToggleSelect={() => toggleSelectSale(item.id)}
    />
  ), [currency, revertSale, getSaleDetails, selectedSaleIds]);

  return (
    <ScreenWrapper withHeader>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Modern Header */}
      <Box pt={Math.max(insets.top, 10)} pb="$2" px="$4">
        <HStack justifyContent="space-between" alignItems="center">
          <HStack space="md" alignItems="center">
            <Pressable onPress={() => navigation.goBack()} p="$2" bg="$white" rounded="$full" style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.05)' }) }}>
              <Icon as={ArrowLeftIcon} color="$text900" />
            </Pressable>
            <VStack>
              <Heading size="lg" color="$text900" fontWeight="$black">Sales History</Heading>
              <Text size="xs" color="$text500">Monthly Audit Ledger</Text>
            </VStack>
          </HStack>

          <HStack space="sm" alignItems="center">
            {syncStatus === SyncStatus.Syncing ? (
                <Spinner color="$primary600" size="small" />
            ) : (
                <Pressable
                    onPress={() => triggerManualSync()}
                    p="$2"
                    rounded="$full"
                    bg="$white"
                    style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.05)' }) }}
                >
                    <Icon as={RefreshCw} color="$primary600" size="sm" />
                </Pressable>
            )}
          </HStack>
        </HStack>
      </Box>

      {/* Month Selection Carousel - Ensuring items start fresh for each month */}
      <Box bg="$white" borderBottomWidth={1} borderColor="$borderLight" py="$2" mb="$2">
        <HStack justifyContent="space-between" alignItems="center" px="$4">
          <Pressable p="$2" onPress={handlePrevMonth}>
            <Icon as={ChevronLeft} color="$primary700" size="sm" />
          </Pressable>
          <HStack space="xs" alignItems="center">
            <Icon as={Calendar} size="xs" color="$primary600" />
            <Heading size="sm" color="$text900" fontWeight="$bold">{monthLabel}</Heading>
          </HStack>
          <Pressable p="$2" onPress={handleNextMonth}>
            <Icon as={ChevronRight} color="$primary700" size="sm" />
          </Pressable>
        </HStack>
      </Box>

      {/* Date & Keyword Filter Selection Row */}
      <Box px="$4" pb="$3">
        <VStack space="sm">
          <Input variant="outline" size="sm" borderRadius={12} bg="$white">
            <InputSlot pl="$3">
              <MaterialCommunityIcons name="magnify" size={16} color="#666" />
            </InputSlot>
            <InputField
              placeholder="Search by sale code, customer name or date..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="$text400"
            />
            {searchQuery.length > 0 && (
              <InputSlot pr="$3" onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={16} color="#999" />
              </InputSlot>
            )}
          </Input>

          <HStack space="sm" alignItems="center">
            <Box flex={1}>
              <Input variant="outline" size="sm" borderRadius={12} bg="$white">
                <InputField
                  placeholder="Day filter (YYYY-MM-DD)"
                  value={selectedDateFilter}
                  onChangeText={setSelectedDateFilter}
                  placeholderTextColor="$text400"
                />
                {selectedDateFilter.length > 0 && (
                  <InputSlot pr="$3" onPress={() => setSelectedDateFilter('')}>
                    <MaterialCommunityIcons name="close-circle" size={16} color="#999" />
                  </InputSlot>
                )}
              </Input>
            </Box>
            <Pressable onPress={() => {
                const d = new Date();
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                setSelectedDateFilter(key);
            }} bg="$primary50" px="$3" py="$2" rounded="$lg">
              <Text size="xs" color="$primary700" fontWeight="$bold">Today</Text>
            </Pressable>
          </HStack>
        </VStack>
      </Box>

      {/* Stats Summary Bar for the Month */}
      <Box bg="$white" px="$5" py="$4" borderBottomWidth={1} borderColor="$borderLight">
        <HStack space="md" alignItems="center">
            <VStack flex={1} alignItems="center" space="xs">
                <Text size="xs" color="$text500" fontWeight="$bold" textTransform="uppercase">Month Trans.</Text>
                <Heading size="md" color="$text900">{filteredSales.length}</Heading>
            </VStack>
            <Divider orientation="vertical" h="$10" />
            <VStack flex={1} alignItems="center" space="xs">
                <Text size="xs" color="$text500" fontWeight="$bold" textTransform="uppercase">Month Total</Text>
                <Heading size="md" color="$primary800">
                    {currency}{filteredSales.reduce((acc, curr) => acc + (curr.isReverted === 1 ? 0 : curr.totalAmount), 0).toFixed(2)}
                </Heading>
            </VStack>
        </HStack>
      </Box>

      {/* Batch Actions Row */}
      <Box px="$4" py="$3">
        <Pressable
          onPress={handlePrintSelected}
          bg={selectedSaleIds.length > 0 ? "$primary600" : "$white"}
          borderWidth={1}
          borderColor="$primary600"
          p="$3"
          rounded="$xl"
          style={{ ...getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(110,59,230,0.1)' }) }}
        >
          <HStack space="sm" alignItems="center" justifyContent="center">
            <MaterialCommunityIcons
              name="printer-check"
              size={18}
              color={selectedSaleIds.length > 0 ? "#fff" : "#E65100"}
            />
            <Text color={selectedSaleIds.length > 0 ? "$white" : "$primary600"} fontWeight="$bold" size="sm">
              {selectedSaleIds.length > 0 ? `Print (${selectedSaleIds.length}) Transactions` : 'Print Month Summary'}
            </Text>
          </HStack>
        </Pressable>
      </Box>

      {isLoading ? (
        <Center flex={1}>
          <Spinner size="large" color="$primary800" />
        </Center>
      ) : (
        <SectionList
          sections={groupedSales}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          renderSectionHeader={({ section: { title } }) => (
            <Box bg="$backgroundLight50" px="$5" py="$3" mb="$2">
              <HStack alignItems="center" space="sm">
                <MaterialCommunityIcons name="calendar-range" size={14} color="#666" />
                <Text size="xs" color="$text600" fontWeight="$bold" textTransform="uppercase">
                  {title}
                </Text>
              </HStack>
            </Box>
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          stickySectionHeadersEnabled={true}
          ListEmptyComponent={
            <Center mt="$20">
              <VStack space="md" alignItems="center">
                <MaterialCommunityIcons name="history" size={64} color="#ccc" />
                <Text color="$text400">No sales for {monthLabel}.</Text>
              </VStack>
            </Center>
          }
        />
      )}

      <SaleDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        sale={selectedSale}
        items={saleItems}
        currency={currency}
        onPrint={handlePrint}
        onRefundItem={handleRefundItem}
      />
    </ScreenWrapper>
  );
};

export default SaleHistoryScreen;
