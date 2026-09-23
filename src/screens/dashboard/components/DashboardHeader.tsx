import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Heading,
  Icon,
  Pressable,
  Spinner,
} from '@gluestack-ui/themed';
import { RefreshCw, User, AlertTriangle, LogOut } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SyncStatus } from '../../../sync/SyncManager';
import { getAppShadow } from '../../../utils/platformStyles';
import BranchSwitcher from './BranchSwitcher';
import { handleSwitchAccount } from '../switchAccount';

import firebase from '../../../firebase-config';

interface Props {
  userRole: string;
  shopName: string;
  shopId: string;
  shopPlan: string;
  syncStatus: SyncStatus;
  signOut: () => Promise<void>;
  onTriggerSync: () => void;
  onSwitchBranch: (shopId: string, shopName: string) => void;
  onLogout: () => void;
}

const DashboardHeader: React.FC<Props> = ({
  userRole,
  shopName,
  shopId,
  shopPlan,
  syncStatus,
  signOut,
  onTriggerSync,
  onSwitchBranch,
  onLogout
}) => {
  const insets = useSafeAreaInsets();
  return (
    <Box px="$2" pt={Math.max(insets.top, 10)} pb="$6">
      <HStack justifyContent="space-between" alignItems="center">
        <VStack>
          <HStack space="xs" alignItems="center">
            <Text size="sm" color="$text500" fontWeight="$medium">Welcome,</Text>
            {shopPlan === 'PREMIUM' && (
                <Box bg="$amber100" px="$2" py="$0.5" rounded="$md">
                    <Text size="2xs" color="$amber700" fontWeight="$bold">PREMIUM</Text>
                </Box>
            )}
            {shopPlan === 'BUSINESS' && (
                <Box bg="$purple100" px="$2" py="$0.5" rounded="$md">
                    <Text size="2xs" color="$purple700" fontWeight="$bold">BUSINESS</Text>
                </Box>
            )}
            {shopPlan === 'STARTER' && (
                <Box bg="$blue100" px="$2" py="$0.5" rounded="$md">
                    <Text size="2xs" color="$blue700" fontWeight="$bold">STARTER</Text>
                </Box>
            )}
          </HStack>
          <Heading size="xl" color="$text900" fontWeight="$black">
            {shopName}
          </Heading>
          <HStack space="md" alignItems="center" mt="$1">
            <Text size="xs" color="$text500" fontWeight="$medium">
                {userRole === 'OWNER' ? 'Shop Owner' : 'Staff Member'}
            </Text>
            {userRole === 'OWNER' && (
                <BranchSwitcher currentShopId={shopId} onSwitch={onSwitchBranch} />
            )}
          </HStack>
        </VStack>
        <HStack space="sm" alignItems="center">
          {syncStatus === SyncStatus.Syncing ? (
            <HStack space="xs" alignItems="center" bg="$primary50" px="$3" py="$1.5" rounded="$full">
                <Spinner color="$primary600" size="small" />
                <Text size="xs" color="$primary600" fontWeight="$bold">Syncing...</Text>
            </HStack>
          ) : (
            <Pressable
                onPress={onTriggerSync}
            >
                <Box
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
                            {syncStatus === SyncStatus.Error ? 'Retry Sync' : 'Sync Now'}
                        </Text>
                    </HStack>
                </Box>
            </Pressable>
          )}
          <Pressable onPress={onLogout}>
            <Box p="$2" bg="$white" rounded="$full">
              <Icon as={LogOut} color="$error600" size="md" />
            </Box>
          </Pressable>
        </HStack>
      </HStack>
    </Box>
  );
};

export default DashboardHeader;
