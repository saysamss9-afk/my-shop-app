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
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import { User, CheckCircle2, UserPlus, Plus } from 'lucide-react-native';
import type { Customer } from '../../../db/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onSelect: (customerId: string) => void;
  selectedCustomerId: string | null;
  onAdd: (name: string, phone: string) => Promise<void>;
}

const SelectCustomerModal: React.FC<Props> = ({ isOpen, onClose, customers, onSelect, selectedCustomerId, onAdd }) => {
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );

  const handleQuickAdd = async () => {
    if (!newName.trim()) return;
    await onAdd(newName.trim(), newPhone.trim());
    setIsAdding(false);
    setNewName('');
    setNewPhone('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalBackdrop />
      <ModalContent rounded="$3xl" h="80%">
        <ModalHeader borderBottomWidth={1} borderBottomColor="$borderLight">
          <Heading size="lg">{isAdding ? 'Quick Add Customer' : 'Select Customer'}</Heading>
          <ModalCloseButton><Icon as={CloseIcon} /></ModalCloseButton>
        </ModalHeader>
        <ModalBody p="$0">
          <VStack flex={1}>
            {!isAdding ? (
              <>
                <Box p="$4" bg="$backgroundLight50">
                  <HStack space="md" alignItems="center">
                    <Input flex={1} variant="outline" size="md" borderRadius={12} bg="$white">
                      <InputSlot pl="$3">
                        <InputIcon as={SearchIcon} color="$text400" />
                      </InputSlot>
                      <InputField
                        placeholder="Search customers..."
                        value={search}
                        onChangeText={setSearch}
                      />
                    </Input>
                    <Pressable
                      onPress={() => setIsAdding(true)}
                      bg="$primary600"
                      p="$3"
                      rounded="$xl"
                    >
                      <Icon as={Plus} color="white" size="sm" />
                    </Pressable>
                  </HStack>
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
                            <Text size="sm" color="$error600" fontWeight="$bold">{(Number(item.currentBalance) || 0).toFixed(2)}</Text>
                        </VStack>
                        {selectedCustomerId === item.id && (
                            <Icon as={CheckCircle2} color="$primary600" size="sm" />
                        )}
                      </HStack>
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    <Center mt="$10">
                      <VStack space="md" alignItems="center">
                        <Text color="$text400">No customers found.</Text>
                        <Button size="sm" variant="outline" action="primary" onPress={() => setIsAdding(true)} borderRadius={12}>
                          <ButtonText>Create New Customer</ButtonText>
                        </Button>
                      </VStack>
                    </Center>
                  }
                />
              </>
            ) : (
              <VStack space="xl" p="$6">
                <VStack space="lg">
                  <VStack space="xs">
                    <Text size="sm" fontWeight="$bold" color="$text700">Full Name</Text>
                    <Input variant="outline" size="md" borderRadius={12}>
                      <InputField
                        placeholder="e.g. John Doe"
                        value={newName}
                        onChangeText={setNewName}
                        autoFocus
                      />
                    </Input>
                  </VStack>

                  <VStack space="xs">
                    <Text size="sm" fontWeight="$bold" color="$text700">Phone Number</Text>
                    <Input variant="outline" size="md" borderRadius={12}>
                      <InputField
                        placeholder="054..."
                        value={newPhone}
                        onChangeText={setNewPhone}
                        keyboardType="phone-pad"
                      />
                    </Input>
                  </VStack>
                </VStack>

                <HStack space="md" mt="$4">
                  <Button flex={1} variant="outline" action="secondary" onPress={() => setIsAdding(false)} borderRadius={12}>
                    <ButtonText>Cancel</ButtonText>
                  </Button>
                  <Button flex={2} action="primary" bg="$primary600" onPress={handleQuickAdd} borderRadius={12}>
                    <ButtonText fontWeight="$bold">Save & Continue</ButtonText>
                  </Button>
                </HStack>
              </VStack>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default SelectCustomerModal;
