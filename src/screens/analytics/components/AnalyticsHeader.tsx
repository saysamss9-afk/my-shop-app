import React from 'react';
import {
  Box,
  HStack,
  Icon,
  Pressable,
  Heading,
  ArrowLeftIcon,
} from '@gluestack-ui/themed';
import { RefreshCw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppShadow } from '../../../utils/platformStyles';

interface Props {
  onBack: () => void;
  onRefresh: () => void;
}

const AnalyticsHeader: React.FC<Props> = ({ onBack, onRefresh }) => {
  const insets = useSafeAreaInsets();
  return (
    <Box bg="$primary800" pt={Math.max(insets.top, 10)} pb="$4" px="$4" style={{ ...getAppShadow({ offsetY: 4, radius: 10, color: 'rgba(0,0,0,0.2)' }) }}>
      <HStack justifyContent="space-between" alignItems="center">
        <HStack space="md" alignItems="center">
          <Pressable
            onPress={onBack}
            p="$2.5"
            bg="rgba(255,255,255,0.15)"
            rounded="$full"
          >
            <Icon as={ArrowLeftIcon} color="white" size="md" />
          </Pressable>
          <Heading color="white" size="lg" fontWeight="$black">Top Items</Heading>
        </HStack>

        <Pressable
          onPress={onRefresh}
          p="$2.5"
          bg="rgba(255,255,255,0.1)"
          rounded="$full"
        >
          <Icon as={RefreshCw} color="white" size="sm" />
        </Pressable>
      </HStack>
    </Box>
  );
};

export default AnalyticsHeader;
