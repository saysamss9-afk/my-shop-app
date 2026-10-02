import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Badge,
  BadgeText,
  Button,
  ButtonText,
  Spinner,
} from '@gluestack-ui/themed';
import { ArrowRight, Store, ShieldCheck } from 'lucide-react-native';
import { getAppShadow } from '../../../utils/platformStyles';

interface Props {
  item: any;
  processing: string | null;
  onApprove: (item: any) => void;
  onReject: (item: any) => void;
}

const UpgradeRequestItem: React.FC<Props> = ({ item, processing, onApprove, onReject }) => {
  return (
    <Box
      bg="$white"
      p="$5"
      rounded="$3xl"
      mb="$4"
      borderWidth={1}
      borderColor="$borderLight"
      style={{ ...getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(0,0,0,0.03)', opacity: 0.03 }) }}
    >
      <VStack space="md">
        <HStack justifyContent="space-between" alignItems="center">
          <HStack space="sm" alignItems="center">
            <Box p="$2" bg="$primary50" rounded="$xl">
              <Icon as={Store} size="sm" color="$primary700" />
            </Box>
            <VStack>
              <Heading size="md" color="$text900">{item.shopName}</Heading>
              <Text size="xs" color="$text500">ID: {item.shopId}</Text>
            </VStack>
          </HStack>
          <Badge action="warning" variant="solid" rounded="$lg">
            <BadgeText size="2xs" fontWeight="$bold">UPGRADE REQ</BadgeText>
          </Badge>
        </HStack>

        <HStack space="md" alignItems="center" bg="$backgroundLight50" p="$3" rounded="$2xl">
          <VStack flex={1} alignItems="center">
            <Text size="2xs" color="$text500" textTransform="uppercase">Current</Text>
            <Badge action="muted" variant="outline" mt="$1">
              <BadgeText size="2xs">{item.currentPlan}</BadgeText>
            </Badge>
          </VStack>
          <Icon as={ArrowRight} size="sm" color="$text400" />
          <VStack flex={1} alignItems="center">
            <Text size="2xs" color="$text500" textTransform="uppercase">Requested</Text>
            <Badge action="success" variant="solid" mt="$1">
              <BadgeText size="2xs">{item.requestedPlan}</BadgeText>
            </Badge>
          </VStack>
        </HStack>

        <HStack space="md" pt="$1">
          <Button
            size="sm"
            flex={1}
            variant="outline"
            action="negative"
            onPress={() => onReject(item)}
            isDisabled={processing === item.id}
            borderRadius="$xl"
          >
            <ButtonText fontWeight="$bold">Reject</ButtonText>
          </Button>
          <Button
            size="sm"
            flex={1}
            action="primary"
            bg="$primary800"
            onPress={() => onApprove(item)}
            isDisabled={processing === item.id}
            borderRadius="$xl"
          >
            {processing === item.id ? (
              <Spinner color="white" size="small" />
            ) : (
              <HStack space="xs" alignItems="center">
                <Icon as={ShieldCheck} size="xs" color="white" />
                <ButtonText fontWeight="$bold">Approve</ButtonText>
              </HStack>
            )}
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default UpgradeRequestItem;
