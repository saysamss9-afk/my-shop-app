import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StatusBar } from 'react-native';
import {
  Box,
  Text,
  Pressable,
  Center,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  Heading,
  ModalCloseButton,
  Icon,
  CloseIcon,
  ModalBody,
  VStack,
  HStack,
  Button,
  ButtonText,
  Divider,
} from '@gluestack-ui/themed';
import { useDashboard } from '../../hooks/useDashboard';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import { getAppShadow } from '../../utils/platformStyles';

// Sub-components
import DashboardHeader from './components/DashboardHeader';
import RevenueHeroCard from './components/RevenueHeroCard';
import ActionGrid from './components/ActionGrid';
import type { DashboardItem } from './components/ActionGrid';

import { useSync } from '../../sync/SyncContext';
import { useAuthContext } from '../../auth/AuthContext';
import { handleSwitchAccount } from './switchAccount';

type Props = StackScreenProps<RootStackParamList, 'Dashboard'>;

const DashboardScreen: React.FC<Props> = ({ route, navigation }) => {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [requestPending, setRequestPending] = useState(false);
  const { shopId, employeeId, userRole, shopName: initialShopName } = route.params;
  const { startRealtimeSync, stopRealtimeSync } = useSync();
  const { signOut } = useAuthContext();
  const {
    syncStatus,
    lowStockCount,
    revenue,
    currency,
    shopName: fetchedShopName,
    shopCode,
    shopPlan,
    lastSynced,
    triggerSync
  } = useDashboard(shopId);

  // Store triggerSync in a ref to break effect dependency cycles
  const triggerSyncRef = useRef(triggerSync);
  useEffect(() => {
    triggerSyncRef.current = triggerSync;
  }, [triggerSync]);

  useEffect(() => {
    // Trigger background sync once when entering dashboard or switching branch
    if (triggerSyncRef.current) {
      triggerSyncRef.current();
    }

    startRealtimeSync(shopId);
    return () => stopRealtimeSync();
  }, [shopId, startRealtimeSync, stopRealtimeSync]);

  const handleSwitchBranch = (newShopId: string, newShopName: string) => {
    navigation.setParams({ shopId: newShopId, shopName: newShopName });
  };

  const displayShopName = fetchedShopName || initialShopName || 'Your Shop';

  const primaryActions: DashboardItem[] = useMemo(() => [
    {
      id: 'checkout',
      title: 'Checkout',
      description: 'Sales',
      icon: 'cart',
      color: '#E65100',
      onPress: () => navigation.navigate('Checkout', { shopId, employeeId }),
    },
    {
      id: 'inventory',
      title: 'Products',
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
      id: 'categories',
      title: 'Categories',
      description: 'Grouping',
      icon: 'layers',
      color: '#9C27B0',
      roleRequired: ['OWNER', 'MANAGER', 'SALES'],
      onPress: () => navigation.navigate('CategoryManagement', { shopId }),
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
    ...(shopPlan === 'PREMIUM' && userRole === 'OWNER' ? [{
      id: 'branches',
      title: 'Branches',
      description: 'Multi-shop',
      icon: 'layers' as const,
      color: '#607D8B',
      roleRequired: ['OWNER'],
      onPress: () => navigation.navigate('BranchManagement', { shopId }),
    }] : []),
    {
      id: 'suppliers',
      title: 'Suppliers',
      description: 'Orders',
      icon: 'store',
      color: '#1E88E5',
      roleRequired: ['OWNER', 'MANAGER'],
      onPress: () => navigation.navigate('Suppliers', { shopId }),
    },
    {
      id: 'daily_report',
      title: 'Daily Items',
      description: 'Report',
      icon: 'list',
      color: '#673AB7',
      roleRequired: ['OWNER', 'MANAGER'],
      onPress: () => navigation.navigate('DailyReport', { shopId }),
    },
    {
      id: 'expenses',
      title: 'Expenses',
      description: 'Spendings',
      icon: 'cash',
      color: '#E53935',
      roleRequired: ['OWNER', 'MANAGER'],
      onPress: () => navigation.navigate('Expenses', { shopId }),
    },
    {
      id: 'audit',
      title: 'Audit P&L',
      description: 'Financials',
      icon: 'trending-up',
      color: '#00C853',
      roleRequired: ['OWNER'],
      onPress: () => navigation.navigate('ProfitLoss', { shopId, userRole }),
    },
    {
      id: 'fast_moving',
      title: 'Top Items',
      description: 'Hot Sellers',
      icon: 'trending-up',
      color: '#FFC107',
      roleRequired: ['OWNER', 'MANAGER'],
      onPress: () => navigation.navigate('Analytics', { shopId }),
    },
  ], [shopId, employeeId, userRole, shopPlan, navigation]);

  return (
    <ScreenWrapper withHeader scrollable>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <DashboardHeader
        userRole={userRole}
        shopName={displayShopName}
        shopId={shopId}
        shopPlan={shopPlan}
        syncStatus={syncStatus}
        signOut={signOut}
        onTriggerSync={triggerSync}
        onSwitchBranch={handleSwitchBranch}
        onLogout={() => handleSwitchAccount({ signOut, reset: navigation.reset })}
      />

      <RevenueHeroCard
        shopId={shopId}
        shopCode={shopCode}
        shopName={displayShopName}
        revenue={revenue}
        currency={currency}
        lastSynced={lastSynced}
        userRole={userRole}
        onUpgradePress={() => setIsUpgradeModalOpen(true)}
      />

      <ActionGrid
        actions={primaryActions}
        userRole={userRole}
        lowStockCount={lowStockCount}
      />

      {/* Bottom Actions */}
      <VStack space="sm" mt="$10" mb="$8" alignItems="center">
        <Pressable
          onPress={() => handleSwitchAccount({ signOut, reset: navigation.reset })}
          bg="$white"
          px="$6"
          py="$2"
          rounded="$full"
          style={{ ...getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(0,0,0,0.05)' }) }}
        >
          <Text size="xs" color="$text400" fontWeight="$bold">Switch Account</Text>
        </Pressable>

        <HStack space="md" alignItems="center">
          <Pressable onPress={() => navigation.navigate('About')}>
            <Text size="xs" color="$primary600" fontWeight="$medium">About</Text>
          </Pressable>
          <Divider orientation="vertical" h={12} />
          <Pressable onPress={() => navigation.navigate('Terms')}>
            <Text size="xs" color="$primary600" fontWeight="$medium">Terms</Text>
          </Pressable>
          <Divider orientation="vertical" h={12} />
          <Pressable onPress={() => navigation.navigate('Privacy')}>
            <Text size="xs" color="$primary600" fontWeight="$medium">Privacy</Text>
          </Pressable>
        </HStack>
      </VStack>

      {/* Upgrade Subscription Plans Modal */}
      <Modal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)}>
        <ModalBackdrop />
        <ModalContent rounded="$3xl" p="$5" w="$full" maxHeight="90%">
          <ModalHeader>
            <Heading size="lg">Change Subscription Plan</Heading>
            <ModalCloseButton>
              <Icon as={CloseIcon} />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <VStack space="md" py="$4">
              <Text size="sm" color="$text600">
                Select a target plan below to submit an upgrade request to the app administration panel.
              </Text>

              {['STARTER', 'BUSINESS', 'PREMIUM'].map((planOption) => {
                if (planOption === shopPlan) return null;
                return (
                  <Pressable
                    key={planOption}
                    onPress={async () => {
                      setRequestPending(true);
                      try {
                        const firebaseModule = require('../../firebase-config').default;
                        await firebaseModule.firestore().collection('plan_upgrade_requests').add({
                          shopId,
                          shopName: displayShopName,
                          currentPlan: shopPlan,
                          requestedPlan: planOption,
                          status: 'PENDING',
                          createdAt: firebaseModule.firestore.FieldValue.serverTimestamp(),
                        });
                        setIsUpgradeModalOpen(false);
                        if (typeof window !== 'undefined') {
                          window.alert(`Plan Change Request submitted successfully! Please wait for administration panel approval.`);
                        }
                      } catch (err: any) {
                        if (typeof window !== 'undefined') window.alert(`Error: ${err.message}`);
                      } finally {
                        setRequestPending(false);
                      }
                    }}
                    p="$4"
                    rounded="$xl"
                    borderWidth={1}
                    borderColor="$borderLight"
                    bg="$backgroundLight50"
                  >
                    <HStack justifyContent="space-between" alignItems="center" space="sm">
                      <VStack flex={1} mr="$2">
                        <Text fontWeight="$bold" color="$text900">{planOption}</Text>
                        <Text size="xs" color="$text500">Submit adjustment notification</Text>
                      </VStack>
                      <Button size="xs" variant="outline" action="primary" pointerEvents="none" flexShrink={0}>
                        <ButtonText>Request</ButtonText>
                      </Button>
                    </HStack>
                  </Pressable>
                );
              })}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </ScreenWrapper>
  );
};

export default DashboardScreen;
