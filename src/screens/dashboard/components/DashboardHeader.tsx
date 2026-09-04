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
        <HStack space="sm">
          {syncStatus === SyncStatus.Syncing ? (
            <Spinner color="$primary600" size="small" />
          ) : (
            <Pressable onPress={onTriggerSync} p="$2" bg="$white" rounded="$full">
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
  );
};

export default DashboardHeader;
