import React from 'react';
import { StatusBar, ScrollView } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Pressable,
  Center,
  ChevronRightIcon,
  Badge,
  BadgeText,
  BadgeIcon,
  Spinner,
} from '@gluestack-ui/themed';
import { Appbar } from 'react-native-paper';
import { RefreshCw, User, AlertTriangle } from 'lucide-react-native';
import { useDashboard } from '../../hooks/useDashboard';
import { SyncStatus } from '../../sync/SyncManager';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import AppIcon, { IconName } from '../../components/common/AppIcon';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import { platformShadow } from '../../utils/platformStyles';

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
  const { syncStatus, lowStockCount, revenue, currency, lastSynced, triggerSync } = useDashboard(shopId);

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
      onPress: () => console.log('Navigate to Customers'),
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
      onPress: () => console.log('Navigate to Suppliers'),
    },
  ];

  const renderActionItem = (item: DashboardItem) => {
    if (item.roleRequired && !item.roleRequired.includes(userRole)) return null;

    return (
      <Pressable
        key={item.id}
        onPress={item.onPress}
        flex={1}
        m="$2"
        alignItems="center"
        sx={{ ':active': { transform: [{ scale: 0.95 }] } }}
      >
        <Center
          w={64}
          h={64}
          rounded="$2xl"
          bg="$white"
          style={{ ...platformShadow({ offsetY: 8, radius: 18, color: 'rgba(0,0,0,0.05)' }) }}
          mb="$2"
        >
          <AppIcon name={item.icon} size={28} color={item.color} />
          {item.id === 'inventory' && lowStockCount > 0 && (
            <Box position="absolute" top={-4} right={-4}>
              <Badge size="md" variant="solid" action="error" rounded="$full">
                <BadgeText>{lowStockCount}</BadgeText>
              </Badge>
            </Box>
          )}
        </Center>
        <Text size="xs" fontWeight="$bold" color="$text900" textAlign="center">{item.title}</Text>
      </Pressable>
    );
  };

  return (
    <ScreenWrapper withHeader>
      <StatusBar barStyle="dark-content" backgroundColor="#F3ECFF" />

      {/* Modern Minimalist Header */}
      <Box px="$2" pt="$2" pb="$6">
        <HStack justifyContent="space-between" alignItems="center">
          <VStack>
            <Text size="sm" color="$text500" fontWeight="$medium">Welcome,</Text>
            <Heading size="xl" color="$text900" fontWeight="$black">
              {userRole === 'OWNER' ? 'Shop Owner' : 'Staff Member'}
            </Heading>
          </VStack>
          <HStack space="sm">
            {syncStatus === SyncStatus.Syncing ? (
              <Spinner color="$primary600" size="small" />
            ) : (
              <Pressable onPress={triggerSync} p="$2" bg="$white" rounded="$full">
                <Icon
                  as={syncStatus === SyncStatus.Error ? AlertTriangle : RefreshCw}
                  color="$text500"
                  size="sm"
                />
              </Pressable>
            )}
            <Pressable onPress={() => {}} p="$2" bg="$white" rounded="$full">
              <Icon as={User} color="$text500" size="md" />
            </Pressable>
          </HStack>
        </HStack>
      </Box>

      {/* Vibrant Hero Card */}
      <Box
        bg="$primary600"
        rounded="$3xl"
        p="$6"
        mb="$8"
        style={{
          background: 'linear-gradient(135deg, #6E3BE6 0%, #8956FF 100%)',
          ...platformShadow({ offsetY: 18, radius: 26, color: 'rgba(110,59,230,0.18)' }),
        }}
      >
        <VStack space="md">
          <HStack justifyContent="space-between" alignItems="flex-start">
            <VStack>
              <Text color="white" opacity={0.8} size="sm" fontWeight="$medium">Today's Revenue</Text>
              <Heading color="white" size="2xl" fontWeight="$black">{currency}{revenue.toFixed(2)}</Heading>
            </VStack>
            <Box bg="rgba(255,255,255,0.2)" p="$2" rounded="$lg">
              <AppIcon name="chart" color="white" size={20} />
            </Box>
          </HStack>
          <HStack justifyContent="space-between" alignItems="center" mt="$4">
            <VStack>
               <Text color="white" size="xs" opacity={0.7}>Shop ID: {shopId}</Text>
               {lastSynced > 0 && (
                 <Text color="white" size="xs" opacity={0.7}>
                   Synced: {new Date(lastSynced).toLocaleTimeString()}
                 </Text>
               )}
            </VStack>
            <Badge action="success" variant="solid" rounded="$full" bg="rgba(255,255,255,0.2)">
              <BadgeText color="white" size="xs">Active</BadgeText>
            </Badge>
          </HStack>
        </VStack>
      </Box>

      {/* Actions Grid */}
      <VStack space="xl">
        <HStack justifyContent="space-between" alignItems="center" px="$1">
          <Heading size="md" color="$text900">Services</Heading>
          <Pressable><Text size="xs" color="$primary600" fontWeight="$bold">View All</Text></Pressable>
        </HStack>

        {/* Render primary actions in rows of 3 */}
        <VStack space="md">
           <HStack space="md">
             {primaryActions.slice(0, 3).map(renderActionItem)}
           </HStack>
           <HStack space="md">
             {primaryActions.slice(3, 6).map(renderActionItem)}
           </HStack>
        </VStack>
      </VStack>

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
