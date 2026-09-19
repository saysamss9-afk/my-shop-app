import React, { useState, useEffect } from 'react';
import { FlatList, StatusBar, Pressable } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Spinner,
  Center,
  ArrowLeftIcon,
  Input,
  InputField,
  InputSlot,
  Divider,
  Badge,
  BadgeText,
} from '@gluestack-ui/themed';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDailyReport } from '../../hooks/useDailyReport';
import { getAppShadow, isWeb } from '../../utils/platformStyles';
import ScreenWrapper from '../../components/common/ScreenWrapper';

const DailyReportScreen = ({ route, navigation }: any) => {
  const { shopId } = route.params;
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const { reportData, currency, isLoading, loadReport } = useDailyReport(shopId);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (selectedDate) {
      loadReport(selectedDate);
    }
  }, [selectedDate, loadReport]);

  const setToday = () => {
    const d = new Date();
    setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <Box
      bg={index % 2 === 0 ? "$white" : "$backgroundLight50"}
      borderBottomWidth={1}
      borderColor="$borderLight"
    >
      <HStack space="xs" alignItems="center" py="$3" px="$4">
        {/* Item Name */}
        <VStack flex={3} space="xs">
          <Text size="sm" color={item.productId === 'DEBT_PAYMENT' ? "$success700" : "$text900"} fontWeight="$bold" numberOfLines={1}>
            {item.productName}
          </Text>
          <Text size="2xs" color="$text400">
            ID: {item.productId.slice(-6).toUpperCase()}
          </Text>
        </VStack>

        {/* Type Badge */}
        <Box flex={1} alignItems="center">
          <Badge action={item.productId === 'DEBT_PAYMENT' ? 'success' : ((item.isBulk === 1 || item.isBulk === true || item.isBulk === 'true') ? "warning" : "info")} variant="outline" size="sm" rounded="$md">
            <BadgeText size="2xs">{item.productId === 'DEBT_PAYMENT' ? 'PMT' : ((item.isBulk === 1 || item.isBulk === true || item.isBulk === 'true') ? "BLK" : "UNIT")}</BadgeText>
          </Badge>
        </Box>

        {/* Quantity Sold */}
        <Box flex={1} alignItems="center">
          <Text size="sm" fontWeight="$bold" color="$text800">
            {item.totalQuantitySold ?? 0}
          </Text>
        </Box>

        {/* Revenue */}
        <Box flex={2} alignItems="flex-end" pr="$2">
          {item.isOnCredit === 1 ? (
            <Badge action="error" variant="solid" size="sm" rounded="$lg">
              <BadgeText size="2xs" fontWeight="$bold">ON CREDIT</BadgeText>
            </Badge>
          ) : (
            <Text size="sm" fontWeight="$black" color="$primary700">
              {currency}{(item.totalRevenue || 0).toFixed(2)}
            </Text>
          )}
        </Box>

        {/* Remaining Stock */}
        <Box flex={1.5} alignItems="flex-end">
          <Text
            size="xs"
            fontWeight="$bold"
            color={item.productId === 'DEBT_PAYMENT' ? '$text400' : ((item.currentStock || 0) <= 5 ? "$error600" : "$success600")}
          >
            {item.productId === 'DEBT_PAYMENT' ? '-' : `${item.currentStock ?? 0} ${item.unit || ''}`}
          </Text>
        </Box>
      </HStack>
    </Box>
  );

  return (
    <ScreenWrapper withHeader>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <Box pt={Math.max(insets.top, 10)} pb="$4" px="$4">
        <HStack space="md" alignItems="center">
          <Pressable onPress={() => navigation.goBack()}>
            <Box p="$2" bg="$white" rounded="$full" style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.05)' }) }}>
              <Icon as={ArrowLeftIcon} color="$text900" />
            </Box>
          </Pressable>
          <VStack>
            <Heading size="lg" color="$text900" fontWeight="$black">Daily Item Sales</Heading>
            <Text size="xs" color="$text500">Performance report per item</Text>
          </VStack>
        </HStack>
      </Box>

      {/* Date Picker Section */}
      <Box px="$4" pb="$4">
        <HStack space="sm" alignItems="center">
          <Box flex={1}>
            <Input variant="outline" size="md" borderRadius={12} bg="$white">
              <InputField
                placeholder="YYYY-MM-DD"
                value={selectedDate}
                onChangeText={setSelectedDate}
              />
              {isWeb ? (
                <InputSlot style={{ paddingRight: 8 }}>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e: any) => setSelectedDate(e.target.value)}
                    style={{
                      border: '1px solid #ccc',
                      borderRadius: '6px',
                      padding: '2px 6px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  />
                </InputSlot>
              ) : (
                <InputSlot pr="$3">
                  <MaterialCommunityIcons name="calendar" size={18} color="#666" />
                </InputSlot>
              )}
            </Input>
          </Box>
          <Pressable onPress={setToday}>
            <Box bg="$primary600" px="$4" py="$2.5" rounded="$xl">
              <Text size="sm" color="white" fontWeight="$bold">Today</Text>
            </Box>
          </Pressable>
        </HStack>
      </Box>

      {/* Summary Banner */}
      <Box bg="$white" px="$5" py="$4" borderBottomWidth={1} borderColor="$borderLight" mb="$2">
        <HStack justifyContent="space-between" alignItems="center">
          <VStack>
            <Text size="xs" color="$text500" fontWeight="$bold">TOTAL ITEMS SOLD</Text>
            <Heading size="md" color="$text900">{reportData.length} Products</Heading>
          </VStack>
          <VStack alignItems="flex-end">
            <Text size="xs" color="$text500" fontWeight="$bold">TOTAL REVENUE</Text>
            <Heading size="md" color="$primary800">
              {currency}{reportData.reduce((acc, curr) => acc + (curr.isOnCredit === 1 ? 0 : curr.totalRevenue), 0).toFixed(2)}
            </Heading>
          </VStack>
        </HStack>
      </Box>

      {isLoading ? (
        <Center flex={1}>
          <Spinner size="large" color="$primary800" />
        </Center>
      ) : (
        <Box flex={1} bg="$white" mx="$1" rounded="$xl" overflow="hidden" borderWidth={1} borderColor="$borderLight" style={{ ...getAppShadow({ offsetY: 4, radius: 15, color: 'rgba(0,0,0,0.05)' }) }}>
          {/* Excel Header */}
          <Box bg="$primary800" py="$3" px="$4">
            <HStack space="xs" alignItems="center">
              <Text flex={4} size="xs" color="white" fontWeight="$bold">ITEM NAME</Text>
              <Text flex={1.2} size="xs" color="white" fontWeight="$bold" textAlign="center">TYPE</Text>
              <Text flex={1.2} size="xs" color="white" fontWeight="$bold" textAlign="center">QTY</Text>
              <Text flex={2.5} size="xs" color="white" fontWeight="$bold" textAlign="right">REVENUE</Text>
              <Text flex={2} size="xs" color="white" fontWeight="$bold" textAlign="right">STOCK</Text>
            </HStack>
          </Box>

          <FlatList
            data={reportData}
            keyExtractor={(item) => item.productId + (item.isBulk ? '_blk' : '_unit')}
            renderItem={({ item, index }) => (
              <Box
                bg={index % 2 === 0 ? "$white" : "$backgroundLight50"}
                borderBottomWidth={1}
                borderColor="$borderLight"
              >
                <HStack space="xs" alignItems="center" py="$3.5" px="$4">
                  {/* Item Name */}
                  <VStack flex={4} space="xs">
                    <Text size="sm" color={item.productId === 'DEBT_PAYMENT' ? "$success700" : "$text900"} fontWeight="$bold" numberOfLines={1}>
                      {item.productName}
                    </Text>
                    <Text size="2xs" color="$text400">
                      ID: {item.productId.slice(-6).toUpperCase()}
                    </Text>
                  </VStack>

                  {/* Type Badge */}
                  <Box flex={1.2} alignItems="center">
                    <Badge action={item.productId === 'DEBT_PAYMENT' ? 'success' : (item.isBulk ? "warning" : "info")} variant="outline" size="sm" rounded="$md">
                      <BadgeText size="2xs" fontWeight="$bold">{item.productId === 'DEBT_PAYMENT' ? 'PMT' : (item.isBulk ? "BLK" : "UNIT")}</BadgeText>
                    </Badge>
                  </Box>

                  {/* Quantity Sold */}
                  <Box flex={1.2} alignItems="center">
                    <Text size="sm" fontWeight="$bold" color="$text800">
                      {item.totalQuantitySold ?? 0}
                    </Text>
                  </Box>

                  {/* Revenue */}
                  <Box flex={2.5} alignItems="flex-end" pr="$1">
                    {item.isOnCredit === 1 ? (
                      <Badge action="error" variant="solid" size="sm" rounded="$lg">
                        <BadgeText size="2xs" fontWeight="$bold">CREDIT</BadgeText>
                      </Badge>
                    ) : (
                      <Text size="sm" fontWeight="$black" color="$primary700">
                        {currency}{(item.totalRevenue || 0).toFixed(2)}
                      </Text>
                    )}
                  </Box>

                  {/* Remaining Stock */}
                  <Box flex={2} alignItems="flex-end">
                    <Text
                      size="xs"
                      fontWeight="$bold"
                      color={item.productId === 'DEBT_PAYMENT' ? '$text400' : ((item.currentStock || 0) <= 5 ? "$error600" : "$success600")}
                    >
                      {item.productId === 'DEBT_PAYMENT' ? '-' : `${item.currentStock ?? 0} ${item.unit || ''}`}
                    </Text>
                  </Box>
                </HStack>
              </Box>
            )}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              <Center mt="$20">
                <VStack space="md" alignItems="center">
                  <MaterialCommunityIcons name="chart-box-outline" size={64} color="#ccc" />
                  <Text color="$text400">No sales recorded for this date.</Text>
                </VStack>
              </Center>
            }
          />
        </Box>
      )}
    </ScreenWrapper>
  );
};

export default DailyReportScreen;
