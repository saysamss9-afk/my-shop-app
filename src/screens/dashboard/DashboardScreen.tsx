import React from 'react';
import { StatusBar } from 'react-native';
import {
  Box,
  Text,
  Pressable,
  Center,
} from '@gluestack-ui/themed';
import { useDashboard } from '../../hooks/useDashboard';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import { platformShadow } from '../../utils/platformStyles';

// Sub-components
import DashboardHeader from './components/DashboardHeader';
import RevenueHeroCard from './components/RevenueHeroCard';
import ActionGrid, { DashboardItem } from './components/ActionGrid';

type Props = StackScreenProps<RootStackParamList, 'Dashboard'>;

const DashboardScreen: React.FC<Props> = ({ route, navigation }) => {
  const { shopId, employeeId, userRole, shopName: initialShopName } = route.params;
  const { syncStatus, lowStockCount, revenue, currency, shopName: fetchedShopName, lastSynced, triggerSync } = useDashboard(shopId);
  const displayShopName = fetchedShopName || initialShopName || 'Your Shop';

  const primaryActions: DashboardItem[] = [
    {
      id: 'checkout',
      title: 'Checkout',
      description: 'Sales',
      icon: 'cart',
      color: '#6E3BE6',
      onPress: () => navigation.navigate('Checkout', { shopId, employeeId }),
    },
    {
      id: 'inventory',
      title: 'Inventory',
      description: 'Stock',
      icon: 'package',
      color: '#FF4081',
      onPress: () => navigation.navigate('Inventory', { shopId, userRole }),
    },
    {
      id: 'history',
      title: 'Sales Log',
      description: 'Receipts',
      icon: 'receipt',
      color: '#00E5FF',
      onPress: () => navigation.navigate('SaleHistory', { shopId }),
    },
    {
      id: 'debt',
      title: 'Customers',
      description: 'Credit',
      icon: 'wallet',
      color: '#FB8C00',
      onPress: () => navigation.navigate('Customers', { shopId }),
    },
    {
      id: 'workers',
      title: 'Staff',
      description: 'Access',
      icon: 'group',
      color: '#43A047',
      roleRequired: ['OWNER', 'MANAGER'],
      onPress: () => navigation.navigate('StaffManagement', { shopId }),
    },
    {
      id: 'suppliers',
      title: 'Suppliers',
      description: 'Orders',
      icon: 'store',
      color: '#1E88E5',
      roleRequired: ['OWNER', 'MANAGER'],
      onPress: () => navigation.navigate('Suppliers', { shopId }),
    },
  ];

  return (
    <ScreenWrapper withHeader>
      <StatusBar barStyle="dark-content" backgroundColor="#F3ECFF" />

      <DashboardHeader
        userRole={userRole}
        shopName={displayShopName}
        syncStatus={syncStatus}
        onTriggerSync={triggerSync}
      />

      <RevenueHeroCard
        shopId={shopId}
        shopName={displayShopName}
        revenue={revenue}
        currency={currency}
        lastSynced={lastSynced}
      />

      <ActionGrid
        actions={primaryActions}
        userRole={userRole}
        lowStockCount={lowStockCount}
      />

      {/* Bottom Switch Account */}
      <Center mt="$10" mb="$4">
        <Pressable
          onPress={() => navigation.replace('Landing')}
          bg="$white"
          px="$6"
          py="$2"
          rounded="$full"
          style={{ ...platformShadow({ offsetY: 4, radius: 12, color: 'rgba(0,0,0,0.05)' }) }}
        >
          <Text size="xs" color="$text400" fontWeight="$bold">Switch Account</Text>
        </Pressable>
      </Center>
    </ScreenWrapper>
  );
};

export default DashboardScreen;
