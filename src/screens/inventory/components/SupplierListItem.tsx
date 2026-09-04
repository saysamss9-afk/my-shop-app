import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Center,
} from '@gluestack-ui/themed';
import { Store, Phone, CloudOff, CheckCircle2 } from 'lucide-react-native';
import { Supplier } from '../../../db/types';
import { getAppShadow } from '../../../utils/platformStyles';

interface Props {
  item: Supplier;
}

const SupplierListItem: React.FC<Props> = ({ item }) => {
  return (
    <Box
      bg="$white"
      p="$5"
      rounded="$3xl"
      mb="$4"
      borderWidth={1}
      borderColor="$borderLight"
      style={{ ...getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(0,0,0,0.03)' }) }}
    >
      <HStack space="md" alignItems="center">
        <Center w={52} h={52} rounded={16} bg="$primary50">
          <Icon as={Store} color="$primary600" size="md" />
        </Center>
        <VStack flex={1} space="xs">
          <HStack space="xs" alignItems="center">
            <Heading size="sm" color="$text900" fontWeight="$bold">
              {item.name}
            </Heading>
            {item.syncStatus === 0 ? (
                <Icon as={CloudOff} size="xs" color="$amber600" />
            ) : (
                <Icon as={CheckCircle2} size="xs" color="$success600" />
            )}
          </HStack>
          <HStack space="xs" alignItems="center">
            <Icon as={Phone} size="xs" color="$text400" />
            <Text size="xs" color="$text500">{item.contactInfo || 'No contact info'}</Text>
          </HStack>
        </VStack>
      </HStack>
    </Box>
  );
};

export default React.memo(SupplierListItem);
