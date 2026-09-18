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
import AppIcon from '../../../components/common/AppIcon';
import type { IconName } from '../../../components/common/AppIcon';
import { getAppShadow } from '../../../utils/platformStyles';
import { useResponsive } from '../../../hooks/useResponsive';

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
  const { isTablet, isLandscape } = useResponsive();

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
          w={isTablet ? 80 : 64}
          h={isTablet ? 80 : 64}
          rounded="$2xl"
          bg="$white"
          style={{ ...getAppShadow({ offsetY: 8, radius: 18, color: 'rgba(0,0,0,0.05)' }) }}
          mb="$2"
        >
          <AppIcon name={item.icon} size={isTablet ? 32 : 28} color={item.color} />
          {item.id === 'inventory' && lowStockCount > 0 && (
            <Box position="absolute" top={-4} right={-4}>
              <Badge size="md" variant="solid" action="error" rounded="$full">
                <BadgeText>{lowStockCount}</BadgeText>
              </Badge>
            </Box>
          )}
        </Center>
        <Text size={isTablet ? 'sm' : 'xs'} fontWeight="$bold" color="$text900" textAlign="center">{item.title}</Text>
      </Pressable>
    );
  };

  const visibleActions = actions.filter(item => !item.roleRequired || item.roleRequired.includes(userRole));

  let numColumns = 3;
  if (isTablet) {
    numColumns = isLandscape ? 5 : 4;
  } else if (isLandscape) {
    numColumns = 4;
  }

  const rows = [];
  for (let i = 0; i < visibleActions.length; i += numColumns) {
    rows.push(visibleActions.slice(i, i + numColumns));
  }

  return (
    <VStack space="xl">
      <HStack justifyContent="space-between" alignItems="center" px="$1">
        <Heading size={isTablet ? 'lg' : 'md'} color="$text900">Services</Heading>
        <Pressable><Text size={isTablet ? 'sm' : 'xs'} color="$primary600" fontWeight="$bold">View All</Text></Pressable>
      </HStack>

      <VStack space="md">
        {rows.map((row, rowIndex) => (
          <HStack key={rowIndex} space="md">
            {row.map(renderActionItem)}
            {/* Pad the row if it's not full to maintain grid alignment */}
            {row.length < numColumns && Array(numColumns - row.length).fill(null).map((_, index) => (
              <Box key={`pad-${index}`} flex={1} m="$2" />
            ))}
          </HStack>
        ))}
      </VStack>
    </VStack>
  );
};

export default ActionGrid;
