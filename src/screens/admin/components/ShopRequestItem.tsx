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
import { User, MapPin, PhoneIcon, EditIcon, TrashIcon } from 'lucide-react-native';
import { platformShadow } from '../../../utils/platformStyles';

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
    <Box bg="$white" p="$4" rounded="$2xl" mb="$4" borderWidth={1} borderColor="$borderLight" style={{ ...platformShadow({ offsetY: 6, radius: 18, color: 'rgba(110,59,230,0.06)' }) }}>
      <HStack justifyContent="space-between" alignItems="flex-start">
        <VStack flex={1}>
          <Heading size="md" color="$text900">{item.shopName}</Heading>
          <Text size="xs" color="$text500" textTransform="uppercase">{item.shopType}</Text>
        </VStack>
        <Badge size="sm" variant="solid" action={item.status === 'REVIEWING' ? 'info' : 'warning'} rounded="$lg">
          <BadgeText size="xs" fontWeight="$bold">{item.status === 'REVIEWING' ? 'REVISIT' : 'NEW REQUEST'}</BadgeText>
        </Badge>
      </HStack>

      <VStack space="sm" mt="$4" mb="$6">
        <HStack space="sm" alignItems="center">
          <Center w="$6" h="$6" rounded="$full" bg="$primary50">
            <Icon as={User} size="xs" color="$primary800" />
          </Center>
          <Text size="sm">{item.ownerName}</Text>
        </HStack>
        <HStack space="sm" alignItems="center">
          <Center w="$6" h="$6" rounded="$full" bg="$success50">
            <Icon as={PhoneIcon} size="xs" color="$success600" />
          </Center>
          <Text size="sm">{item.whatsappNumber}</Text>
        </HStack>
        <HStack space="sm" alignItems="center">
          <Center w="$6" h="$6" rounded="$full" bg="$backgroundLight100">
            <Icon as={MapPin} size="xs" color="$text500" />
          </Center>
          <Text size="xs" color="$text600" flexShrink={1}>{item.location} ({item.country})</Text>
        </HStack>
        {item.currency && (
          <HStack space="sm" alignItems="center">
             <Badge action="info" variant="outline" size="sm">
                <BadgeText size="xxs">Currency: {item.currency}</BadgeText>
             </Badge>
          </HStack>
        )}
      </VStack>

      <HStack space="md">
        <Button variant="outline" size="sm" action="secondary" onPress={() => onEdit(item)} borderRadius="$lg">
          <ButtonIcon as={EditIcon} />
        </Button>
        <Button variant="outline" size="sm" action="positive" onPress={() => onWhatsApp(item.whatsappNumber, item.shopName)} borderRadius="$lg">
          <ButtonIcon as={PhoneIcon} />
        </Button>
        <Button variant="outline" size="sm" action="negative" onPress={() => onDelete(item.id)} borderRadius="$lg">
          <ButtonIcon as={TrashIcon} color="$error600" />
        </Button>
        <Box flex={1} />
        <Button size="sm" action="primary" onPress={() => onApprove(item)} isDisabled={!!processing} borderRadius="$lg" bg="$primary800">
          {processing === item.id ? <Spinner color="white" size="small" /> : <ButtonText fontWeight="$bold">Approve</ButtonText>}
        </Button>
      </HStack>
    </Box>
  );
};

export default ShopRequestItem;
