import React, { useState } from 'react';
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
  Pressable,
} from '@gluestack-ui/themed';
import { Appbar } from 'react-native-paper';
import { TrendingUp, TrendingDown, User, RefreshCw } from 'lucide-react-native';
import { useAnalytics } from '../../hooks/useAnalytics';
import RNPrint from 'react-native-print';

const AvatarText = ({ index, name }: any) => {
    const bgColors = ['$blue100', '$green100', '$amber100', '$purple100'];
    return (
        <Center
          w={40}
          h={40}
          rounded="$full"
          bg={bgColors[index % 4]}
        >
            <Text size="sm" fontWeight="$bold" color="$primary800">{name.charAt(0)}</Text>
        </Center>
    );
};

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

      {/* Modern Solid Header */}
      <Box bg="$primary800">
        <Appbar.Header style={{ backgroundColor: 'transparent', elevation: 0 }}>
          <Appbar.BackAction color="white" onPress={() => navigation.goBack()} />
          <Appbar.Content
            title="Business Intelligence"
            titleStyle={{ color: 'white', fontWeight: '900', fontSize: 20 }}
          />
          <Pressable onPress={handleRefresh} p="$3">
            <Icon as={RefreshCw} color="white" size="sm" />
          </Pressable>
        </Appbar.Header>
      </Box>

      {isLoading ? (
        <Center flex={1}>
          <Spinner size="large" color="$primary800" />
        </Center>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Main Financial Surface */}
          <Box bg="$primary800" p="$6" rounded="$3xl" mb="$6" style={{ ...platformShadow({ offsetY: 10, radius: 20, color: 'rgba(0,0,0,0.18)' }) }}>
            <VStack space="md" alignItems="center">
                <Text size="sm" color="rgba(255,255,255,0.7)" fontWeight="$bold" textTransform="uppercase">Total Revenue</Text>
                <Heading size="3xl" color="$white" fontWeight="$black">
                  {currency}{summary?.totalRevenue.toFixed(2) || '0.00'}
                </Heading>
            </VStack>

            <Box h={1} bg="rgba(255,255,255,0.1)" my="$6" />

            <HStack space="md" justifyContent="space-between">
                <VStack flex={1} alignItems="center" space="xs">
                    <Text size="xs" color="rgba(255,255,255,0.7)" fontWeight="$bold">EXPENSES</Text>
                    <Text size="md" color="$error300" fontWeight="$bold">-{currency}{expenses.toFixed(2)}</Text>
                </VStack>
                <VStack flex={1} alignItems="center" space="xs">
                    <Text size="xs" color="rgba(255,255,255,0.7)" fontWeight="$bold">NET PROFIT</Text>
                    <Text size="lg" color={netProfit >= 0 ? '$success400' : '$error400'} fontWeight="$black">
                        {currency}{netProfit.toFixed(2)}
                    </Text>
                </VStack>
            </HStack>
          </Box>

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

            <VStack space="md">
              <Heading size="sm" color="$text900" px="$1">TOP PERFORMING PRODUCTS</Heading>
              <Box bg="$white" rounded="$2xl" borderWidth={1} borderColor="$borderLight" overflow="hidden">
                <VStack>
                  {topProducts.length > 0 ? topProducts.map((p, i) => (
                    <React.Fragment key={i}>
                      <HStack p="$4" justifyContent="space-between" alignItems="center">
                        <HStack space="md" alignItems="center" flex={1}>
                          <AvatarText index={i} name={p.name} />
                          <VStack space="xs">
                            <Text size="sm" fontWeight="$bold" color="$text900">{p.name}</Text>
                            <Text size="xs" color="$text500">{p.totalQuantity} units sold</Text>
                          </VStack>
                        </HStack>
                        <Text size="md" fontWeight="$bold" color="$primary800">{currency}{p.totalRevenue.toFixed(2)}</Text>
                      </HStack>
                      {i < topProducts.length - 1 && <Divider />}
                    </React.Fragment>
                  )) : (
                    <Center p="$10">
                      <Text size="sm" color="$text400">No product data available</Text>
                    </Center>
                  )}
                </VStack>
              </Box>
            </VStack>

            <VStack space="md">
              <Heading size="sm" color="$text900" px="$1">EMPLOYEE CONTRIBUTIONS</Heading>
              <Box bg="$white" rounded="$2xl" borderWidth={1} borderColor="$borderLight" overflow="hidden">
                <VStack>
                  {cashierPerformance.length > 0 ? cashierPerformance.map((c, i) => (
                    <React.Fragment key={i}>
                      <HStack p="$4" justifyContent="space-between" alignItems="center">
                        <HStack space="md" alignItems="center" flex={1}>
                          <Center w={40} h={40} bg="$backgroundLight100" rounded="$full">
                            <Icon as={User} color="$text500" />
                          </Center>
                          <VStack space="xs">
                            <Text size="sm" fontWeight="$bold" color="$text900">{c.employeeName}</Text>
                            <Text size="xs" color="$text500">{c.saleCount} transactions</Text>
                          </VStack>
                        </HStack>
                        <Text size="md" fontWeight="$bold" color="$primary800">{currency}{c.totalRevenue.toFixed(2)}</Text>
                      </HStack>
                      {i < cashierPerformance.length - 1 && <Divider />}
                    </React.Fragment>
                  )) : (
                    <Center p="$10">
                      <Text size="sm" color="$text400">No employee data available</Text>
                    </Center>
                  )}
                </VStack>
              </Box>
            </VStack>

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
