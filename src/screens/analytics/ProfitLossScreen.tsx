import React, { useState, useEffect } from 'react';
import { ScrollView, StatusBar } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Spinner,
  Divider,
  Button,
  ButtonText,
  Pressable,
  Center,
} from '@gluestack-ui/themed';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Landmark, Scale, Package, Users, Wallet, RefreshCw, AlertCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import { useAnalytics } from '../../hooks/useAnalytics';
import { getAppShadow } from '../../utils/platformStyles';

const ProfitLossScreen = ({ route, navigation }: any) => {
  const { shopId, userRole } = route.params;

  // Enforce access control immediately for Shop Owners only
  if (userRole !== 'OWNER') {
    return (
      <ScreenWrapper>
        <Center flex={1} p="$6">
          <Icon as={Scale} size="xl" color="$error600" mb="$4" />
          <Heading size="md" color="$text900" textAlign="center">Access Restricted</Heading>
          <Text size="sm" color="$text500" textAlign="center" mt="$2">
            The Profit and Loss financial statement is confidential and visible to shop owners only.
          </Text>
        </Center>
      </ScreenWrapper>
    );
  }

  const [currentDate, setCurrentDate] = useState(new Date());
  const { summary, snapshot, currency, isLoading, error, loadAnalytics, refresh } = useAnalytics(shopId);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Calculate the start and end timestamps for the selected calendar month
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1, 0, 0, 0, 0).getTime();
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    loadAnalytics(startOfMonth, endOfMonth);
  }, [currentDate, loadAnalytics]);

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

  const totalRevenue = summary?.totalRevenue || 0;
  const totalExpenses = summary?.totalExpenses || 0;
  // User requested: profit or lose which will be total accumulated sales for the month - expenditure for the month
  const netPerformance = totalRevenue - totalExpenses;
  const isPositive = netPerformance >= 0;

  const monthLabel = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <ScreenWrapper withHeader>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top App Bar Header */}
      <Box bg="$primary800" px="$4" pt={Math.max(insets.top, 10)} pb="$4" rounded="$2xl" mx="$4" mt="$2" style={getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(0,0,0,0.1)' })}>
        <HStack space="md" alignItems="center" justifyContent="space-between">
          <HStack space="md" alignItems="center">
            <Pressable onPress={() => navigation.goBack()}>
              <Icon as={ChevronLeft} color="$white" size="md" />
            </Pressable>
            <VStack>
              <Heading size="md" color="$white" fontWeight="$black">Owner Financial Audit</Heading>
              <Text size="xs" color="$primary200">
                {snapshot?.itemCount ? `Tracking ${snapshot.itemCount} active product items` : 'Comprehensive shop performance audit'}
              </Text>
            </VStack>
          </HStack>

          <Pressable
            onPress={() => {
              console.log("ProfitLossScreen: Refresh button pressed");
              refresh();
            }}
            p="$3"
            rounded="$full"
            bg="$primary700"
            disabled={isLoading}
            style={{
              cursor: 'pointer',
              opacity: isLoading ? 0.6 : 1,
              ...getAppShadow({ offsetY: 2, radius: 6, color: 'rgba(0,0,0,0.2)' })
            }}
          >
            {isLoading ? (
                <Spinner size="small" color="$white" />
            ) : (
                <Icon as={RefreshCw} color="$white" size="sm" />
            )}
          </Pressable>
        </HStack>
      </Box>

      {/* Month Selector Carousel */}
      <Box bg="$white" borderBottomWidth={1} borderColor="$borderLight" py="$2">
        <HStack justifyContent="space-between" alignItems="center" px="$4">
          <Pressable p="$2" onPress={handlePrevMonth}>
            <Icon as={ChevronLeft} color="$primary700" size="sm" />
          </Pressable>
          <Heading size="sm" color="$text900" fontWeight="$bold">{monthLabel}</Heading>
          <Pressable p="$2" onPress={handleNextMonth}>
            <Icon as={ChevronRight} color="$primary700" size="sm" />
          </Pressable>
        </HStack>
      </Box>

      {isLoading ? (
        <Center flex={1}>
          <Spinner size="large" color="$primary800" />
        </Center>
      ) : error ? (
        <Center flex={1} p="$10">
            <Icon as={AlertCircle} size="xl" color="$error600" mb="$4" />
            <Heading size="sm" textAlign="center" color="$text900">Calculations Unavailable</Heading>
            <Text size="xs" color="$text500" textAlign="center" mt="$2" mb="$6">{error}</Text>
            <Button
                onPress={() => {
                    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1, 0, 0, 0, 0).getTime();
                    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
                    loadAnalytics(startOfMonth, endOfMonth);
                }}
                action="primary"
                bg="$primary700"
                borderRadius="$full"
            >
                <ButtonText>Retry Audit</ButtonText>
            </Button>
        </Center>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          {/* Monthly Performance Hero Card */}
          <Box
            bg={isPositive ? '$success600' : '$error600'}
            p="$6"
            rounded="$3xl"
            mb="$6"
            style={getAppShadow({ offsetY: 8, radius: 18, color: isPositive ? 'rgba(67,160,71,0.2)' : 'rgba(229,57,53,0.2)' })}
          >
            <VStack space="xs" alignItems="center">
              <Text color="$white" size="xs" fontWeight="$bold" textTransform="uppercase" opacity={0.8}>
                {isPositive ? 'Net Monthly Surplus' : 'Net Monthly Deficit'}
              </Text>
              <Heading color="$white" size="2xl" fontWeight="$black">
                {isPositive ? '' : '-'}{currency}{Math.abs(netPerformance).toFixed(2)}
              </Heading>
              <Text color="$white" size="xs" opacity={0.9}>
                Based on Sales vs Expenditures for {monthLabel}
              </Text>
            </VStack>
          </Box>

          {/* Section: Product Valuation */}
          <VStack space="md" mb="$6">
            <Heading size="xs" color="$text500" textTransform="uppercase" px="$1">Product Valuation (Snapshot)</Heading>
            <Box bg="$white" rounded="$2xl" borderWidth={1} borderColor="$borderLight" overflow="hidden" style={getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.02)' })}>
              <VStack>
                <HStack p="$4" justifyContent="space-between" alignItems="center">
                  <VStack space="xs">
                    <HStack space="xs" alignItems="center">
                      <Icon as={Package} color="$primary600" size="sm" />
                      <Text size="sm" fontWeight="$bold" color="$text900">Total Stock Cost Value</Text>
                    </HStack>
                    <Text size="xs" color="$text400">Capital locked in current products</Text>
                  </VStack>
                  <Text size="md" fontWeight="$bold" color="$text900">{currency}{(snapshot?.totalStockCostValue || 0).toFixed(2)}</Text>
                </HStack>
                <Divider />
                <HStack p="$4" justifyContent="space-between" alignItems="center">
                  <VStack space="xs">
                    <HStack space="xs" alignItems="center">
                      <Icon as={TrendingUp} color="$success600" size="sm" />
                      <Text size="sm" fontWeight="$bold" color="$text900">Total Expected Sales Value</Text>
                    </HStack>
                    <Text size="xs" color="$text400">Revenue if all stock is sold at current price</Text>
                  </VStack>
                  <Text size="md" fontWeight="$bold" color="$success700">{currency}{(snapshot?.totalStockSellingValue || 0).toFixed(2)}</Text>
                </HStack>
                <Divider />

                {/* Sub-breakdown for Units and Bulk */}
                <HStack p="$4" bg="$backgroundLight50" space="md">
                  <VStack flex={1} space="xs">
                    <Text size="xs" fontWeight="$bold" color="$text500" textTransform="uppercase">Unit Items Only</Text>
                    <HStack justifyContent="space-between">
                      <Text size="xs" color="$text600">Cost:</Text>
                      <Text size="xs" fontWeight="$bold">{currency}{(snapshot?.unitStockCostValue || 0).toFixed(2)}</Text>
                    </HStack>
                    <HStack justifyContent="space-between">
                      <Text size="xs" color="$text600">Expected:</Text>
                      <Text size="xs" fontWeight="$bold">{currency}{(snapshot?.unitStockSellingValue || 0).toFixed(2)}</Text>
                    </HStack>
                  </VStack>
                  <Box w={1} bg="$borderLight" />
                  <VStack flex={1} space="xs">
                    <Text size="xs" fontWeight="$bold" color="$text500" textTransform="uppercase">Bulk Items Only</Text>
                    <HStack justifyContent="space-between">
                      <Text size="xs" color="$text600">Cost:</Text>
                      <Text size="xs" fontWeight="$bold">{currency}{(snapshot?.bulkStockCostValue || 0).toFixed(2)}</Text>
                    </HStack>
                    <HStack justifyContent="space-between">
                      <Text size="xs" color="$text600">Expected:</Text>
                      <Text size="xs" fontWeight="$bold">{currency}{(snapshot?.bulkStockSellingValue || 0).toFixed(2)}</Text>
                    </HStack>
                  </VStack>
                </HStack>
              </VStack>
            </Box>
          </VStack>

          {/* Section: Debts & Liabilities */}
          <VStack space="md" mb="$6">
            <Heading size="xs" color="$text500" textTransform="uppercase" px="$1">Financial Liabilities & Receivables</Heading>
            <Box bg="$white" rounded="$2xl" borderWidth={1} borderColor="$borderLight" overflow="hidden" style={getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.02)' })}>
              <VStack>
                <HStack p="$4" justifyContent="space-between" alignItems="center">
                  <VStack space="xs">
                    <HStack space="xs" alignItems="center">
                      <Icon as={Wallet} color="$error600" size="sm" />
                      <Text size="sm" fontWeight="$bold" color="$text900">Owed to Suppliers</Text>
                    </HStack>
                    <Text size="xs" color="$text400">Total accounts payable</Text>
                  </VStack>
                  <Text size="md" fontWeight="$bold" color="$error700">{currency}{(snapshot?.totalSupplierDebt || 0).toFixed(2)}</Text>
                </HStack>
                <Divider />
                <HStack p="$4" justifyContent="space-between" alignItems="center">
                  <VStack space="xs">
                    <HStack space="xs" alignItems="center">
                      <Icon as={Users} color="$info600" size="sm" />
                      <Text size="sm" fontWeight="$bold" color="$text900">Owed by Customers</Text>
                    </HStack>
                    <Text size="xs" color="$text400">Total accounts receivable</Text>
                  </VStack>
                  <Text size="md" fontWeight="$bold" color="$info700">{currency}{(snapshot?.totalCustomerDebt || 0).toFixed(2)}</Text>
                </HStack>
              </VStack>
            </Box>
          </VStack>

          {/* Section: Periodic Summary */}
          <VStack space="md">
            <Heading size="xs" color="$text500" textTransform="uppercase" px="$1">Monthly Summary Breakdown</Heading>
            <Box bg="$white" rounded="$2xl" borderWidth={1} borderColor="$borderLight" overflow="hidden" style={getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.02)' })}>
              <VStack>
                <HStack p="$4" justifyContent="space-between" alignItems="center">
                  <VStack space="xs">
                    <Text size="sm" fontWeight="$bold" color="$text900">Accumulated Sales</Text>
                    <Text size="xs" color="$text400">Total cash/credit turnover this month</Text>
                  </VStack>
                  <Text size="md" fontWeight="$bold" color="$text900">{currency}{totalRevenue.toFixed(2)}</Text>
                </HStack>
                <Divider />
                <HStack p="$4" justifyContent="space-between" alignItems="center">
                  <VStack space="xs">
                    <HStack space="xs" alignItems="center">
                      <Icon as={TrendingDown} color="$error600" size="sm" />
                      <Text size="sm" fontWeight="$bold" color="$text900">Total Expenditure</Text>
                    </HStack>
                    <Text size="xs" color="$text400">Operating costs & overheads this month</Text>
                  </VStack>
                  <Text size="md" fontWeight="$bold" color="$error700">-{currency}{totalExpenses.toFixed(2)}</Text>
                </HStack>
                <Divider />
                <HStack p="$4" bg="$backgroundLight50" justifyContent="space-between" alignItems="center">
                  <Text size="sm" fontWeight="$black" color="$text900">Monthly Net Result</Text>
                  <Text size="md" fontWeight="$black" color={isPositive ? '$success700' : '$error700'}>
                    {isPositive ? '+' : '-'}{currency}{Math.abs(netPerformance).toFixed(2)}
                  </Text>
                </HStack>
              </VStack>
            </Box>
          </VStack>

        </ScrollView>
      )}
    </ScreenWrapper>
  );
};

export default ProfitLossScreen;
