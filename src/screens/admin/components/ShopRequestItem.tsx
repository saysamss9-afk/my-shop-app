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
  Center,
  Button,
  ButtonIcon,
  ButtonText,
  Spinner,
} from '@gluestack-ui/themed';
import { User, MapPin, PhoneIcon, EditIcon, TrashIcon, CheckCircle2 } from 'lucide-react-native';
import { getAppShadow } from '../../../utils/platformStyles';

interface Props {
  item: any;
  processing: string | null;
  onEdit: (item: any) => void;
  onWhatsApp: (phone: string, name: string) => void;
  onDelete: (id: string) => void;
  onApprove: (item: any) => void;
}

const ShopRequestItem: React.FC<Props> = ({ item, processing, onEdit, onWhatsApp, onDelete, onApprove }) => {
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
      <HStack justifyContent="space-between" alignItems="flex-start">
        <VStack flex={1} space="2xs">
          <Heading size="md" color="$text900">{item.shopName}</Heading>
          <Text size="xs" color="$text500" textTransform="uppercase" letterSpacing={1}>{item.shopType}</Text>
        </VStack>
        <Badge
          size="sm"
          variant="solid"
          action={item.status === 'REVIEWING' ? 'info' : 'warning'}
          rounded="$lg"
          px="$3"
          py="$1"
        >
          <BadgeText size="2xs" fontWeight="$bold">
            {item.status === 'REVIEWING' ? 'REVISIT' : 'NEW REQUEST'}
          </BadgeText>
        </Badge>
      </HStack>

      <Box h={1} bg="$backgroundLight100" my="$4" />

      <VStack space="sm" mb="$4">
        <HStack space="sm" alignItems="center">
          <Center w="$7" h="$7" rounded="$full" bg="$primary50">
            <Icon as={User} size="xs" color="$primary800" />
          </Center>
          <Text size="sm" color="$text700" fontWeight="$semibold">{item.ownerName}</Text>
        </HStack>
        <HStack space="sm" alignItems="center">
          <Center w="$7" h="$7" rounded="$full" bg="$success50">
            <Icon as={PhoneIcon} size="xs" color="$success600" />
          </Center>
          <Text size="sm" color="$text700">{item.whatsappNumber}</Text>
        </HStack>
        <HStack space="sm" alignItems="center">
          <Center w="$7" h="$7" rounded="$full" bg="$backgroundLight100">
            <Icon as={MapPin} size="xs" color="$text500" />
          </Center>
          <Text size="xs" color="$text600" flexShrink={1}>{item.location} ({item.country || 'Ghana'})</Text>
        </HStack>
        <HStack space="md" alignItems="center" pt="$1">
          <Badge action="info" variant="outline" size="sm">
            <BadgeText size="2xs">Plan: {item.shopCategory || 'STARTER'}</BadgeText>
          </Badge>
          {item.currency && (
            <Badge action="muted" variant="outline" size="sm">
              <BadgeText size="2xs">Currency: {item.currency}</BadgeText>
            </Badge>
          )}
        </HStack>
      </VStack>

      <HStack space="sm" alignItems="center">
        <Button variant="outline" size="sm" action="secondary" onPress={() => onEdit(item)} borderRadius="$xl" p="$2.5">
          <ButtonIcon as={EditIcon} />
        </Button>
        <Button variant="outline" size="sm" action="positive" onPress={() => onWhatsApp(item.whatsappNumber, item.shopName)} borderRadius="$xl" p="$2.5">
          <ButtonIcon as={PhoneIcon} />
        </Button>
        <Button variant="outline" size="sm" action="negative" onPress={() => onDelete(item.id)} borderRadius="$xl" p="$2.5">
          <ButtonIcon as={TrashIcon} color="$error600" />
        </Button>
        <Button
          size="sm"
          flex={1}
          action="primary"
          onPress={() => onApprove(item)}
          isDisabled={!!processing}
          borderRadius="$xl"
          bg="$primary800"
          py="$2.5"
        >
          {processing === item.id ? (
            <Spinner color="white" size="small" />
          ) : (
            <HStack space="xs" alignItems="center">
              <Icon as={CheckCircle2} size="xs" color="white" />
              <ButtonText fontWeight="$bold" size="sm">Approve & Code</ButtonText>
            </HStack>
          )}
        </Button>
      </HStack>
    </Box>
  );
};

export default ShopRequestItem;
