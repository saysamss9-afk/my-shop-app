import React from 'react';
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
import { RefreshCw, RotateCcw } from 'lucide-react-native';
import { useSales } from '../../hooks/useSales';
import { Sale } from '../../db/types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const SaleHistoryScreen = ({ route, navigation }: any) => {
  const { shopId } = route.params;
  const { sales, isLoading, revertSale, refreshSales } = useSales(shopId);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderSale = ({ item }: { item: Sale }) => (
    <Box
      bg="$white"
      p="$4"
      rounded="$xl"
      mb="$3"
      borderWidth={1}
      borderColor="$borderLight"
    >
      <HStack space="md" alignItems="center">
        <Center w={48} h={48} rounded="$full" bg="$primary50">
          <MaterialCommunityIcons name="receipt-text-outline" size={24} color="#1A237E" />
        </Center>
        <VStack flex={1} space="xs">
          <Heading size="xs" color="$text900">
            Transaction #{item.id.slice(-6).toUpperCase()}
          </Heading>
          <Text size="xs" color="$text500">
            {formatDate(item.timestamp)}
          </Text>
          <Text size="xs" fontWeight="$bold" color="$primary800">
            Payment: {item.paymentMethod}
          </Text>
        </VStack>
        <VStack alignItems="flex-end" space="xs">
          <Text size="md" fontWeight="$black" color="$text900">
            ${item.totalAmount.toFixed(2)}
          </Text>
          <Pressable onPress={() => revertSale(item.id)} p="$1">
             <Icon as={RotateCcw} color="$error600" size="sm" />
          </Pressable>
        </VStack>
      </HStack>
    </Box>
  );

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
          <Pressable onPress={refreshSales} p="$3">
            <Icon as={RefreshCw} color="white" size="sm" />
          </Pressable>
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
                    ${sales.reduce((acc, curr) => acc + curr.totalAmount, 0).toFixed(2)}
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
          renderItem={renderSale}
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
