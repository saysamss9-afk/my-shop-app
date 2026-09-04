import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  BadgeText,
} from '@gluestack-ui/themed';
import AppIcon from '../../../components/common/AppIcon';
import { getAppShadow } from '../../../utils/platformStyles';

interface Props {
  shopId: string;
  shopName: string;
  revenue: number;
  currency: string;
  lastSynced: number;
}

const RevenueHeroCard: React.FC<Props> = ({ shopId, shopName, revenue, currency, lastSynced }) => {
  return (
    <Box
      bg="$primary600"
      rounded="$3xl"
      p="$6"
      mb="$8"
      style={{
        background: 'linear-gradient(135deg, #6E3BE6 0%, #8956FF 100%)',
        ...getAppShadow({ offsetY: 18, radius: 26, color: 'rgba(110,59,230,0.18)' }),
      }}
    >
      <VStack space="md">
        <HStack justifyContent="space-between" alignItems="flex-start">
          <VStack>
            <Text color="white" opacity={0.8} size="sm" fontWeight="$medium">Today's Revenue</Text>
            <Heading color="white" size="2xl" fontWeight="$black">{currency}{revenue.toFixed(2)}</Heading>
          </VStack>
          <Box bg="rgba(255,255,255,0.2)" p="$2" rounded="$lg">
            <AppIcon name="chart" color="white" size={20} />
          </Box>
        </HStack>
        <HStack justifyContent="space-between" alignItems="center" mt="$4">
          <VStack>
             <Text color="white" size="xs" opacity={0.7}>Shop: {shopName}</Text>
             <Text color="white" size="xs" opacity={0.7}>Shop ID: {shopId}</Text>
             {lastSynced > 0 && (
               <Text color="white" size="xs" opacity={0.7}>
                 Synced: {new Date(lastSynced).toLocaleTimeString()}
               </Text>
             )}
          </VStack>
          <Badge action="success" variant="solid" rounded="$full" bg="rgba(255,255,255,0.2)">
            <BadgeText color="white" size="xs">Active</BadgeText>
          </Badge>
        </HStack>
      </VStack>
    </Box>
  );
};

export default RevenueHeroCard;
