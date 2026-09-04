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
import { RefreshCw, User, AlertTriangle } from 'lucide-react-native';
import { SyncStatus } from '../../../sync/SyncManager';
import { getAppShadow } from '../../../utils/platformStyles';

interface Props {
  userRole: string;
  shopName: string;
  syncStatus: SyncStatus;
  onTriggerSync: () => void;
}

const DashboardHeader: React.FC<Props> = ({ userRole, shopName, syncStatus, onTriggerSync }) => {
  return (
    <Box px="$2" pt="$2" pb="$6">
      <HStack justifyContent="space-between" alignItems="center">
        <VStack>
          <Text size="sm" color="$text500" fontWeight="$medium">Welcome,</Text>
          <Heading size="xl" color="$text900" fontWeight="$black">
            {shopName}
          </Heading>
          <Text size="xs" color="$text500" fontWeight="$medium">
            {userRole === 'OWNER' ? 'Shop Owner' : 'Staff Member'}
          </Text>
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
          )}
          <Pressable onPress={() => {}} p="$2" bg="$white" rounded="$full">
            <Icon as={User} color="$text500" size="md" />
          </Pressable>
        </HStack>
      </HStack>
    </Box>
  );
};

export default DashboardHeader;
