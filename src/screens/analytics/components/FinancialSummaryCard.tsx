import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
} from '@gluestack-ui/themed';
import { getAppShadow } from '../../../utils/platformStyles';
import { useTranslation } from 'react-i18next';

interface Props {
  totalRevenue: number;
  expenses: number;
  netProfit: number;
  currency: string;
}

const FinancialSummaryCard: React.FC<Props> = ({ totalRevenue, expenses, netProfit, currency }) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const flexDir = isRTL ? 'row-reverse' : 'row';

  return (
    <Box bg="$primary800" p="$6" rounded="$3xl" mb="$6" style={{ ...getAppShadow({ offsetY: 10, radius: 20, color: 'rgba(0,0,0,0.18)' }) }}>
      <VStack space="md" alignItems="center" justifyContent="center">
          <Text size="sm" color="rgba(255,255,255,0.7)" fontWeight="$bold" textTransform="uppercase" textAlign="center">Total Revenue</Text>
          <Box w="100%" alignItems="center" justifyContent="center">
            <Heading size="2xl" color="$white" fontWeight="$black" textAlign="center" numberOfLines={1}>
              {currency}{totalRevenue.toFixed(2)}
            </Heading>
          </Box>
      </VStack>

      <Box h={1} bg="rgba(255,255,255,0.1)" my="$6" />

      <HStack space="md" justifyContent="space-between" flexDirection={flexDir}>
          <VStack flex={1} alignItems="center" space="xs">
              <Text size="xs" color="rgba(255,255,255,0.7)" fontWeight="$bold" textAlign="center">EXPENSES</Text>
              <Text size="md" color="$error300" fontWeight="$bold" textAlign="center" numberOfLines={1}>
                -{currency}{expenses.toFixed(2)}
              </Text>
          </VStack>
          <VStack flex={1} alignItems="center" space="xs">
              <Text size="xs" color="rgba(255,255,255,0.7)" fontWeight="$bold" textAlign="center">NET PROFIT</Text>
              <Text size="lg" color={netProfit >= 0 ? '$success400' : '$error400'} fontWeight="$black" textAlign="center" numberOfLines={1}>
                  {currency}{netProfit.toFixed(2)}
              </Text>
          </VStack>
      </HStack>
    </Box>
  );
};

export default FinancialSummaryCard;
