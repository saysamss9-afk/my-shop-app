import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Heading,
  Text,
  Icon,
  Pressable,
} from '@gluestack-ui/themed';
import { ArrowLeft } from 'lucide-react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  onBack: () => void;
}

const CheckoutHeader: React.FC<Props> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  return (
    <Box px="$2" pt={Math.max(insets.top, 10)} pb="$4">
      <HStack justifyContent="space-between" alignItems="center">
        <HStack space="md" alignItems="center">
          <Pressable onPress={onBack} p="$2" bg="$white" rounded="$full">
            <Icon as={ArrowLeft} color="$text900" />
          </Pressable>
          <VStack>
            <Heading size="lg" color="$text900" fontWeight="$black">Checkout</Heading>
            <Text size="xs" color="$text500">Quickly add items to cart</Text>
          </VStack>
        </HStack>
      </HStack>
    </Box>
  );
};

export default CheckoutHeader;
