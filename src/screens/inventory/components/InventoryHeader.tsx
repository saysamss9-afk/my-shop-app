import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Heading,
  Text,
  Icon,
  Pressable,
  ArrowLeftIcon,
  AddIcon,
} from '@gluestack-ui/themed';
import { Filter, RefreshCw, AlertTriangle, Plus } from 'lucide-react-native';
import { Spinner } from '@gluestack-ui/themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SyncStatus } from '../../../sync/SyncManager';
import { getAppShadow } from '../../../utils/platformStyles';

interface Props {
  onBack: () => void;
  onToggleFilter: () => void;
  showLowStockOnly: boolean;
  shopName?: string;
  syncStatus?: SyncStatus;
  onTriggerSync?: () => void;
  onAdd?: () => void;
  userRole?: string;
}

const InventoryHeader: React.FC<Props> = ({
    onBack,
    onToggleFilter,
    showLowStockOnly,
    shopName,
    syncStatus,
    onTriggerSync,
    onAdd,
    userRole
}) => {
  const insets = useSafeAreaInsets();
  const canAdd = userRole === 'OWNER' || userRole === 'MANAGER' || userRole === 'SALES';
  return (
    <Box px="$2" pt={Math.max(insets.top, 10)} pb="$4">
      <HStack justifyContent="space-between" alignItems="center">
        <HStack space="md" alignItems="center">
          <Pressable onPress={onBack} p="$2" bg="$backgroundLight50" rounded="$full">
            <Icon as={ArrowLeftIcon} color="$text900" />
          </Pressable>
          <VStack>
            <Heading size="lg" color="$text900" fontWeight="$black">
                {shopName || 'Inventory'}
            </Heading>
            <Text size="xs" color="$text500">
                {shopName ? 'Inventory Management' : 'Manage your shop products'}
            </Text>
          </VStack>
        </HStack>

        <HStack space="sm" alignItems="center">
            {onTriggerSync && (
                syncStatus === SyncStatus.Syncing ? (
                    <HStack space="xs" alignItems="center" bg="$primary50" px="$3" py="$1.5" rounded="$full">
                        <Spinner color="$primary600" size="small" />
                        <Text size="xs" color="$primary600" fontWeight="$bold">Syncing...</Text>
                    </HStack>
                ) : (
                    <Pressable
                        onPress={onTriggerSync}
                        bg={syncStatus === SyncStatus.Error ? "$error50" : "$primary600"}
                        px="$4"
                        py="$2"
                        rounded="$full"
                        style={{ ...getAppShadow({ offsetY: 4, radius: 8, color: 'rgba(0,0,0,0.1)' }) }}
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
                    </Pressable>
                )
            )}

            <Pressable
                onPress={onToggleFilter}
                p="$3"
                bg={showLowStockOnly ? '$error50' : '$backgroundLight50'}
                rounded="$full"
                style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.05)' }) }}
            >
                <Icon
                    as={Filter}
                    color={showLowStockOnly ? '$error600' : '$text500'}
                    size="sm"
                />
            </Pressable>

            {onAdd && canAdd && (
                <Pressable
                    onPress={onAdd}
                    p="$3"
                    bg="$primary600"
                    rounded="$full"
                    style={{ ...getAppShadow({ offsetY: 4, radius: 10, color: 'rgba(0,0,0,0.15)' }) }}
                >
                    <Icon as={Plus} color="white" size="sm" />
                </Pressable>
            )}
        </HStack>
      </HStack>
    </Box>
  );
};

export default InventoryHeader;
