import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Heading,
  Text,
  Pressable,
} from '@gluestack-ui/themed';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppShadow } from '../../../utils/platformStyles';
import { useTranslation } from 'react-i18next';

interface Props {
  onBack: () => void;
}

const CheckoutHeader: React.FC<Props> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const flexDir = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' : 'left';

  return (
    <Box px="$2" pt={Math.max(insets.top, 10)} pb="$4">
      <HStack justifyContent="space-between" alignItems="center" flexDirection={flexDir}>
        <HStack space="md" alignItems="center" flexDirection={flexDir}>
          <Pressable
            onPress={onBack}
            p="$3"
            minWidth={44}
            minHeight={44}
            justifyContent="center"
            alignItems="center"
            bg="$white"
            rounded="$full"
            accessibilityLabel="Go back"
            accessibilityRole="button"
            style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.05)' }) }}
          >
            <ArrowLeft size={22} color="#111827" style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }} />
          </Pressable>
          <VStack>
            <Heading size="lg" color="$text900" fontWeight="$black" textAlign={textAlign}>Checkout</Heading>
            <Text size="xs" color="$text500" textAlign={textAlign}>Quickly add items to cart</Text>
          </VStack>
        </HStack>
      </HStack>
    </Box>
  );
};

export default CheckoutHeader;
