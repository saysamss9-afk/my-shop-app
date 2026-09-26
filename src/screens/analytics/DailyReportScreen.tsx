import React, { useState, useEffect } from 'react';
import { FlatList, StatusBar, ScrollView } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Spinner,
  Center,
  Input,
  InputField,
  InputSlot,
  Badge,
  BadgeText,
  Pressable,
} from '@gluestack-ui/themed';
import { RefreshCw, ArrowLeft } from 'lucide-react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDailyReport } from '../../hooks/useDailyReport';
import { getAppShadow, isWeb } from '../../utils/platformStyles';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import { SyncStatus } from '../../sync/SyncManager';
import { useTranslation } from 'react-i18next';

const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const DailyReportScreen = ({ route, navigation }: any) => {
  const { shopId } = route.params;
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const flexDir = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' : 'left';

  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()));

  const { reportData, currency, isLoading, syncStatus, dataChangeTick, loadReport, triggerManualSync } = useDailyReport(shopId);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      loadReport(selectedDate);
    }
  }, [selectedDate, dataChangeTick, loadReport]);

  const changeDateByDays = (days: number) => {
    const parts = selectedDate.split('-');
    const current = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]) || 1);
    current.setDate(current.getDate() + days);
    setSelectedDate(formatDate(current));
  };

  const setToday = () => {
    setSelectedDate(formatDate(new Date()));
  };

  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setSelectedDate(formatDate(d));
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <Box
      bg={index % 2 === 0 ? "$white" : "$backgroundLight50"}
      borderBottomWidth={1}
      borderColor="$borderLight"
    >
      <HStack space="sm" alignItems="center" py="$3" px="$3" minWidth={580} flexDirection={flexDir}>
        {/* Item Name & ID */}
        <VStack w={180} space="xs">
          <Text size="xs" color={item.productId === 'DEBT_PAYMENT' ? "$success700" : "$text900"} fontWeight="$bold" numberOfLines={2} textAlign={textAlign}>
            {item.productName}
          </Text>
          <Text size="2xs" color="$text400" textAlign={textAlign}>
            ID: {item.productId.slice(-6).toUpperCase()}
          </Text>
        </VStack>

        {/* Type Badge */}
        <Box w={70} alignItems="center">
          <Badge
            action={item.productId === 'DEBT_PAYMENT' ? 'success' : ((item.isBulk === 1 || item.isBulk === true || item.isBulk === 'true') ? "warning" : "info")}
            variant="outline"
            size="sm"
            rounded="$md"
          >
            <BadgeText size="2xs" fontWeight="$bold">
              {item.productId === 'DEBT_PAYMENT' ? 'PMT' : ((item.isBulk === 1 || item.isBulk === true || item.isBulk === 'true') ? "BULK" : "UNIT")}
            </BadgeText>
          </Badge>
        </Box>

        {/* Quantity Sold */}
        <Box w={65} alignItems="center">
          <Text size="xs" fontWeight="$bold" color="$text800">
            {item.totalQuantitySold ?? 0}
          </Text>
        </Box>

        {/* Revenue */}
        <Box w={135} alignItems={isRTL ? "flex-start" : "flex-end"} pr="$2">
          {item.isOnCredit === 1 ? (
            <Badge action="error" variant="solid" size="sm" rounded="$md">
              <BadgeText size="2xs" fontWeight="$bold">ON CREDIT</BadgeText>
            </Badge>
          ) : (
            <Text size="xs" fontWeight="$black" color="$primary700">
              {currency}{(item.totalRevenue || 0).toFixed(2)}
            </Text>
          )}
        </Box>

        {/* Remaining Stock */}
        <Box w={100} alignItems={isRTL ? "flex-start" : "flex-end"}>
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
      <Box pt={Math.max(insets.top, 10)} pb="$3" px="$4">
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
              <Heading size="lg" color="$text900" fontWeight="$black" textAlign={textAlign}>Daily Item Sales</Heading>
              <Text size="xs" color="$text500" textAlign={textAlign}>Performance report per item</Text>
            </VStack>
          </HStack>

          <HStack space="sm" alignItems="center" flexDirection={flexDir}>
            {syncStatus === SyncStatus.Syncing ? (
              <Spinner color="$primary600" size="small" />
            ) : (
              <Pressable
                onPress={() => triggerManualSync()}
                p="$3"
                minWidth={44}
                minHeight={44}
                justifyContent="center"
                alignItems="center"
                rounded="$full"
                bg="$white"
                accessibilityLabel="Sync report"
                accessibilityRole="button"
                style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.05)' }) }}
              >
                <Icon as={RefreshCw} color="$primary600" size="sm" />
              </Pressable>
            )}
          </HStack>
        </HStack>
      </Box>

      {/* Robust Date Selector Section */}
      <Box px="$4" pb="$4">
        <VStack space="sm">
          <HStack space="xs" alignItems="center" flexDirection={flexDir}>
            {/* Prev Day Button */}
            <Pressable
              onPress={() => changeDateByDays(-1)}
              minWidth={44}
              minHeight={44}
              justifyContent="center"
              alignItems="center"
              accessibilityLabel="Previous day"
              accessibilityRole="button"
            >
              <Box bg="$white" p="$2.5" rounded="$xl" borderWidth={1} borderColor="$borderLight" style={getAppShadow({ offsetY: 2, radius: 6, color: 'rgba(0,0,0,0.03)' })}>
                <MaterialCommunityIcons name={isRTL ? "chevron-right" : "chevron-left"} size={20} color="#333" />
              </Box>
            </Pressable>

            {/* Date Input Container */}
            <Box flex={1}>
              <Input variant="outline" size="md" borderRadius={12} bg="$white" style={{ flexDirection: flexDir }}>
                <InputField
                  placeholder="YYYY-MM-DD"
                  value={selectedDate}
                  onChangeText={setSelectedDate}
                  keyboardType="numeric"
                  textAlign={textAlign}
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

            {/* Next Day Button */}
            <Pressable
              onPress={() => changeDateByDays(1)}
              minWidth={44}
              minHeight={44}
              justifyContent="center"
              alignItems="center"
              accessibilityLabel="Next day"
              accessibilityRole="button"
            >
              <Box bg="$white" p="$2.5" rounded="$xl" borderWidth={1} borderColor="$borderLight" style={getAppShadow({ offsetY: 2, radius: 6, color: 'rgba(0,0,0,0.03)' })}>
                <MaterialCommunityIcons name={isRTL ? "chevron-left" : "chevron-right"} size={20} color="#333" />
              </Box>
            </Pressable>
          </HStack>

          {/* Date Quick Action Presets */}
          <HStack space="xs" justifyContent={isRTL ? "flex-start" : "flex-end"} flexDirection={flexDir}>
            <Pressable
              onPress={setYesterday}
              minHeight={36}
              justifyContent="center"
              accessibilityLabel="Yesterday"
              accessibilityRole="button"
            >
              <Box bg="$backgroundLight100" px="$3" py="$2" rounded="$lg">
                <Text size="2xs" color="$text700" fontWeight="$bold">Yesterday</Text>
              </Box>
            </Pressable>
            <Pressable
              onPress={setToday}
              minHeight={36}
              justifyContent="center"
              accessibilityLabel="Today"
              accessibilityRole="button"
            >
              <Box bg="$primary600" px="$3" py="$2" rounded="$lg">
                <Text size="2xs" color="white" fontWeight="$bold">Today</Text>
              </Box>
            </Pressable>
          </HStack>
        </VStack>
      </Box>

      {/* Summary Banner */}
      <Box bg="$white" px="$5" py="$3" borderBottomWidth={1} borderColor="$borderLight" mb="$2">
        <HStack justifyContent="space-between" alignItems="center" flexDirection={flexDir}>
          <VStack>
            <Text size="xs" color="$text500" fontWeight="$bold" textAlign={textAlign}>TOTAL ITEMS SOLD</Text>
            <Heading size="md" color="$text900" textAlign={textAlign}>{reportData.length} Products</Heading>
          </VStack>
          <VStack alignItems={isRTL ? "flex-start" : "flex-end"}>
            <Text size="xs" color="$text500" fontWeight="$bold" textAlign={textAlign}>TOTAL REVENUE</Text>
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
          {/* Scrollable Table View for Full Content Display */}
          <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={{ flexGrow: 1 }}>
            <VStack flex={1} minWidth={580}>
              {/* Table Header */}
              <Box bg="$primary800" py="$2.5" px="$3">
                <HStack space="sm" alignItems="center" flexDirection={flexDir}>
                  <Text w={180} size="2xs" color="white" fontWeight="$bold" textAlign={textAlign}>ITEM (ID)</Text>
                  <Text w={70} size="2xs" color="white" fontWeight="$bold" textAlign="center">TYPE</Text>
                  <Text w={65} size="2xs" color="white" fontWeight="$bold" textAlign="center">QTY</Text>
                  <Text w={135} size="2xs" color="white" fontWeight="$bold" textAlign={isRTL ? "left" : "right"} pr="$2">REVENUE</Text>
                  <Text w={100} size="2xs" color="white" fontWeight="$bold" textAlign={isRTL ? "left" : "right"}>STOCK</Text>
                </HStack>
              </Box>

              {/* Table Rows */}
              <FlatList
                data={reportData}
                keyExtractor={(item) => item.productId + (item.isBulk ? '_blk' : '_unit')}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 40 }}
                ListEmptyComponent={
                  <Center mt="$20" py="$10">
                    <VStack space="md" alignItems="center">
                      <MaterialCommunityIcons name="chart-box-outline" size={56} color="#ccc" />
                      <Text color="$text400">No sales recorded for this date ({selectedDate}).</Text>
                    </VStack>
                  </Center>
                }
              />
            </VStack>
          </ScrollView>
        </Box>
      )}
    </ScreenWrapper>
  );
};

export default DailyReportScreen;
