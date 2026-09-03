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
import { ArrowLeft, Scan } from 'lucide-react-native';

interface Props {
  onBack: () => void;
  onOpenScanner: () => void;
}

const CheckoutHeader: React.FC<Props> = ({ onBack, onOpenScanner }) => {
  return (
    <Box px="$2" pt="$2" pb="$4">
      <HStack justifyContent="space-between" alignItems="center">
        <HStack space="md" alignItems="center">
          <Pressable onPress={onBack} p="$2" bg="$white" rounded="$full">
            <Icon as={ArrowLeft} color="$text900" />
          </Pressable>
          <VStack>
            <Heading size="lg" color="$text900" fontWeight="$black">Checkout</Heading>
            <Text size="xs" color="$text500">Scan or search items</Text>
          </VStack>
        </HStack>
        <Pressable onPress={onOpenScanner} p="$3" bg="$white" rounded="$full">
          <Icon as={Scan} color="$primary600" size="md" />
        </Pressable>
      </HStack>
    </Box>
  );
};

export default CheckoutHeader;
