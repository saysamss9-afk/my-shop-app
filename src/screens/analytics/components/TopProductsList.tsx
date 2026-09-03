import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Center,
  Divider,
} from '@gluestack-ui/themed';
import { TopProduct } from '../../../repositories/AnalyticsRepository';

interface Props {
  products: TopProduct[];
  currency: string;
}

const AvatarText = ({ index, name }: any) => {
    const bgColors = ['$blue100', '$green100', '$amber100', '$purple100'];
    return (
        <Center
          w={40}
          h={40}
          rounded="$full"
          bg={bgColors[index % 4]}
        >
            <Text size="sm" fontWeight="$bold" color="$primary800">{name.charAt(0)}</Text>
        </Center>
    );
};

const TopProductsList: React.FC<Props> = ({ products, currency }) => {
  return (
    <VStack space="md">
      <Heading size="sm" color="$text900" px="$1">TOP PERFORMING PRODUCTS</Heading>
      <Box bg="$white" rounded="$2xl" borderWidth={1} borderColor="$borderLight" overflow="hidden">
        <VStack>
          {products.length > 0 ? products.map((p, i) => (
            <React.Fragment key={i}>
              <HStack p="$4" justifyContent="space-between" alignItems="center">
                <HStack space="md" alignItems="center" flex={1}>
                  <AvatarText index={i} name={p.name} />
                  <VStack space="xs">
                    <Text size="sm" fontWeight="$bold" color="$text900">{p.name}</Text>
                    <Text size="xs" color="$text500">{p.totalQuantity} units sold</Text>
                  </VStack>
                </HStack>
                <Text size="md" fontWeight="$bold" color="$primary800">{currency}{p.totalRevenue.toFixed(2)}</Text>
              </HStack>
              {i < products.length - 1 && <Divider />}
            </React.Fragment>
          )) : (
            <Center p="$10">
              <Text size="sm" color="$text400">No product data available</Text>
            </Center>
          )}
        </VStack>
      </Box>
    </VStack>
  );
};

export default TopProductsList;
