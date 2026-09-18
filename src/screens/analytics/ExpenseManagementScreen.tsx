import React, { useState } from 'react';
import { ScrollView, FlatList, StatusBar, Modal } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Button,
  ButtonText,
  ButtonIcon,
  Input,
  InputField,
  Spinner,
  Divider,
  Pressable,
  AddIcon,
  TrashIcon,
  Center,
} from '@gluestack-ui/themed';
import { ChevronLeft, ChevronRight, Landmark, Zap, Briefcase, Home, Wrench } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import { useExpenses } from '../../hooks/useExpenses';
import { getAppShadow } from '../../utils/platformStyles';
import type { Expense } from '../../db/types';

const CATEGORIES = [
  { id: 'Salaries', label: 'Salaries', icon: Briefcase, color: '#43A047', bgColor: '#E8F5E9' },
  { id: 'Utilities', label: 'Utilities', icon: Zap, color: '#FB8C00', bgColor: '#FFF3E0' },
  { id: 'Rent', label: 'Rent / Lease', icon: Home, color: '#E53935', bgColor: '#FFEBEE' },
  { id: 'Maintenance', label: 'Repairs & Maint.', icon: Wrench, color: '#8E24AA', bgColor: '#F3E5F5' },
  { id: 'Other Spendings', label: 'Other Costs', icon: Landmark, color: '#0288D1', bgColor: '#E1F5FE' }
];

