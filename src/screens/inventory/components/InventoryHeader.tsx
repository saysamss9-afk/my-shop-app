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
} from '@gluestack-ui/themed';
import { Filter, RefreshCw, AlertTriangle } from 'lucide-react-native';
import { Spinner } from '@gluestack-ui/themed';
import { SyncStatus } from '../../../sync/SyncManager';
import { getAppShadow } from '../../../utils/platformStyles';

interface Props {
  onBack: () => void;
  onToggleFilter: () => void;
  showLowStockOnly: boolean;
  shopName?: string;
  syncStatus?: SyncStatus;
  onTriggerSync?: () => void;
}

const InventoryHeader: React.FC<Props> = ({
    onBack,
    onToggleFilter,
    showLowStockOnly,
    shopName,
    syncStatus,
    onTriggerSync
}) => {
  return (
    <Box px="$2" pt="$2" pb="$4">
      <HStack justifyContent="space-between" alignItems="center">
        <HStack space="md" alignItems="center">
          <Pressable onPress={onBack} p="$2" bg="$white" rounded="$full">
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
                    </Pressable>
                )
            )}

            <Pressable
                onPress={onToggleFilter}
                p="$3"
                bg={showLowStockOnly ? '$error50' : '$white'}
                rounded="$full"
            >
                <Icon
                    as={Filter}
                    color={showLowStockOnly ? '$error600' : '$text500'}
                    size="sm"
                />
            </Pressable>
        </HStack>
      </HStack>
    </Box>
  );
};

export default InventoryHeader;
