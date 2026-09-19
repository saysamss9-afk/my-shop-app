import React from 'react';
import { ScrollView, StatusBar } from 'react-native';
import { displayAlert } from '../../utils/alert';
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
import ScreenWrapper from '../../components/common/ScreenWrapper';
import RNPrint from 'react-native-print';
import { Platform } from 'react-native';

// Sub-components
import AnalyticsHeader from './components/AnalyticsHeader';
import TopProductsList from './components/TopProductsList';
import CashierPerformanceList from './components/CashierPerformanceList';

const AnalyticsScreen = ({ route, navigation }: any) => {
  const { shopId } = route.params;
  const {
    topProducts,
    cashierPerformance,
    currency,
    isLoading,
    loadAnalytics
  } = useAnalytics(shopId);

  const handleRefresh = () => {
    const now = Date.now();
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    loadAnalytics(startOfDay, now);
  };

  const handleExport = async () => {
    const html = `
        <html>
            <body style="font-family: Arial, sans-serif; padding: 30px; color: #333;">
                <h1 style="color: #1A237E; text-align: center; margin-bottom: 10px;">Item Performance Report</h1>
                <p style="text-align: center; color: #666;">Generated on ${new Date().toLocaleString()}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>

                <h2 style="color: #1A237E; border-bottom: 2px solid #1A237E; padding-bottom: 5px;">Top Performing Products</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="text-align: left; padding: 12px; border: 1px solid #dee2e6;">Product Name</th>
                            <th style="text-align: center; padding: 12px; border: 1px solid #dee2e6;">Units Sold</th>
                            <th style="text-align: right; padding: 12px; border: 1px solid #dee2e6;">Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${topProducts.map(p => `
                            <tr>
                                <td style="padding: 12px; border: 1px solid #dee2e6;">${p.name}</td>
                                <td style="text-align: center; padding: 12px; border: 1px solid #dee2e6;">${p.totalQuantity}</td>
                                <td style="text-align: right; padding: 12px; border: 1px solid #dee2e6;">${currency}${p.totalRevenue.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <h2 style="color: #1A237E; border-bottom: 2px solid #1A237E; padding-bottom: 5px; margin-top: 40px;">Cashier Performance</h2>
                 <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="text-align: left; padding: 12px; border: 1px solid #dee2e6;">Staff Name</th>
                            <th style="text-align: center; padding: 12px; border: 1px solid #dee2e6;">Sales Count</th>
                            <th style="text-align: right; padding: 12px; border: 1px solid #dee2e6;">Total Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cashierPerformance.map(cp => `
                            <tr>
                                <td style="padding: 12px; border: 1px solid #dee2e6;">${cp.employeeName}</td>
                                <td style="text-align: center; padding: 12px; border: 1px solid #dee2e6;">${cp.saleCount}</td>
                                <td style="text-align: right; padding: 12px; border: 1px solid #dee2e6;">${currency}${cp.totalRevenue.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <footer style="margin-top: 50px; text-align: center; font-size: 12px; color: #999;">
                    Powered by My Shop Business Intelligence
                </footer>
            </body>
        </html>
    `;

    if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.print();
        } else {
            displayAlert("Print Error", "Pop-up blocked. Please allow pop-ups for this site.");
        }
    } else {
        try {
            await RNPrint.print({ html });
        } catch (e) {
            displayAlert("Export Error", "Could not generate report.");
        }
    }
  };

  return (
    <ScreenWrapper withHeader>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <AnalyticsHeader
        onBack={() => navigation.goBack()}
        onRefresh={handleRefresh}
      />

      {isLoading ? (
        <Center flex={1}>
          <Spinner size="large" color="$primary800" />
        </Center>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <VStack space="xl" pt="$4">
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
    </ScreenWrapper>
  );
};

export default AnalyticsScreen;
