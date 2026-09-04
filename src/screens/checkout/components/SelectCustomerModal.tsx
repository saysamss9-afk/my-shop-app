import React, { useState } from 'react';
import {
  Heading,
  Icon,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  VStack,
  HStack,
  Text,
  Input,
  InputField,
  InputSlot,
  InputIcon,
  SearchIcon,
  CloseIcon,
  Pressable,
  Center,
  FlatList,
  Box,
} from '@gluestack-ui/themed';
import { User, CheckCircle2 } from 'lucide-react-native';
import { Customer } from '../../../db/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onSelect: (customerId: string) => void;
  selectedCustomerId: string | null;
}

const SelectCustomerModal: React.FC<Props> = ({ isOpen, onClose, customers, onSelect, selectedCustomerId }) => {
  const [search, setSearch] = useState('');

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalBackdrop />
      <ModalContent rounded="$3xl" h="80%">
        <ModalHeader borderBottomWidth={1} borderBottomColor="$borderLight">
          <Heading size="lg">Select Customer</Heading>
          <ModalCloseButton><Icon as={CloseIcon} /></ModalCloseButton>
        </ModalHeader>
        <ModalBody p="$0">
          <VStack flex={1}>
            <Box p="$4" bg="$backgroundLight50">
              <Input variant="outline" size="md" borderRadius={12} bg="$white">
                <InputSlot pl="$3">
                  <InputIcon as={SearchIcon} color="$text400" />
                </InputSlot>
                <InputField
                  placeholder="Search customers..."
                  value={search}
                  onChangeText={setSearch}
                />
              </Input>
            </Box>

            <FlatList
              data={filtered}
              keyExtractor={(item: any) => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }: any) => (
                <Pressable
                  onPress={() => onSelect(item.id)}
                  mb="$3"
                  bg={selectedCustomerId === item.id ? "$primary50" : "$white"}
                  p="$4"
                  rounded="$2xl"
                  borderWidth={1}
                  borderColor={selectedCustomerId === item.id ? "$primary600" : "$borderLight"}
                >
                  <HStack space="md" alignItems="center">
                    <Center w={40} h={40} rounded="$full" bg={selectedCustomerId === item.id ? "$primary200" : "$backgroundLight100"}>
                      <Icon as={User} color={selectedCustomerId === item.id ? "$primary700" : "$text400"} />
                    </Center>
                    <VStack flex={1}>
                      <Text fontWeight="$bold" color="$text900">{item.name}</Text>
                      <Text size="xs" color="$text500">{item.phone || 'No phone'}</Text>
                    </VStack>
                    <VStack alignItems="flex-end">
                        <Text size="xs" color="$text400">Debt</Text>
                        <Text size="sm" color="$error600" fontWeight="$bold">{item.currentBalance.toFixed(2)}</Text>
                    </VStack>
                    {selectedCustomerId === item.id && (
                        <Icon as={CheckCircle2} color="$primary600" size="sm" />
                    )}
                  </HStack>
                </Pressable>
              )}
              ListEmptyComponent={
                <Center mt="$10">
                  <Text color="$text400">No customers found.</Text>
                </Center>
              }
            />
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default SelectCustomerModal;
