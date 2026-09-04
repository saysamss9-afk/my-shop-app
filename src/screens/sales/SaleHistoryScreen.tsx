import React, { useCallback } from 'react';
import { FlatList, StatusBar } from 'react-native';
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
} from '@gluestack-ui/themed';
import { Appbar } from 'react-native-paper';
import { RefreshCw, AlertTriangle } from 'lucide-react-native';
import { useSales } from '../../hooks/useSales';
import { Sale } from '../../db/types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getAppShadow } from '../../utils/platformStyles';
import { SyncStatus } from '../../sync/SyncManager';

// Sub-components
import SaleHistoryItem from './components/SaleHistoryItem';

const SaleHistoryScreen = ({ route, navigation }: any) => {
  const { shopId } = route.params;
  const { sales, isLoading, syncStatus, currency, revertSale, triggerManualSync } = useSales(shopId);

  const renderItem = useCallback(({ item }: { item: Sale }) => (
    <SaleHistoryItem
        item={item}
        currency={currency}
        onRevert={revertSale}
    />
  ), [currency, revertSale]);

  return (
    <Box flex={1} bg="$backgroundLight50">
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />

      {/* Modern Solid Header */}
      <Box bg="$primary800">
        <Appbar.Header style={{ backgroundColor: 'transparent', elevation: 0 }}>
          <Appbar.BackAction color="white" onPress={() => navigation.goBack()} />
          <Appbar.Content
            title="Sales History"
            titleStyle={{ color: 'white', fontWeight: '900', fontSize: 20 }}
          />
          {syncStatus === SyncStatus.Syncing ? (
            <HStack mr="$4" space="xs" alignItems="center" bg="rgba(255,255,255,0.1)" px="$3" py="$1.5" rounded="$full">
                <Spinner color="white" size="small" />
                <Text size="xs" color="white" fontWeight="$bold">Syncing...</Text>
            </HStack>
          ) : (
            <Pressable
                onPress={triggerManualSync}
                mr="$4"
                bg={syncStatus === SyncStatus.Error ? "$error500" : "white"}
                px="$3"
                py="$1.5"
                rounded="$full"
                style={{ ...getAppShadow({ offsetY: 4, radius: 8, color: 'rgba(0,0,0,0.1)' }) }}
            >
                <HStack space="xs" alignItems="center">
                    <Icon
                        as={syncStatus === SyncStatus.Error ? AlertTriangle : RefreshCw}
                        color={syncStatus === SyncStatus.Error ? "white" : "$primary800"}
                        size="xs"
                    />
                    <Text size="xs" color={syncStatus === SyncStatus.Error ? "white" : "$primary800"} fontWeight="$black">
                        {syncStatus === SyncStatus.Error ? 'Retry' : 'Sync'}
                    </Text>
                </HStack>
            </Pressable>
          )}
        </Appbar.Header>
      </Box>

      {/* Stats Summary Bar */}
      <Box bg="$white" px="$5" py="$4" borderBottomWidth={1} borderColor="$borderLight">
        <HStack space="md" alignItems="center">
            <VStack flex={1} alignItems="center" space="xs">
                <Text size="xs" color="$text500" fontWeight="$bold" textTransform="uppercase">Transactions</Text>
                <Heading size="md" color="$text900">{sales.length}</Heading>
            </VStack>
            <Divider orientation="vertical" h="$10" />
            <VStack flex={1} alignItems="center" space="xs">
                <Text size="xs" color="$text500" fontWeight="$bold" textTransform="uppercase">Total Volume</Text>
                <Heading size="md" color="$primary800">
                    {currency}{sales.reduce((acc, curr) => acc + curr.totalAmount, 0).toFixed(2)}
                </Heading>
            </VStack>
        </HStack>
      </Box>

      {isLoading ? (
        <Center flex={1}>
          <Spinner size="large" color="$primary800" />
        </Center>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Center mt="$20">
              <VStack space="md" alignItems="center">
                <MaterialCommunityIcons name="history" size={64} color="#ccc" />
                <Text color="$text400">No sales recorded yet.</Text>
              </VStack>
            </Center>
          }
        />
      )}
    </Box>
  );
};

export default SaleHistoryScreen;
