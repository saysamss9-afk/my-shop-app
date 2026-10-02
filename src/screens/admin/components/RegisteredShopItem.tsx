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
  ButtonText,
  Center,
} from '@gluestack-ui/themed';
import { User, Phone, Copy, Trash2, Calendar, MapPin, Store } from 'lucide-react-native';
import { getAppShadow } from '../../../utils/platformStyles';

interface Props {
  item: any;
  onCopy: (text: string) => void;
  onWhatsApp: (phone: string, name: string, id: string) => void;
  onDelete: (id: string) => void;
  onManagePlan: (item: any) => void;
}

const RegisteredShopItem: React.FC<Props> = ({ item, onCopy, onWhatsApp, onDelete, onManagePlan }) => {
  const shopCode = item.shopCode || item.id;
  const plan = (item.plan || 'STARTER').toUpperCase();
  const planBg = plan === 'PREMIUM' ? '$amber50' : plan === 'BUSINESS' ? '$purple50' : '$blue50';
  const planColor = plan === 'PREMIUM' ? '$amber700' : plan === 'BUSINESS' ? '$purple700' : '$blue700';

  return (
    <Box
      bg="$white"
      p="$5"
      rounded="$3xl"
      mb="$4"
      mx="$5"
      borderWidth={1}
      borderColor="$borderLight"
      style={{ ...getAppShadow({ offsetY: 4, radius: 14, color: 'rgba(0,0,0,0.04)', opacity: 0.04 }) }}
    >
      {/* Top Header: Shop Name & Code */}
      <HStack justifyContent="space-between" alignItems="flex-start" mb="$3">
        <HStack space="md" alignItems="center" flex={1} mr="$2">
          <Center w={48} h={48} bg="$primary50" rounded="$2xl">
            <Icon as={Store} size="md" color="$primary600" />
          </Center>
          <VStack flex={1} space="2xs">
            <Heading size="md" color="$text900" numberOfLines={1}>{item.name}</Heading>
            <Text size="2xs" color="$text400" fontWeight="$bold" textTransform="uppercase" letterSpacing={0.5}>
              {item.type || 'General Shop'}
            </Text>
          </VStack>
        </HStack>

        <Pressable
          onPress={() => onCopy(shopCode)}
          bg="$primary50"
          px="$3"
          py="$1.5"
          rounded="$xl"
          borderWidth={1}
          borderColor="$primary100"
        >
          <HStack space="xs" alignItems="center">
            <Text size="xs" fontWeight="$black" color="$primary700" numberOfLines={1}>
              {shopCode}
            </Text>
            <Icon as={Copy} size="2xs" color="$primary600" />
          </HStack>
        </Pressable>
      </HStack>

      <Box h={1} bg="$backgroundLight100" my="$3" />

      {/* Owner & Contact Details Box */}
      <Box bg="$backgroundLight50" p="$3.5" rounded="$2xl" mb="$3">
        <VStack space="xs">
          <HStack space="sm" alignItems="center">
            <Icon as={User} size="xs" color="$text500" />
            <Text size="xs" color="$text700" fontWeight="$bold">{item.ownerName || 'Unknown Owner'}</Text>
          </HStack>
          <HStack space="sm" alignItems="center">
            <Icon as={Phone} size="xs" color="$text500" />
            <Text size="xs" color="$text700">{item.whatsappNumber || 'No phone'}</Text>
          </HStack>
          <HStack space="sm" alignItems="center">
            <Icon as={MapPin} size="xs" color="$text500" />
            <Text size="xs" color="$text600" numberOfLines={1}>
              {item.location || 'No location'} ({item.country || 'Ghana'})
            </Text>
          </HStack>
        </VStack>
      </Box>

      {/* Plan & Metadata Badges */}
      <HStack space="xs" alignItems="center" mb="$4" flexWrap="wrap">
        <Box bg={planBg} px="$2.5" py="$1" rounded="$lg">
          <Text size="2xs" color={planColor} fontWeight="$bold">{plan}</Text>
        </Box>
        <Box bg={item.planExpiresAt ? '$success50' : '$backgroundLight100'} px="$2.5" py="$1" rounded="$lg">
          <Text size="2xs" color={item.planExpiresAt ? '$success700' : '$text400'} fontWeight="$bold">
            {item.planExpiresAt ? `Expires: ${item.planExpiresAt}` : 'Expiry: Not Set'}
          </Text>
        </Box>
        {item.currency && (
          <Box bg="$info50" px="$2.5" py="$1" rounded="$lg">
            <Text size="2xs" color="$info700" fontWeight="$bold">Currency: {item.currency}</Text>
          </Box>
        )}
      </HStack>

      {/* Action Buttons Footer */}
      <HStack space="sm" justifyContent="flex-end" pt="$2" borderTopWidth={1} borderTopColor="$borderLight">
        <Button
          variant="outline"
          size="sm"
          action="primary"
          px="$3"
          py="$2"
          rounded="$xl"
          onPress={() => onManagePlan(item)}
          bg="$primary50"
          borderColor="$primary200"
          flex={1}
        >
          <HStack space="xs" alignItems="center" justifyContent="center">
            <Icon as={Calendar} size="xs" color="$primary700" />
            <ButtonText size="2xs" color="$primary700" fontWeight="$bold">Renew / Expiry</ButtonText>
          </HStack>
        </Button>

        <Button
          variant="outline"
          size="sm"
          action="positive"
          px="$3"
          py="$2"
          rounded="$xl"
          onPress={() => onWhatsApp(item.whatsappNumber, item.name, item.id)}
          bg="$success50"
          borderColor="$success200"
        >
          <HStack space="xs" alignItems="center">
            <Icon as={Phone} size="xs" color="$success700" />
            <ButtonText size="2xs" color="$success700" fontWeight="$bold">WhatsApp</ButtonText>
          </HStack>
        </Button>

        <Button
          variant="outline"
          size="sm"
          action="negative"
          px="$3"
          py="$2"
          rounded="$xl"
          onPress={() => onDelete(item.id)}
          bg="$error50"
          borderColor="$error200"
        >
          <HStack space="xs" alignItems="center">
            <Icon as={Trash2} size="xs" color="$error600" />
            <ButtonText size="2xs" color="$error600" fontWeight="$bold">Delete</ButtonText>
          </HStack>
        </Button>
      </HStack>
    </Box>
  );
};

export default RegisteredShopItem;
