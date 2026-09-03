import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
} from '@gluestack-ui/themed';
import { platformShadow } from '../../../utils/platformStyles';

interface Props {
  totalRevenue: number;
  expenses: number;
  netProfit: number;
  currency: string;
}

const FinancialSummaryCard: React.FC<Props> = ({ totalRevenue, expenses, netProfit, currency }) => {
  return (
    <Box bg="$primary800" p="$6" rounded="$3xl" mb="$6" style={{ ...platformShadow({ offsetY: 10, radius: 20, color: 'rgba(0,0,0,0.18)' }) }}>
      <VStack space="md" alignItems="center">
          <Text size="sm" color="rgba(255,255,255,0.7)" fontWeight="$bold" textTransform="uppercase">Total Revenue</Text>
          <Heading size="3xl" color="$white" fontWeight="$black">
            {currency}{totalRevenue.toFixed(2)}
          </Heading>
      </VStack>

      <Box h={1} bg="rgba(255,255,255,0.1)" my="$6" />

      <HStack space="md" justifyContent="space-between">
          <VStack flex={1} alignItems="center" space="xs">
              <Text size="xs" color="rgba(255,255,255,0.7)" fontWeight="$bold">EXPENSES</Text>
              <Text size="md" color="$error300" fontWeight="$bold">-{currency}{expenses.toFixed(2)}</Text>
          </VStack>
          <VStack flex={1} alignItems="center" space="xs">
              <Text size="xs" color="rgba(255,255,255,0.7)" fontWeight="$bold">NET PROFIT</Text>
              <Text size="lg" color={netProfit >= 0 ? '$success400' : '$error400'} fontWeight="$black">
                  {currency}{netProfit.toFixed(2)}
              </Text>
          </VStack>
      </HStack>
    </Box>
  );
};

export default FinancialSummaryCard;
