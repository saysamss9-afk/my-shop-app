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
import { RefreshCw, AlertTriangle, LogOut } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SyncStatus } from '../../../sync/SyncManager';
import { getAppShadow } from '../../../utils/platformStyles';
import BranchSwitcher from './BranchSwitcher';
import { useTranslation } from 'react-i18next';

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
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const flexDir = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' : 'left';

  return (
    <Box px="$2" pt={Math.max(insets.top, 10)} pb="$6">
      <HStack justifyContent="space-between" alignItems="center" flexDirection={flexDir}>
        <VStack>
          <HStack space="xs" alignItems="center" flexDirection={flexDir}>
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
          <Heading size="xl" color="$text900" fontWeight="$black" textAlign={textAlign}>
            {shopName}
          </Heading>
          <HStack space="md" alignItems="center" mt="$1" flexDirection={flexDir}>
            <Text size="xs" color="$text500" fontWeight="$medium" textAlign={textAlign}>
                {userRole === 'OWNER' ? 'Shop Owner' : 'Staff Member'}
            </Text>
            {userRole === 'OWNER' && (
                <BranchSwitcher currentShopId={shopId} onSwitch={onSwitchBranch} />
            )}
          </HStack>
        </VStack>
        <HStack space="sm" alignItems="center" flexDirection={flexDir}>
          {syncStatus === SyncStatus.Syncing ? (
            <HStack space="xs" alignItems="center" bg="$primary50" px="$3" py="$1.5" rounded="$full" minHeight={44} flexDirection={flexDir}>
                <Spinner color="$primary600" size="small" />
                <Text size="xs" color="$primary600" fontWeight="$bold">Syncing...</Text>
            </HStack>
          ) : (
            <Pressable
                onPress={onTriggerSync}
                accessibilityLabel="Sync Dashboard"
                accessibilityRole="button"
            >
                <Box
                    bg={syncStatus === SyncStatus.Error ? "$error50" : "$primary600"}
                    px="$4"
                    py="$2.5"
                    minHeight={44}
                    minWidth={44}
                    justifyContent="center"
                    alignItems="center"
                    rounded="$full"
                    style={{ ...getAppShadow({ offsetY: 4, radius: 8, color: 'rgba(110,59,230,0.15)' }) }}
                >
                    <HStack space="xs" alignItems="center" flexDirection={flexDir}>
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
          <Pressable
            onPress={onLogout}
            p="$3"
            minWidth={44}
            minHeight={44}
            justifyContent="center"
            alignItems="center"
            bg="$white"
            rounded="$full"
            accessibilityLabel="Logout account"
            accessibilityRole="button"
            style={{ ...getAppShadow({ offsetY: 2, radius: 6, color: 'rgba(0,0,0,0.05)' }) }}
          >
            <Icon as={LogOut} color="$error600" size="md" />
          </Pressable>
        </HStack>
      </HStack>
    </Box>
  );
};

export default DashboardHeader;
