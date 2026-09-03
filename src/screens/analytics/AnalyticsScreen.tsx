import React from 'react';
import { ScrollView, Alert, StatusBar } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Center,
  Button,
  ButtonText,
  ButtonIcon,
  Spinner,
  Divider,
  DownloadIcon,
} from '@gluestack-ui/themed';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { useAnalytics } from '../../hooks/useAnalytics';
import RNPrint from 'react-native-print';

// Sub-components
import AnalyticsHeader from './components/AnalyticsHeader';
import FinancialSummaryCard from './components/FinancialSummaryCard';
import TopProductsList from './components/TopProductsList';
import CashierPerformanceList from './components/CashierPerformanceList';

const AnalyticsScreen = ({ route, navigation }: any) => {
  const { shopId } = route.params;
  const {
    summary,
    expenses,
    topProducts,
    cashierPerformance,
    currency,
    isLoading,
    loadAnalytics
  } = useAnalytics(shopId);

  const netProfit = (summary?.totalProfit || 0) - expenses;

  const handleRefresh = () => {
    const now = Date.now();
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    loadAnalytics(startOfDay, now);
  };

  const handleExport = async () => {
    try {
        const html = `
            <html>
                <body style="font-family: Arial; padding: 20px;">
                    <h1 style="color: #1A237E; text-align: center;">Business Intelligence Report</h1>
                    <hr/>
                    <div style="margin: 20px 0;">
                        <h2>Financial Summary</h2>
                        <p>Total Revenue: <b>${currency}${summary?.totalRevenue.toFixed(2)}</b></p>
                        <p>Total Expenses: <b>${currency}${expenses.toFixed(2)}</b></p>
                        <p>Net Profit: <b>${currency}${netProfit.toFixed(2)}</b></p>
                    </div>
                    <hr/>
                    <h2>Top Products</h2>
                    <ul>
                        ${topProducts.map(p => `<li>${p.name}: ${p.totalQuantity} units - ${currency}${p.totalRevenue.toFixed(2)}</li>`).join('')}
                    </ul>
                </body>
            </html>
        `;
        await RNPrint.print({ html });
    } catch (e) {
        Alert.alert("Export Error", "Could not generate report.");
    }
  };

  return (
    <Box flex={1} bg="$backgroundLight50">
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />

      <AnalyticsHeader
        onBack={() => navigation.goBack()}
        onRefresh={handleRefresh}
      />

      {isLoading ? (
        <Center flex={1}>
          <Spinner size="large" color="$primary800" />
        </Center>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          <FinancialSummaryCard
            totalRevenue={summary?.totalRevenue || 0}
            expenses={expenses}
            netProfit={netProfit}
            currency={currency}
          />

          <VStack space="xl">
            <VStack space="md">
              <Heading size="sm" color="$text900" px="$1">SALES BREAKDOWN</Heading>
              <Box bg="$white" rounded="$2xl" borderWidth={1} borderColor="$borderLight" overflow="hidden">
                <VStack>
                  <HStack p="$4" justifyContent="space-between" alignItems="center">
                    <HStack space="sm" alignItems="center">
                      <Icon as={TrendingUp} color="$success600" />
                      <Text size="sm" fontWeight="$medium">Gross Profit</Text>
                    </HStack>
                    <Text size="md" fontWeight="$bold" color="$text900">{currency}{summary?.totalProfit.toFixed(2)}</Text>
                  </HStack>
                  <Divider />
                  <HStack p="$4" justifyContent="space-between" alignItems="center">
                    <HStack space="sm" alignItems="center">
                      <Icon as={TrendingDown} color="$error600" />
                      <Text size="sm" fontWeight="$medium">Operation Costs</Text>
                    </HStack>
                    <Text size="md" fontWeight="$bold" color="$text900">-{currency}{expenses.toFixed(2)}</Text>
                  </HStack>
                </VStack>
              </Box>
            </VStack>

            <TopProductsList
                products={topProducts}
                currency={currency}
            />

            <CashierPerformanceList
                performance={cashierPerformance}
                currency={currency}
            />

            <Button
              size="lg"
              variant="solid"
              action="primary"
              onPress={handleExport}
              borderRadius={14}
              bg="$primary800"
              mt="$4"
            >
              <ButtonIcon as={DownloadIcon} mr="$2" />
              <ButtonText fontWeight="$bold">Generate PDF Report</ButtonText>
            </Button>
          </VStack>
        </ScrollView>
      )}
    </Box>
  );
};

export default AnalyticsScreen;