const ExpenseManagementScreen = ({ route, navigation }: any) => {
  const { shopId } = route.params;
  const { expenses, isLoading, currency, addExpense, deleteExpense } = useExpenses(shopId);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Salaries');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePrevMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const handleAddExpense = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addExpense(selectedCategory, parsedAmount, description);
      setAmount('');
      setDescription('');
      setModalVisible(false);
    } catch (err) {
      alert('Failed to save expenditure.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter expenses by selected month and year
  const filteredExpenses = expenses.filter(item => {
    const d = new Date(item.timestamp);
    return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
  });

  const totalSpent = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
  const monthLabel = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const cat = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[4];
    return (
      <Box bg="$white" p="$4" rounded="$xl" mb="$3" style={getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.03)' })}>
        <HStack justifyContent="space-between" alignItems="center">
          <HStack space="md" alignItems="center">
            <Box bg={cat.bgColor} p="$2.5" rounded="$xl">
              <Icon as={cat.icon} color={cat.color} size="md" />
            </Box>
            <VStack space="2xs">
              <Text size="sm" fontWeight="$bold" color="$text900">{item.category}</Text>
              {item.description ? (
                <Text size="xs" color="$text500">{item.description}</Text>
              ) : null}
              <Text size="2xs" color="$text400">
                {new Date(item.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </VStack>
          </HStack>
          <HStack space="md" alignItems="center">
            <Text size="md" fontWeight="$bold" color="$error700">-{currency}{item.amount.toFixed(2)}</Text>
            <Pressable onPress={() => deleteExpense(item.id)}>
              <Icon as={TrashIcon} color="$text400" size="sm" />
            </Pressable>
          </HStack>
        </HStack>
      </Box>
    );
  };

  return (
    <ScreenWrapper>
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />

      {/* Header */}
      <Box bg="$primary800" px="$4" py="$4" style={getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(0,0,0,0.1)' })}>
        <HStack space="md" alignItems="center">
          <Pressable onPress={() => navigation.goBack()}>
            <Icon as={ChevronLeft} color="$white" size="md" />
          </Pressable>
          <VStack>
            <Heading size="md" color="$white" fontWeight="$black">Expenditure Ledger</Heading>
            <Text size="2xs" color="$primary200">Track company spendings and costs</Text>
          </VStack>
        </HStack>
      </Box>

      {/* Month Navigator Switcher */}
      <Box bg="$white" borderBottomWidth={1} borderColor="$borderLight" py="$2">
        <HStack justifyContent="space-between" alignItems="center" px="$4">
          <Pressable p="$2" onPress={handlePrevMonth}>
            <Icon as={ChevronLeft} color="$primary700" size="sm" />
          </Pressable>
          <Heading size="sm" color="$text900" fontWeight="$bold">{monthLabel}</Heading>
          <Pressable p="$2" onPress={handleNextMonth}>
            <Icon as={ChevronRight} color="$primary700" size="sm" />
          </Pressable>
        </HStack>
      </Box>

      {/* Total Overview Hero */}
      <Box bg="$white" p="$5" m="$4" rounded="$2xl" style={getAppShadow({ offsetY: 6, radius: 16, color: 'rgba(0,0,0,0.04)' })}>
        <VStack space="xs" alignItems="center" py="$2">
          <Text size="xs" color="$text500" fontWeight="$bold" textTransform="uppercase">Monthly Budget Spent</Text>
          <Heading size="2xl" color="$error700" fontWeight="$black">{currency}{totalSpent.toFixed(2)}</Heading>
        </VStack>
      </Box>

      {/* Expense List Header */}
      <HStack justifyContent="space-between" alignItems="center" px="$5" mb="$2">
        <Heading size="xs" color="$text500" textTransform="uppercase">Transaction History</Heading>
        <Button size="xs" action="primary" bg="$primary700" borderRadius={8} onPress={() => setModalVisible(true)}>
          <ButtonIcon as={AddIcon} mr="$1" />
          <ButtonText size="xs" fontWeight="$bold">Add New</ButtonText>
        </Button>
      </HStack>

      {isLoading ? (
        <Center flex={1}>
          <Spinner size="large" color="$primary800" />
        </Center>
      ) : (
        <FlatList
          data={filteredExpenses}
          keyExtractor={item => item.id}
          renderItem={renderExpenseItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          ListEmptyComponent={
            <Box py="$10" alignItems="center">
              <Text size="sm" color="$text400">No expenditure logged for this month.</Text>
            </Box>
          }
        />
      )}

      {/* Add Expenditure Bottom Sheet Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Box flex={1} bg="rgba(0,0,0,0.5)" justifyContent="flex-end">
          <Box bg="$white" borderTopLeftRadius={24} borderTopRightRadius={24} p="$6" pb="$8">
            <VStack space="xl">
              <HStack justifyContent="space-between" alignItems="center">
                <Heading size="md" color="$text900" fontWeight="$black">Record Expenditure</Heading>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Text size="sm" color="$text500" fontWeight="$medium">Cancel</Text>
                </Pressable>
              </HStack>

              {/* Category Picker Selector */}
              <VStack space="xs">
                <Text size="xs" fontWeight="$bold" color="$text700">Select Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <HStack space="xs" pb="$2">
                    {CATEGORIES.map(c => {
                      const isSelected = selectedCategory === c.id;
                      return (
                        <Pressable
                          key={c.id}
                          onPress={() => setSelectedCategory(c.id)}
                          bg={isSelected ? c.bgColor : '$backgroundLight50'}
                          borderWidth={1}
                          borderColor={isSelected ? c.color : '$borderLight'}
                          px="$4"
                          py="$3"
                          rounded="$xl"
                          alignItems="center"
                          minWidth={110}
                        >
                          <Icon as={c.icon} color={isSelected ? c.color : '$text400'} size="sm" mb="$1" />
                          <Text size="2xs" fontWeight="$bold" color={isSelected ? '$text900' : '$text500'}>{c.label}</Text>
                        </Pressable>
                      );
                    })}
                  </HStack>
                </ScrollView>
              </VStack>

              {/* Amount Input */}
              <VStack space="xs">
                <Text size="xs" fontWeight="$bold" color="$text700">Amount ({currency})</Text>
                <Input variant="outline" size="md" borderRadius={12}>
                  <InputField
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                  />
                </Input>
              </VStack>

              {/* Note/Description Input */}
              <VStack space="xs">
                <Text size="xs" fontWeight="$bold" color="$text700">Description / Note</Text>
                <Input variant="outline" size="md" borderRadius={12}>
                  <InputField
                    placeholder="e.g. Electricity bill, Staff bonus..."
                    value={description}
                    onChangeText={setDescription}
                  />
                </Input>
              </VStack>

              {/* Submit Button */}
              <Button
                size="lg"
                action="primary"
                bg="$primary800"
                borderRadius={14}
                onPress={handleAddExpense}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Spinner color="$white" mr="$2" /> : null}
                <ButtonText fontWeight="$bold">Save Expenditure</ButtonText>
              </Button>
            </VStack>
          </Box>
        </Box>
      </Modal>
    </ScreenWrapper>
  );
};

export default ExpenseManagementScreen;
