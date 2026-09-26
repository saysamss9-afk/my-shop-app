import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Heading,
  Text,
  Icon,
  Pressable,
} from '@gluestack-ui/themed';
import { Filter, RefreshCw, AlertTriangle, Plus, ArrowLeft } from 'lucide-react-native';
import { Spinner } from '@gluestack-ui/themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SyncStatus } from '../../../sync/SyncManager';
import { getAppShadow } from '../../../utils/platformStyles';
import { useTranslation } from 'react-i18next';

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

const ProductHeader: React.FC<Props> = ({
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
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const flexDir = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' : 'left';
  const canAdd = userRole === 'OWNER' || userRole === 'MANAGER' || userRole === 'SALES';

  return (
    <Box px="$4" pt={Math.max(insets.top, 10)} pb="$4">
      <HStack justifyContent="space-between" alignItems="center" flexDirection={flexDir}>
        <HStack space="md" alignItems="center" flexDirection={flexDir}>
          <Pressable
            onPress={onBack}
            p="$3"
            minWidth={44}
            minHeight={44}
            justifyContent="center"
            alignItems="center"
            bg="$white"
            rounded="$full"
            accessibilityLabel="Go back"
            accessibilityRole="button"
            style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.05)' }) }}
          >
            <ArrowLeft size={22} color="#111827" style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }} />
          </Pressable>
          <VStack>
            <Heading size="lg" color="$text900" fontWeight="$black" textAlign={textAlign}>
                {shopName || 'Products'}
            </Heading>
            <Text size="xs" color="$text500" textAlign={textAlign}>
                {shopName ? 'Product Management' : 'Manage your shop products'}
            </Text>
          </VStack>
        </HStack>

        <HStack space="sm" alignItems="center" flexDirection={flexDir}>
            {onTriggerSync && (
                syncStatus === SyncStatus.Syncing ? (
                    <HStack space="xs" alignItems="center" bg="$primary50" px="$3" py="$1.5" rounded="$full" flexDirection={flexDir}>
                        <Spinner color="$primary600" size="small" />
                        <Text size="xs" color="$primary600" fontWeight="$bold">Syncing...</Text>
                    </HStack>
                ) : (
                    <Pressable
                        onPress={onTriggerSync}
                        bg={syncStatus === SyncStatus.Error ? "$error50" : "$primary600"}
                        px="$3.5"
                        py="$2"
                        rounded="$full"
                        accessibilityLabel={syncStatus === SyncStatus.Error ? 'Retry Sync' : 'Sync Now'}
                        accessibilityRole="button"
                        style={{ ...getAppShadow({ offsetY: 4, radius: 8, color: 'rgba(0,0,0,0.1)' }) }}
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
                    </Pressable>
                )
            )}

            <Pressable
                onPress={onToggleFilter}
                p="$3"
                minWidth={44}
                minHeight={44}
                justifyContent="center"
                alignItems="center"
                bg={showLowStockOnly ? '$error50' : '$backgroundLight50'}
                rounded="$full"
                accessibilityLabel="Filter low stock"
                accessibilityRole="button"
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
                    minWidth={44}
                    minHeight={44}
                    justifyContent="center"
                    alignItems="center"
                    bg="$primary600"
                    rounded="$full"
                    accessibilityLabel="Add Product"
                    accessibilityRole="button"
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

export default ProductHeader;
