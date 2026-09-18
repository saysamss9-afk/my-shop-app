import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  BadgeText,
  Pressable,
} from '@gluestack-ui/themed';
import AppIcon from '../../../components/common/AppIcon';
import { getAppShadow } from '../../../utils/platformStyles';
import { useResponsive } from '../../../hooks/useResponsive';

interface Props {
  shopId: string;
  shopName: string;
  revenue: number;
  currency: string;
  lastSynced: number;
  userRole?: string;
  onUpgradePress?: () => void;
}

const RevenueHeroCard: React.FC<Props> = ({ shopId, shopName, revenue, currency, lastSynced, userRole, onUpgradePress }) => {
  const { isLandscape, isTablet } = useResponsive();

  const isWide = isTablet && isLandscape;

  return (
    <Box
      bg="$primary600"
      rounded="$3xl"
      p={isWide ? "$8" : "$6"}
      mb="$8"
      style={{
        background: 'linear-gradient(135deg, #6E3BE6 0%, #8956FF 100%)',
        ...getAppShadow({ offsetY: 18, radius: 26, color: 'rgba(110,59,230,0.18)' }),
      } as any}
    >
      <VStack space="md">
        <HStack justifyContent="space-between" alignItems={isWide ? "center" : "flex-start"}>
          <VStack>
            <Text color="white" opacity={0.8} size={isWide ? "md" : "sm"} fontWeight="$medium">Today's Revenue</Text>
            <Heading color="white" size={isWide ? "3xl" : "2xl"} fontWeight="$black">{currency}{revenue.toFixed(2)}</Heading>
          </VStack>
          <Box bg="rgba(255,255,255,0.2)" p={isWide ? "$4" : "$2"} rounded="$xl">
            <AppIcon name="chart" color="white" size={isWide ? 32 : 20} />
          </Box>
        </HStack>

        <HStack
          justifyContent="space-between"
          alignItems="center"
          mt={isWide ? "$6" : "$4"}
          flexDirection={isWide ? "row" : "row"} // Keep row but maybe wrap if needed, here it's fine
        >
          <VStack>
             <Text color="white" size={isWide ? "sm" : "xs"} opacity={0.7}>Shop: {shopName}</Text>
             <Text color="white" size={isWide ? "sm" : "xs"} opacity={0.7}>Shop ID: {shopId}</Text>
             {lastSynced > 0 && (
               <Text color="white" size={isWide ? "sm" : "xs"} opacity={0.7}>
                 Synced: {new Date(lastSynced).toLocaleTimeString()}
               </Text>
             )}
          </VStack>
          <VStack space="xs" alignItems="flex-end">
            <Badge action="success" variant="solid" rounded="$full" bg="rgba(255,255,255,0.2)" px={isWide ? "$4" : "$2"}>
              <BadgeText color="white" size={isWide ? "sm" : "xs"}>Active</BadgeText>
            </Badge>
            {userRole === 'OWNER' && (
              <Pressable onPress={onUpgradePress}>
                <Badge action="warning" variant="solid" rounded="$lg" bg="$white" px="$3">
                  <BadgeText color="$primary800" size="2xs" fontWeight="$bold">UPGRADE PLAN</BadgeText>
                </Badge>
              </Pressable>
            )}
          </VStack>
        </HStack>
      </VStack>
    </Box>
  );
};

export default RevenueHeroCard;
