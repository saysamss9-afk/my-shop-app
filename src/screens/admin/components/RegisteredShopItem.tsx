import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Pressable,
  Button,
  ButtonIcon,
  Badge,
  BadgeText,
} from '@gluestack-ui/themed';
import { User, PhoneIcon, CopyIcon, TrashIcon } from 'lucide-react-native';
import { getAppShadow } from '../../../utils/platformStyles';

interface Props {
  item: any;
  onCopy: (text: string) => void;
  onWhatsApp: (phone: string, name: string, id: string) => void;
  onDelete: (id: string) => void;
}

const RegisteredShopItem: React.FC<Props> = ({ item, onCopy, onWhatsApp, onDelete }) => {
  return (
    <Box bg="$white" p="$5" rounded="$3xl" mb="$4" borderWidth={1} borderColor="$borderLight" style={{ ...getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(0,0,0,0.03)', opacity: 0.03 }) }}>
      <HStack justifyContent="space-between" alignItems="flex-start">
        <VStack flex={1} space="xs">
          <Heading size="md" color="$text900">{item.name}</Heading>
          <Text size="xs" color="$text500" textTransform="uppercase" letterSpacing={1}>{item.type}</Text>

          <Pressable onPress={() => onCopy(item.shopCode || item.id)} mt="$2">
            <HStack space="xs" alignItems="center" bg="$primary50" px="$3" py="$1.5" rounded="$xl" alignSelf="flex-start">
              <Text size="sm" fontWeight="$bold" color="$primary600" style={{ letterSpacing: 1 }}>
                {item.shopCode || item.id}
              </Text>
              <Icon as={CopyIcon} size="xs" color="$primary600" />
            </HStack>
          </Pressable>
        </VStack>

        <HStack space="xs">
            <Button variant="outline" size="sm" action="positive" p="$2" rounded="$full" onPress={() => onWhatsApp(item.whatsappNumber, item.name, item.id)}>
                <ButtonIcon as={PhoneIcon} />
            </Button>
            <Button variant="outline" size="sm" action="negative" p="$2" rounded="$full" onPress={() => onDelete(item.id)}>
                <ButtonIcon as={TrashIcon} color="$error600" />
            </Button>
        </HStack>
      </HStack>

      <Box h={1} bg="$backgroundLight100" my="$4" />

      <VStack space="sm">
        <HStack space="sm" alignItems="center">
          <Icon as={User} size="xs" color="$text400" />
          <Text size="sm" color="$text700">{item.ownerName}</Text>
        </HStack>
        <HStack space="sm" alignItems="center">
          <Icon as={PhoneIcon} size="xs" color="$text400" />
          <Text size="sm" color="$text700">{item.whatsappNumber}</Text>
        </HStack>
        <HStack space="sm" alignItems="center">
          <Text size="xs" fontWeight="$bold" color="$text500">Address:</Text>
          <Text size="xs" color="$text600" flexShrink={1}>{item.location} ({item.country || 'Ghana'})</Text>
        </HStack>
        <HStack space="md" alignItems="center" pt="$1">
          <Badge action="info" variant="outline" size="sm">
            <BadgeText size="2xs">Plan: {item.plan || 'STARTER'}</BadgeText>
          </Badge>
          {item.currency && (
            <Badge action="muted" variant="outline" size="sm">
              <BadgeText size="2xs">Currency: {item.currency}</BadgeText>
            </Badge>
          )}
        </HStack>
      </VStack>
    </Box>
  );
};

export default RegisteredShopItem;
