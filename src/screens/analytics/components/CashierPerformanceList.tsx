import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Center,
  Divider,
  Icon,
} from '@gluestack-ui/themed';
import { User } from 'lucide-react-native';
import { CashierPerformance } from '../../../repositories/AnalyticsRepository';

interface Props {
  performance: CashierPerformance[];
  currency: string;
}

const CashierPerformanceList: React.FC<Props> = ({ performance, currency }) => {
  return (
    <VStack space="md">
      <Heading size="sm" color="$text900" px="$1">EMPLOYEE CONTRIBUTIONS</Heading>
      <Box bg="$white" rounded="$2xl" borderWidth={1} borderColor="$borderLight" overflow="hidden">
        <VStack>
          {performance.length > 0 ? performance.map((c, i) => (
            <React.Fragment key={i}>
              <HStack p="$4" justifyContent="space-between" alignItems="center">
                <HStack space="md" alignItems="center" flex={1}>
                  <Center w={40} h={40} bg="$backgroundLight100" rounded="$full">
                    <Icon as={User} color="$text500" />
                  </Center>
                  <VStack space="xs">
                    <Text size="sm" fontWeight="$bold" color="$text900">{c.employeeName}</Text>
                    <Text size="xs" color="$text500">{c.saleCount} transactions</Text>
                  </VStack>
                </HStack>
                <Text size="md" fontWeight="$bold" color="$primary800">{currency}{c.totalRevenue.toFixed(2)}</Text>
              </HStack>
              {i < performance.length - 1 && <Divider />}
            </React.Fragment>
          )) : (
            <Center p="$10">
              <Text size="sm" color="$text400">No employee data available</Text>
            </Center>
          )}
        </VStack>
      </Box>
    </VStack>
  );
};

export default CashierPerformanceList;
