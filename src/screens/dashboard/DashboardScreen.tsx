import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Appbar, Text, Badge, useTheme, ActivityIndicator, Surface, TouchableRipple, IconButton } from 'react-native-paper';
import { useDashboard } from '../../hooks/useDashboard';
import { SyncStatus } from '../../sync/SyncManager';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import AppIcon, { IconName } from '../../components/common/AppIcon';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import CustomButton from '../../components/common/CustomButton';

type Props = StackScreenProps<RootStackParamList, 'Dashboard'>;

interface DashboardItem {
  id: string;
  title: string;
  icon: IconName;
  color: string;
  description: string;
  onPress: () => void;
  roleRequired?: string[];
}

const DashboardScreen: React.FC<Props> = ({ route, navigation }) => {
  const { shopId, employeeId, userRole } = route.params;
  const { syncStatus, lowStockCount, triggerSync } = useDashboard(shopId);
  const theme = useTheme();

  const primaryActions: DashboardItem[] = [
    {
      id: 'checkout',
      title: 'POS Checkout',
      description: 'Process sales & payments',
      icon: 'cart',
      color: '#43A047',
      onPress: () => navigation.navigate('Checkout', { shopId, employeeId }),
    },
    {
      id: 'inventory',
      title: 'Inventory',
      description: 'Stock & products management',
      icon: 'package',
      color: '#FB8C00',
      onPress: () => navigation.navigate('Inventory', { shopId, userRole }),
    },
    {
      id: 'history',
      title: 'Sales History',
      description: 'Review past transactions',
      icon: 'receipt',
      color: '#1E88E5',
      onPress: () => navigation.navigate('SaleHistory', { shopId }),
    },
    {
      id: 'debt',
      title: 'Customers',
      description: 'Credit & Debt tracking',
      icon: 'wallet',
      color: '#8E24AA',
      onPress: () => console.log('Navigate to Customers'),
    },
  ];

  const adminActions: DashboardItem[] = [
    {
        id: 'workers',
        title: 'Staff Management',
        description: 'Manage employee access',
        icon: 'group',
        color: '#546E7A',
        roleRequired: ['OWNER', 'MANAGER'],
        onPress: () => console.log('Navigate to Employees'),
      },
      {
        id: 'suppliers',
        title: 'Suppliers',
        description: 'Orders & distributions',
        icon: 'store',
        color: '#6D4C41',
        roleRequired: ['OWNER', 'MANAGER'],
        onPress: () => console.log('Navigate to Suppliers'),
      },
  ];

  const renderActionCard = (item: DashboardItem) => (
    <Surface key={item.id} style={styles.card} elevation={2}>
        <TouchableRipple
            onPress={item.onPress}
            style={styles.ripple}
            rippleColor="rgba(0,0,0,0.05)"
        >
            <View style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                    <AppIcon name={item.icon} size={28} color={item.color} />
                    {item.id === 'inventory' && lowStockCount > 0 && (
                        <Badge style={styles.badge}>{lowStockCount}</Badge>
                    )}
                </View>
                <View style={styles.textContainer}>
                    <Text variant="titleMedium" style={styles.cardTitle}>{item.title}</Text>
                    <Text variant="bodySmall" style={styles.cardDesc}>{item.description}</Text>
                </View>
                <AppIcon name="chevron-right" size={20} color={theme.colors.outline} />
            </View>
        </TouchableRipple>
    </Surface>
  );

  return (
    <ScreenWrapper scrollable withHeader>
      <Surface style={[styles.headerSurface, { backgroundColor: theme.colors.primary }]} elevation={4}>
        <Appbar.Header style={{ backgroundColor: 'transparent' }}>
            <Appbar.Content
                title="My Shop"
                titleStyle={styles.headerTitle}
                subtitle={`Role: ${userRole}`}
                subtitleStyle={styles.headerSubtitle}
            />
            <View style={styles.headerActions}>
                {syncStatus === SyncStatus.Syncing ? (
                    <ActivityIndicator size={20} color="white" />
                ) : (
                    <IconButton
                        icon={syncStatus === SyncStatus.Error ? 'alert-circle' : 'refresh'}
                        iconColor="white"
                        onPress={triggerSync}
                    />
                )}
                <IconButton icon="dots-vertical" iconColor="white" onPress={() => {}} />
            </View>
        </Appbar.Header>

        {userRole === 'OWNER' && (
            <View style={styles.heroContent}>
                <View style={styles.heroTextContainer}>
                    <Text variant="headlineSmall" style={styles.heroTitle}>Grow Your Business</Text>
                    <Text variant="bodyMedium" style={styles.heroSubtitle}>View your real-time performance</Text>
                </View>
                <CustomButton
                    mode="elevated"
                    title="BI Reports"
                    color="white"
                    textColor={theme.colors.primary}
                    onPress={() => navigation.navigate('Analytics', { shopId })}
                    icon="chart-bar"
                    style={styles.heroBtn}
                />
            </View>
        )}
      </Surface>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>Main Operations</Text>
            <Text variant="bodySmall" style={styles.sectionSubtitle}>Daily business tasks</Text>
        </View>

        <View style={styles.grid}>
            {primaryActions.map(renderActionCard)}
        </View>

        {(userRole === 'OWNER' || userRole === 'MANAGER') && (
            <>
                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                    <Text variant="titleLarge" style={styles.sectionTitle}>Administrative</Text>
                    <Text variant="bodySmall" style={styles.sectionSubtitle}>Shop configuration</Text>
                </View>
                <View style={styles.grid}>
                    {adminActions.map(renderActionCard)}
                </View>
            </>
        )}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  headerSurface: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 32,
    paddingTop: 10,
  },
  headerTitle: {
    color: 'white',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroContent: {
    paddingHorizontal: 20,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  heroTitle: {
    color: 'white',
    fontWeight: 'bold',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.8)',
  },
  heroBtn: {
    minWidth: 120,
  },
  content: {
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    opacity: 0.6,
  },
  grid: {
    gap: 12,
  },
  card: {
    borderRadius: 16,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  ripple: {
    padding: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontWeight: '700',
  },
  cardDesc: {
    opacity: 0.7,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
  }
});

export default DashboardScreen;
