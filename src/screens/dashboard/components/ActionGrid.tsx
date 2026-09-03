import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Pressable,
  Center,
  Badge,
  BadgeText,
} from '@gluestack-ui/themed';
import AppIcon, { IconName } from '../../../components/common/AppIcon';
import { platformShadow } from '../../../utils/platformStyles';

export interface DashboardItem {
  id: string;
  title: string;
  icon: IconName;
  color: string;
  description: string;
  onPress: () => void;
  roleRequired?: string[];
}

interface Props {
  actions: DashboardItem[];
  userRole: string;
  lowStockCount: number;
}

const ActionGrid: React.FC<Props> = ({ actions, userRole, lowStockCount }) => {
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
    <VStack space="xl">
      <HStack justifyContent="space-between" alignItems="center" px="$1">
        <Heading size="md" color="$text900">Services</Heading>
        <Pressable><Text size="xs" color="$primary600" fontWeight="$bold">View All</Text></Pressable>
      </HStack>

      <VStack space="md">
         <HStack space="md">
           {actions.slice(0, 3).map(renderActionItem)}
         </HStack>
         <HStack space="md">
           {actions.slice(3, 6).map(renderActionItem)}
         </HStack>
      </VStack>
    </VStack>
  );
};

export default ActionGrid;
