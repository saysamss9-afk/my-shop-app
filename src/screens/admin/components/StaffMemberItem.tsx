import React from 'react';
import { Linking } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Pressable,
  Center,
  Badge,
  BadgeText,
} from '@gluestack-ui/themed';
import { User, MailIcon, PhoneIcon, CreditCard } from 'lucide-react-native';

interface Props {
  item: any;
}

const StaffMemberItem: React.FC<Props> = ({ item }) => {
  return (
    <Box bg="$white" p="$5" rounded="$3xl" mb="$4" borderWidth={1} borderColor="$borderLight" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <HStack justifyContent="space-between" alignItems="flex-start">
        <HStack space="md" flex={1}>
          <Center w={48} h={48} rounded="$full" bg="$primary50">
            <Icon as={User} color="$primary600" />
          </Center>
          <VStack flex={1} space="xs">
            <Heading size="md" color="$text900">{item.name || 'Unnamed Staff'}</Heading>
            <HStack space="xs" alignItems="center">
                <Badge action={item.role === 'OWNER' ? 'info' : 'warning'} variant="outline" rounded="$lg" size="sm">
                    <BadgeText size="xs">{item.role}</BadgeText>
                </Badge>
                {item.joinedAt && (
                    <Text size="xxs" color="$text400">Joined: {new Date(item.joinedAt.seconds * 1000).toLocaleDateString()}</Text>
                )}
            </HStack>
          </VStack>
        </HStack>
      </HStack>

      <Box h={1} bg="$backgroundLight100" my="$4" />

      <VStack space="sm">
        <HStack space="sm" alignItems="center">
          <Icon as={MailIcon} size="xs" color="$text400" />
          <Text size="sm" color="$text700">{item.email}</Text>
        </HStack>
        <HStack space="sm" alignItems="center">
          <Icon as={PhoneIcon} size="xs" color="$text400" />
          <Pressable onPress={() => Linking.openURL(`tel:${item.phoneNumber}`)}>
            <Text size="sm" color="$primary600" fontWeight="$medium">{item.phoneNumber || 'No phone'}</Text>
          </Pressable>
        </HStack>
        {item.country && (
          <HStack space="sm" alignItems="center">
            <Icon as={CreditCard} size="xs" color="$text400" />
            <Text size="sm" color="$text700">Country: {item.country}</Text>
          </HStack>
        )}
      </VStack>
    </Box>
  );
};

export default React.memo(StaffMemberItem);
