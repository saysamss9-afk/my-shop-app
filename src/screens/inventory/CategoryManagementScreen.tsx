import React, { useState, useCallback } from 'react';
import { FlatList, StatusBar } from 'react-native';
import { displayAlert } from '../../utils/alert';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Pressable,
  Center,
  Spinner,
  Button,
  ButtonText,
  Input,
  InputField,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  CloseIcon,
  TrashIcon,
} from '@gluestack-ui/themed';
import { ChevronLeft, Plus, Edit2, Layers } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import { useCategories } from '../../hooks/useCategories';
import { getAppShadow, getButtonHeight } from '../../utils/platformStyles';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type Props = StackScreenProps<RootStackParamList, 'CategoryManagement'>;

const CategoryManagementScreen: React.FC<Props> = ({ route, navigation }) => {
  const { shopId } = route.params;
  const { categories, isLoading, addCategory, updateCategory, deleteCategory } = useCategories(shopId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [categoryName, setCategoryName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedCategory(null);
    setCategoryName('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: any) => {
    setIsEditMode(true);
    setSelectedCategory(category);
    setCategoryName(category.name);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!categoryName.trim()) {
      displayAlert("Required", "Please enter a category name.");
      return;
    }
    setSubmitting(true);
    try {
      if (isEditMode && selectedCategory) {
        await updateCategory(selectedCategory.id, categoryName.trim());
      } else {
        await addCategory(categoryName.trim());
      }
      setIsModalOpen(false);
    } catch (e: any) {
      displayAlert("Error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (category: any) => {
    displayAlert(
      "Delete Category",
      `Are you sure you want to delete "${category.name}"? Products in this category will become uncategorized.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCategory(category.id);
            } catch (e: any) {
              displayAlert("Error", e.message);
            }
          }
        }
      ]
    );
  };

  const renderItem = useCallback(({ item }: any) => (
    <Box
      bg="$white"
      p="$4"
      rounded="$2xl"
      mb="$3"
      style={getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.02)' })}
    >
      <HStack justifyContent="space-between" alignItems="center">
        <HStack space="md" alignItems="center">
          <Center w={40} h={40} bg="$primary50" rounded="$xl">
            <Icon as={Layers} color="$primary600" size="sm" />
          </Center>
          <VStack>
            <Text fontWeight="$bold" color="$text900" size="md">{item.name}</Text>
            <Text size="xs" color="$text500">Product Classification</Text>
          </VStack>
        </HStack>

        <HStack space="sm">
          <Pressable onPress={() => handleOpenEdit(item)} p="$2" rounded="$lg" bg="$backgroundLight50">
            <Icon as={Edit2} size="xs" color="$primary600" />
          </Pressable>
          <Pressable onPress={() => handleDelete(item)} p="$2" rounded="$lg" bg="$red50">
            <Icon as={TrashIcon} size="xs" color="$red600" />
          </Pressable>
        </HStack>
      </HStack>
    </Box>
  ), []);

  return (
    <ScreenWrapper withHeader>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <Box px="$4" pt={Math.max(insets.top, 10)} pb="$4">
        <HStack space="md" alignItems="center">
          <Pressable onPress={() => navigation.goBack()} p="$2.5" bg="$white" rounded="$full" style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.05)' }) }}>
            <ChevronLeft size={22} color="#111827" />
          </Pressable>
          <VStack>
            <Heading size="lg" color="$text900" fontWeight="$black">Categories</Heading>
            <Text size="xs" color="$text500">Manage product classifications</Text>
          </VStack>
        </HStack>
      </Box>

      {isLoading ? (
        <Center flex={1}>
          <Spinner size="large" color="$primary600" />
        </Center>
      ) : (
        <VStack flex={1} px="$4">
          <Button
            onPress={handleOpenAdd}
            bg="$primary600"
            borderRadius={16}
            mb="$6"
            h={getButtonHeight(56)}
            style={getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(230,81,0,0.2)' })}
          >
            <Icon as={Plus} color="white" mr="$2" size="sm" />
            <ButtonText fontWeight="$black">Create New Category</ButtonText>
          </Button>

          <FlatList
            data={categories}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <Center mt="$20">
                <VStack space="md" alignItems="center">
                  <Box bg="$backgroundLight100" p="$5" rounded="$full">
                    <Icon as={Layers} size="xl" color="$text300" />
                  </Box>
                  <Text color="$text400">No categories created yet.</Text>
                </VStack>
              </Center>
            }
          />
        </VStack>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => !submitting && setIsModalOpen(false)}>
        <ModalBackdrop />
        <ModalContent rounded="$3xl">
          <ModalHeader>
            <Heading size="lg" fontWeight="$black">{isEditMode ? 'Edit Category' : 'New Category'}</Heading>
            <ModalCloseButton><Icon as={CloseIcon} /></ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <VStack space="lg" py="$4">
              <FormControl isRequired>
                <FormControlLabel mb="$1">
                  <FormControlLabelText size="sm">Category Name</FormControlLabelText>
                </FormControlLabel>
                <Input borderRadius={12} bg="$backgroundLight50">
                  <InputField
                    placeholder="e.g. Beverages, Toiletries..."
                    value={categoryName}
                    onChangeText={setCategoryName}
                    autoFocus
                  />
                </Input>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" action="secondary" onPress={() => setIsModalOpen(false)} mr="$3" borderRadius={16}>
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button action="primary" onPress={handleSave} borderRadius={16} bg="$primary600" isDisabled={submitting}>
              {submitting ? <Spinner color="white" /> : <ButtonText fontWeight="$bold">Save Category</ButtonText>}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </ScreenWrapper>
  );
};

export default CategoryManagementScreen;
