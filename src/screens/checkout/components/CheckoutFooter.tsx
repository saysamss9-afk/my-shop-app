import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  ButtonText,
  Spinner,
  Icon,
} from '@gluestack-ui/themed';
import { Wallet } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppShadow } from '../../../utils/platformStyles';
import { useTranslation } from 'react-i18next';

interface Props {
  total: number;
  currency: string;
  cartLength: number;
  isLoading: boolean;
  onCheckout: () => void;
}

const CheckoutFooter: React.FC<Props> = ({ total, currency, cartLength, isLoading, onCheckout }) => {
  const insets = useSafeAreaInsets();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const flexDir = isRTL ? 'row-reverse' : 'row';

  return (
    <Box position="absolute" bottom={0} left={0} right={0} p="$5" pb={Math.max(insets.bottom, 20)} bg="$white" borderTopLeftRadius="$3xl" borderTopRightRadius="$3xl" style={{ ...getAppShadow({ offsetY: -8, radius: 24, color: 'rgba(0,0,0,0.08)' }) }}>
      <VStack space="lg">
          <VStack space="xs">
              <HStack justifyContent="space-between" alignItems="center" flexDirection={flexDir}>
                  <Text size="sm" color="$text500">Subtotal</Text>
                  <Text size="sm" color="$text900">{currency}{total.toFixed(2)}</Text>
              </HStack>
              <HStack justifyContent="space-between" alignItems="center" flexDirection={flexDir}>
                  <Heading size="lg" color="$text900">Total Amount</Heading>
                  <Heading size="xl" color="$primary800">{currency}{total.toFixed(2)}</Heading>
              </HStack>
          </VStack>
          <Button
            size="lg"
            action="primary"
            onPress={onCheckout}
            isDisabled={cartLength === 0 || isLoading}
            borderRadius={16}
            bg="$primary800"
            h="$12"
            accessibilityLabel="Collect Payment"
            accessibilityRole="button"
          >
            <ButtonText fontWeight="$bold">Collect Payment</ButtonText>
            {isLoading ? <Spinner color="white" ml="$2" /> : <Icon as={Wallet} color="white" ml="$2" size="sm" />}
          </Button>
      </VStack>
    </Box>
  );
};

export default CheckoutFooter;
