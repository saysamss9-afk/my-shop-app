import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Appbar,
  Card,
  Text,
  ActivityIndicator,
  List,
  Divider,
  useTheme,
  Button,
  Surface
} from 'react-native-paper';
import { useAnalytics } from '../../hooks/useAnalytics';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const AvatarText = ({ index, name, theme }: any) => (
    <View style={[styles.avatar, { backgroundColor: ['#E3F2FD', '#E8F5E9', '#FFF3E0', '#F3E5F5'][index % 4] }]}>
        <Text variant="titleSmall" style={{ color: theme.colors.primary }}>{name.charAt(0)}</Text>
    </View>
);

const AnalyticsScreen = ({ route, navigation }: any) => {
  const { shopId } = route.params;
  const {
    summary,
    expenses,
    topProducts,
    cashierPerformance,
    isLoading,
    error,
    loadAnalytics
  } = useAnalytics(shopId);

  const theme = useTheme();
  const netProfit = (summary?.totalProfit || 0) - expenses;

  const handleRefresh = () => {
    const now = Date.now();
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    loadAnalytics(startOfDay, now);
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Business Intelligence" titleStyle={styles.appbarTitle} />
        <Appbar.Action icon="refresh" onPress={handleRefresh} />
      </Appbar.Header>

      {isLoading ? (
        <ActivityIndicator animating={true} style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Main Financial Surface */}
          <Surface style={styles.mainStats} elevation={2}>
            <View style={styles.revenueBox}>
                <Text variant="labelLarge" style={styles.whiteLabel}>Total Revenue</Text>
                <Text variant="displaySmall" style={styles.revenueText}>
                  ${summary?.totalRevenue.toFixed(2) || '0.00'}
                </Text>
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.profitRow}>
                <View style={styles.profitItem}>
                    <Text variant="labelSmall" style={styles.whiteLabel}>Expenses</Text>
                    <Text variant="titleMedium" style={styles.expenseText}>-${expenses.toFixed(2)}</Text>
                </View>
                <View style={styles.profitItem}>
                    <Text variant="labelSmall" style={styles.whiteLabel}>Net Profit</Text>
                    <Text variant="titleLarge" style={[styles.profitText, { color: netProfit >= 0 ? '#4CAF50' : '#FF5252' }]}>
                        ${netProfit.toFixed(2)}
                    </Text>
                </View>
            </View>
          </Surface>

          <Text variant="titleMedium" style={styles.sectionTitle}>Sales Breakdown</Text>
          <Card style={styles.sectionCard} mode="outlined">
            <Card.Content style={{ padding: 0 }}>
              <List.Item
                title="Gross Profit"
                left={props => <List.Icon {...props} icon="trending-up" color="#4CAF50" />}
                right={() => <Text variant="titleMedium" style={styles.bold}>${summary?.totalProfit.toFixed(2)}</Text>}
              />
              <Divider />
              <List.Item
                title="Operation Costs"
                left={props => <List.Icon {...props} icon="trending-down" color="#FF5252" />}
                right={() => <Text variant="titleMedium" style={styles.bold}>-${expenses.toFixed(2)}</Text>}
              />
            </Card.Content>
          </Card>

          <Text variant="titleMedium" style={styles.sectionTitle}>Top Performing Products</Text>
          <Card style={styles.sectionCard} mode="outlined">
            <Card.Content style={{ padding: 0 }}>
              {topProducts.length > 0 ? topProducts.map((p, i) => (
                <View key={i}>
                    <List.Item
                        title={p.name}
                        titleStyle={{ fontWeight: 'bold' }}
                        description={`${p.totalQuantity} units sold`}
                        left={props => <AvatarText index={i} name={p.name} theme={theme} />}
                        right={() => <Text variant="titleMedium" style={styles.bold}>${p.totalRevenue.toFixed(2)}</Text>}
                    />
                    {i < topProducts.length - 1 && <Divider />}
                </View>
              )) : (
                <Text style={styles.emptyText}>No product data available</Text>
              )}
            </Card.Content>
          </Card>

          <Text variant="titleMedium" style={styles.sectionTitle}>Employee Contributions</Text>
          <Card style={styles.sectionCard} mode="outlined">
            <Card.Content style={{ padding: 0 }}>
              {cashierPerformance.length > 0 ? cashierPerformance.map((c, i) => (
                <View key={i}>
                    <List.Item
                        title={c.employeeName}
                        description={`${c.saleCount} transactions processed`}
                        left={props => <List.Icon {...props} icon="account-tie" />}
                        right={() => <Text variant="titleMedium" style={styles.bold}>${c.totalRevenue.toFixed(2)}</Text>}
                    />
                    {i < cashierPerformance.length - 1 && <Divider />}
                </View>
              )) : (
                <Text style={styles.emptyText}>No employee data available</Text>
              )}
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            style={styles.exportButton}
            icon="file-download-outline"
            onPress={() => console.log('Exporting report...')}
            contentStyle={{ paddingVertical: 8 }}
          >
            Export Full Report (PDF/CSV)
          </Button>
        </ScrollView>
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
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  mainStats: {
    backgroundColor: '#1A237E', // Deep Business Blue
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  revenueBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  whiteLabel: {
    color: 'rgba(255,255,255,0.7)',
  },
  revenueText: {
    color: 'white',
    fontWeight: '900',
  },
  statsDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profitItem: {
    flex: 1,
    alignItems: 'center',
  },
  expenseText: {
    color: '#FF8A80',
    fontWeight: 'bold',
  },
  profitText: {
    fontWeight: 'bold',
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionCard: {
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  bold: {
    fontWeight: 'bold',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loader: {
    flex: 1,
    justifyContent: 'center'
  },
  emptyText: {
    padding: 20,
    textAlign: 'center',
    color: '#999',
  },
  exportButton: {
    marginTop: 8,
    borderRadius: 12,
  }
});

export default AnalyticsScreen;
