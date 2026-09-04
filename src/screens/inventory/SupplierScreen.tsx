import React, { useState, useCallback } from 'react';
import { FlatList, StatusBar } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Icon,
  Pressable,
  Center,
  Spinner,
  Fab,
  FabIcon,
  FabLabel,
  AddIcon,
  ArrowLeftIcon,
  SearchIcon,
} from '@gluestack-ui/themed';
import { Store } from 'lucide-react-native';
import { useSuppliers } from '../../hooks/useSuppliers';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import SupplierListItem from './components/SupplierListItem';
import AddSupplierModal from './components/AddSupplierModal';
import { getAppShadow } from '../../utils/platformStyles';

const SupplierScreen = ({ route, navigation }: any) => {
  const { shopId } = route.params;
  const { suppliers, isLoading, addSupplier } = useSuppliers(shopId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const renderItem = useCallback(({ item }: any) => (
    <SupplierListItem item={item} />
  ), []);

  return (
    <ScreenWrapper withHeader>
      <StatusBar barStyle="dark-content" backgroundColor="#F3ECFF" />

      {/* Header */}
      <Box px="$2" pt="$2" pb="$4">
        <HStack space="md" alignItems="center">
          <Pressable onPress={() => navigation.goBack()} p="$2" bg="$white" rounded="$full">
            <Icon as={ArrowLeftIcon} color="$text900" />
          </Pressable>
          <VStack>
            <Heading size="lg" color="$text900" fontWeight="$black">Suppliers</Heading>
            <Text size="xs" color="$text500">Manage your product sources</Text>
          </VStack>
        </HStack>
      </Box>

      {isLoading ? (
        <Center flex={1}>
          <Spinner size="large" color="$primary600" />
        </Center>
      ) : (
        <FlatList
          data={suppliers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          ListEmptyComponent={
            <Center mt="$20">
              <VStack space="md" alignItems="center">
                <Center w={100} h={100} bg="$backgroundLight100" rounded="$full">
                    <Icon as={Store} size="xl" color="$text300" />
                </Center>
                <Text color="$text400">No suppliers added yet.</Text>
              </VStack>
            </Center>
          }
        />
      )}

      <Fab
        size="lg"
        placement="bottom right"
        onPress={() => setIsModalOpen(true)}
        bg="$primary600"
        m="$6"
        style={{ ...getAppShadow({ offsetY: 10, radius: 26, color: 'rgba(110,59,230,0.28)' }) }}
      >
        <FabIcon as={AddIcon} mr="$2" />
        <FabLabel fontWeight="$black">New Supplier</FabLabel>
      </Fab>

      <AddSupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={addSupplier}
      />
    </ScreenWrapper>
  );
};

export default SupplierScreen;
