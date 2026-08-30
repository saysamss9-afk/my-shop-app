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

  const primaryActions: DashboardItem[] = [
    {
      id: 'checkout',
      title: 'POS Checkout',
      description: 'Scan & Payments',
      icon: 'cart',
      color: '$success600',
      onPress: () => navigation.navigate('Checkout', { shopId, employeeId }),
    },
    {
      id: 'inventory',
      title: 'Inventory',
      description: 'Stock Control',
      icon: 'package',
      color: '$warning600',
      onPress: () => navigation.navigate('Inventory', { shopId, userRole }),
    },
    {
      id: 'history',
      title: 'Sales Log',
      description: 'View Receipts',
      icon: 'receipt',
      color: '$info600',
      onPress: () => navigation.navigate('SaleHistory', { shopId }),
    },
    {
      id: 'debt',
      title: 'Customers',
      description: 'Credit Tracking',
      icon: 'wallet',
      color: '$secondary600',
      onPress: () => console.log('Navigate to Customers'),
    },
  ];

  const adminActions: DashboardItem[] = [
    {
      id: 'workers',
      title: 'Staff',
      description: 'Manage Access',
      icon: 'group',
      color: '$blueGray600',
      roleRequired: ['OWNER', 'MANAGER'],
      onPress: () => console.log('Navigate to Employees'),
    },
    {
      id: 'suppliers',
      title: 'Suppliers',
      description: 'Orders & Stocks',
      icon: 'store',
      color: '$warmGray600',
      roleRequired: ['OWNER', 'MANAGER'],
      onPress: () => console.log('Navigate to Suppliers'),
    },
  ];

  const renderActionCard = (item: DashboardItem) => (
    <Pressable
      key={item.id}
      onPress={item.onPress}
      borderRadius={20}
      bg="$white"
      borderWidth={1}
      borderColor="$borderLight"
      sx={{
        ':active': {
          bg: '$backgroundLight50',
          transform: [{ scale: 0.98 }],
        },
      }}
    >
      <Box p="$4">
        <HStack alignItems="center" space="md">
          <Center
            w={48}
            h={48}
            rounded={14}
            bg={item.id === 'inventory' && lowStockCount > 0 ? '$error100' : '$backgroundLight100'}
          >
            <AppIcon name={item.icon} size={24} color={item.color === '$success600' ? '#43A047' : item.color === '$warning600' ? '#FB8C00' : '#1E88E5'} />
            {item.id === 'inventory' && lowStockCount > 0 && (
              <Box position="absolute" top={-4} right={-4}>
                <Badge size="md" variant="solid" action="error" rounded="$full">
                  <BadgeText>{lowStockCount}</BadgeText>
                </Badge>
              </Box>
            )}
          </Center>
          <VStack flex={1}>
            <Heading size="sm" color="$text900">
              {item.title}
            </Heading>
            <Text size="xs" color="$text500">
              {item.description}
            </Text>
          </VStack>
          <Icon as={ChevronRightIcon} color="$text400" />
        </HStack>
      </Box>
    </Pressable>
  );

  return (
    <ScreenWrapper withHeader>
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />

      {/* Modern Solid Header */}
      <Box bg="$primary800" pb="$4">
        <Appbar.Header style={{ backgroundColor: 'transparent', elevation: 0 }}>
          <Appbar.Content
            title="My Store"
            titleStyle={{ color: 'white', fontWeight: '900', fontSize: 22 }}
            subtitle={`${userRole} Mode`}
            subtitleStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, textTransform: 'uppercase' }}
          />
          <HStack alignItems="center" pr="$2">
            {syncStatus === SyncStatus.Syncing ? (
              <Spinner color="white" size="small" />
            ) : (
              <Pressable onPress={triggerSync} p="$2">
                <Icon
                  as={syncStatus === SyncStatus.Error ? AlertTriangle : RefreshCw}
                  color="white"
                  size="sm"
                />
              </Pressable>
            )}
            <Pressable onPress={() => {}} p="$2">
              <Icon as={User} color="white" size="md" />
            </Pressable>
          </HStack>
        </Appbar.Header>
      </Box>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Box p="$5">
          {/* Quick Stats Row */}
          <HStack space="md" mb="$6">
            <Box flex={1} bg="$backgroundLight50" p="$3" rounded={16} borderWidth={1} borderColor="$borderLight">
              <HStack space="xs" alignItems="center">
                <AppIcon name="receipt" size={14} color="#666" />
                <Text size="xs" fontWeight="$bold" color="$text600">
                  Today: $0.00
                </Text>
              </HStack>
            </Box>
            <Box
              flex={1}
              bg={lowStockCount > 0 ? '$error600' : '$backgroundLight50'}
              p="$3"
              rounded={16}
              borderWidth={1}
              borderColor={lowStockCount > 0 ? '$error600' : '$borderLight'}
            >
              <HStack space="xs" alignItems="center">
                <AppIcon name="package" size={14} color={lowStockCount > 0 ? 'white' : '#666'} />
                <Text size="xs" fontWeight="$bold" color={lowStockCount > 0 ? 'white' : '$text600'}>
                  {lowStockCount} Low Items
                </Text>
              </HStack>
            </Box>
          </HStack>

          {/* Hero Insight Card */}
          {userRole === 'OWNER' && (
            <Pressable
              onPress={() => navigation.navigate('Analytics', { shopId })}
              mb="$6"
              bg="$white"
              rounded={20}
              p="$4"
              borderWidth={1}
              borderColor="$borderLight"
            >
              <HStack justifyContent="space-between" alignItems="center">
                <VStack space="xs">
                  <Heading size="md" color="$primary800">
                    Business Insights
                  </Heading>
                  <Text size="sm" color="$text500">
                    Review your performance reports
                  </Text>
                </VStack>
                <Center w={40} h={40} bg="$primary800" rounded="$full">
                  <AppIcon name="chart" size={20} color="white" />
                </Center>
              </HStack>
            </Pressable>
          )}

          {/* Grid Layout */}
          <VStack space="lg">
            <VStack space="xs">
              <Text size="xs" fontWeight="$bold" color="$text400" letterSpacing={1.5}>
                DAILY OPERATIONS
              </Text>
              <VStack space="md">{primaryActions.map(renderActionCard)}</VStack>
            </VStack>

            {(userRole === 'OWNER' || userRole === 'MANAGER') && (
              <VStack space="xs" mt="$4">
                <Text size="xs" fontWeight="$bold" color="$text400" letterSpacing={1.5}>
                  ADMINISTRATIVE
                </Text>
                <VStack space="md">{adminActions.map(renderActionCard)}</VStack>
              </VStack>
            )}
          </VStack>

          {/* Logout Section */}
          <Center mt="$10" mb="$5">
            <Pressable onPress={() => navigation.replace('Landing')}>
              <Text size="sm" color="$text400" fontWeight="$bold">
                Switch Account
              </Text>
            </Pressable>
          </Center>
        </Box>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default DashboardScreen;
