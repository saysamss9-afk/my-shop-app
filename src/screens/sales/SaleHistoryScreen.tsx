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
  ArrowLeftIcon,
} from '@gluestack-ui/themed';
import { RefreshCw, AlertTriangle } from 'lucide-react-native';
import { useSales } from '../../hooks/useSales';
import type { Sale } from '../../db/types';
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
      <StatusBar barStyle="dark-content" backgroundColor="#F3ECFF" />

      {/* Modern Header */}
      <Box px="$4" pt="$2" pb="$4">
        <HStack justifyContent="space-between" alignItems="center">
          <HStack space="md" alignItems="center">
            <Pressable onPress={() => navigation.goBack()} p="$2" bg="$white" rounded="$full" style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.05)' }) }}>
              <Icon as={ArrowLeftIcon} color="$text900" />
            </Pressable>
            <VStack>
              <Heading size="lg" color="$text900" fontWeight="$black">Sales History</Heading>
              <Text size="xs" color="$text500">Track and manage past sales</Text>
            </VStack>
          </HStack>

          <HStack space="sm" alignItems="center">
            {syncStatus === SyncStatus.Syncing ? (
                <HStack space="xs" alignItems="center" bg="$primary50" px="$3" py="$1.5" rounded="$full">
                    <Spinner color="$primary600" size="small" />
                    <Text size="xs" color="$primary600" fontWeight="$bold">Syncing...</Text>
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
                        <Text size="xs" color="$white" fontWeight="$bold">
                            {syncStatus === SyncStatus.Error ? 'Retry' : 'Sync'}
                        </Text>
                    </HStack>
                </Pressable>
            )}
          </HStack>
        </HStack>
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
