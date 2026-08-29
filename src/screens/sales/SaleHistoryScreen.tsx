import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import {
  Appbar,
  Card,
  Text,
  List,
  ActivityIndicator,
  IconButton,
  Divider,
  useTheme,
  Surface
} from 'react-native-paper';
import { useSales } from '../../hooks/useSales';
import { Sale } from '../../db/types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const SaleHistoryScreen = ({ route, navigation }: any) => {
  const { shopId } = route.params;
  const { sales, isLoading, revertSale, refreshSales } = useSales(shopId);
  const theme = useTheme();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderSale = ({ item }: { item: Sale }) => (
    <Card style={styles.card} mode="outlined">
      <List.Item
        title={`Transaction #${item.id.slice(-6).toUpperCase()}`}
        titleStyle={styles.saleTitle}
        description={`${formatDate(item.timestamp)}\nPayment: ${item.paymentMethod}`}
        left={props => (
            <View style={styles.iconBox}>
                <MaterialCommunityIcons name="receipt-text-outline" size={24} color={theme.colors.primary} />
            </View>
        )}
        right={props => (
          <View style={styles.rightContent}>
            <Text variant="titleMedium" style={styles.amountText}>${item.totalAmount.toFixed(2)}</Text>
            <IconButton
                icon="backup-restore"
                iconColor={theme.colors.error}
                size={20}
                onPress={() => revertSale(item.id)}
            />
          </View>
        )}
      />
    </Card>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Sales History" titleStyle={styles.appbarTitle} />
        <Appbar.Action icon="refresh" onPress={refreshSales} />
      </Appbar.Header>

      <Surface style={styles.statsBar} elevation={1}>
        <View style={styles.statItem}>
            <Text variant="labelSmall" style={styles.statLabel}>Total Transactions</Text>
            <Text variant="titleLarge" style={styles.statValue}>{sales.length}</Text>
        </View>
        <Divider style={styles.verticalDivider} />
        <View style={styles.statItem}>
            <Text variant="labelSmall" style={styles.statLabel}>Total Volume</Text>
            <Text variant="titleLarge" style={[styles.statValue, { color: theme.colors.primary }]}>
                ${sales.reduce((acc, curr) => acc + curr.totalAmount, 0).toFixed(2)}
            </Text>
        </View>
      </Surface>

      {isLoading ? (
        <ActivityIndicator animating={true} style={styles.loader} />
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => item.id}
          renderItem={renderSale}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="history" size={64} color="#ccc" />
                <Text variant="bodyLarge" style={styles.emptyText}>No sales recorded yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  appbar: {
    backgroundColor: 'white',
    elevation: 0,
  },
  appbarTitle: {
    fontWeight: 'bold',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontWeight: 'bold',
  },
  verticalDivider: {
    width: 1,
    height: '100%',
  },
  list: {
    padding: 16
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'white',
    borderColor: '#eee',
  },
  saleTitle: {
    fontWeight: 'bold',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0EFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontWeight: 'bold',
    color: '#333',
  },
  loader: {
    flex: 1,
    justifyContent: 'center'
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#999',
    marginTop: 16,
  },
});

export default SaleHistoryScreen;
