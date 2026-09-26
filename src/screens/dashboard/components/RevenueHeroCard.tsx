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
import { useTranslation } from 'react-i18next';

interface Props {
  shopId: string;
  shopCode?: string | null;
  shopName: string;
  revenue: number;
  currency: string;
  lastSynced: number;
  userRole?: string;
  onUpgradePress?: () => void;
}

const RevenueHeroCard: React.FC<Props> = ({ shopId, shopCode, shopName, revenue, currency, lastSynced, userRole, onUpgradePress }) => {
  const { isLandscape, isTablet } = useResponsive();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const flexDir = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' : 'left';

  const isWide = isTablet && isLandscape;

  return (
    <Box
      bg="$primary600"
      rounded="$3xl"
      p={isWide ? "$8" : "$6"}
      mb="$8"
      style={{
        backgroundColor: '#E65100',
        background: 'linear-gradient(135deg, #E65100 0%, #FF8F00 100%)',
        ...getAppShadow({ offsetY: 18, radius: 26, color: 'rgba(230,81,0,0.22)' }),
      } as any}
    >
      <VStack space="md">
        <HStack justifyContent="space-between" alignItems={isWide ? "center" : "flex-start"} flexDirection={flexDir}>
          <VStack flex={1} mr={isRTL ? "$0" : "$2"} ml={isRTL ? "$2" : "$0"}>
            <Text color="white" opacity={0.8} size={isWide ? "md" : "sm"} fontWeight="$medium" textAlign={textAlign}>Today's Revenue</Text>
            <Heading color="white" size={isWide ? "3xl" : "2xl"} fontWeight="$black" textAlign={textAlign} numberOfLines={1}>
              {currency}{revenue.toFixed(2)}
            </Heading>
          </VStack>
          <Box bg="rgba(255,255,255,0.2)" p={isWide ? "$4" : "$2"} rounded="$xl">
            <AppIcon name="chart" color="white" size={isWide ? 32 : 20} />
          </Box>
        </HStack>

        <HStack
          justifyContent="space-between"
          alignItems="center"
          mt={isWide ? "$6" : "$4"}
          flexDirection={flexDir}
        >
          <VStack flex={1} mr={isRTL ? "$0" : "$2"} ml={isRTL ? "$2" : "$0"}>
             <Text color="white" size={isWide ? "sm" : "xs"} opacity={0.7} textAlign={textAlign}>Shop: {shopName}</Text>
             <Text color="white" size={isWide ? "sm" : "xs"} opacity={0.7} textAlign={textAlign}>
               {shopCode ? `Branch Code: ${shopCode}` : `Shop ID: ${shopId}`}
             </Text>
             {lastSynced > 0 && (
               <Text color="white" size={isWide ? "sm" : "xs"} opacity={0.7} textAlign={textAlign}>
                 Synced: {new Date(lastSynced).toLocaleTimeString()}
               </Text>
             )}
          </VStack>
          <VStack space="xs" alignItems={isRTL ? "flex-start" : "flex-end"}>
            <Badge action="success" variant="solid" rounded="$full" bg="rgba(255,255,255,0.2)" px={isWide ? "$4" : "$2"}>
              <BadgeText color="white" size={isWide ? "sm" : "xs"}>Active</BadgeText>
            </Badge>
            {userRole === 'OWNER' && (
              <Pressable
                onPress={onUpgradePress}
                accessibilityLabel="Upgrade Plan"
                accessibilityRole="button"
              >
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
