import React, { useState, useEffect } from 'react';
import { ScrollView } from 'react-native';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  Heading,
  ModalCloseButton,
  Icon,
  ModalBody,
  VStack,
  HStack,
  Text,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  Input,
  InputField,
  Button,
  ButtonText,
  Spinner,
  CloseIcon,
  Pressable,
  Box,
} from '@gluestack-ui/themed';
import { CheckCircle } from 'lucide-react-native';

const PLANS = ['STARTER', 'BUSINESS', 'PREMIUM'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shop: any;
  planForm: {
    plan: string;
    planExpiresAt: string;
    paymentMethod: string;
    notes: string;
  };
  setPlanForm: (form: any) => void;
  onSave: () => void;
  processing: boolean;
}

const ManageShopPlanModal: React.FC<Props> = ({
  isOpen,
  onClose,
  shop,
  planForm,
  setPlanForm,
  onSave,
  processing,
}) => {
  const [years, setYears] = useState(0);
  const [months, setMonths] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setYears(0);
      setMonths(1);
      if (!planForm.planExpiresAt) {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        setPlanForm(prev => ({ ...prev, planExpiresAt: d.toISOString().split('T')[0] }));
      }
    }
  }, [isOpen]);

  if (!shop) return null;

  const updateExpiryDate = (newYears: number, newMonths: number) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + newYears);
    d.setMonth(d.getMonth() + newMonths);
    const dateStr = d.toISOString().split('T')[0];
    setPlanForm((prev: any) => ({ ...prev, planExpiresAt: dateStr }));
  };

  const handleAdjustMonths = (delta: number) => {
    const nextMonths = Math.max(0, months + delta);
    if (nextMonths === 0 && years === 0) return; // Keep at least 1 month or year
    setMonths(nextMonths);
    updateExpiryDate(years, nextMonths);
  };

  const handleAdjustYears = (delta: number) => {
    const nextYears = Math.max(0, years + delta);
    if (nextYears === 0 && months === 0) return;
    setYears(nextYears);
    updateExpiryDate(nextYears, months);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalBackdrop />
      <ModalContent rounded="$3xl" bg="$white" p="$2">
        <ModalHeader>
          <VStack space="2xs">
            <Heading size="md" color="$text900">Renew Plan & Manual Payment</Heading>
            <Text size="xs" color="$text500">{shop.name} ({shop.shopCode || shop.id})</Text>
          </VStack>
          <ModalCloseButton>
            <Icon as={CloseIcon} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <ScrollView showsVerticalScrollIndicator={false}>
            <VStack space="lg" py="$2">
              {/* Plan Selection */}
              <FormControl>
                <FormControlLabel mb="$2">
                  <FormControlLabelText fontWeight="$bold" color="$text700">Select Plan Tier</FormControlLabelText>
                </FormControlLabel>
                <HStack space="sm">
                  {PLANS.map((p) => {
                    const isSelected = planForm.plan?.toUpperCase() === p;
                    return (
                      <Pressable
                        key={p}
                        flex={1}
                        p="$3"
                        rounded="$xl"
                        borderWidth={2}
                        borderColor={isSelected ? '$primary800' : '$borderLight'}
                        bg={isSelected ? '$primary50' : '$backgroundLight50'}
                        onPress={() => setPlanForm({ ...planForm, plan: p })}
                      >
                        <VStack alignItems="center" space="xs">
                          <Text size="xs" fontWeight="$bold" color={isSelected ? '$primary800' : '$text700'}>
                            {p}
                          </Text>
                          {isSelected && <Icon as={CheckCircle} size="xs" color="$primary800" />}
                        </VStack>
                      </Pressable>
                    );
                  })}
                </HStack>
              </FormControl>

              {/* Duration Steppers (Months & Years) */}
              <VStack space="sm">
                <FormControlLabel>
                  <FormControlLabelText fontWeight="$bold" color="$text700">Subscription Duration (Extend from Today)</FormControlLabelText>
                </FormControlLabel>

                <HStack space="md">
                  {/* Months Stepper */}
                  <Box flex={1} bg="$backgroundLight50" p="$3" rounded="$2xl" borderWidth={1} borderColor="$borderLight">
                    <VStack space="xs" alignItems="center">
                      <Text size="xs" color="$text500" fontWeight="$bold">MONTHS</Text>
                      <HStack space="md" alignItems="center">
                        <Button
                          size="xs"
                          variant="outline"
                          action="secondary"
                          rounded="$full"
                          px="$3"
                          py="$1"
                          onPress={() => handleAdjustMonths(-1)}
                        >
                          <ButtonText fontSize={16} fontWeight="$bold">-</ButtonText>
                        </Button>
                        <Heading size="md" color="$primary800">{months}</Heading>
                        <Button
                          size="xs"
                          variant="outline"
                          action="secondary"
                          rounded="$full"
                          px="$3"
                          py="$1"
                          onPress={() => handleAdjustMonths(1)}
                        >
                          <ButtonText fontSize={16} fontWeight="$bold">+</ButtonText>
                        </Button>
                      </HStack>
                    </VStack>
                  </Box>

                  {/* Years Stepper */}
                  <Box flex={1} bg="$backgroundLight50" p="$3" rounded="$2xl" borderWidth={1} borderColor="$borderLight">
                    <VStack space="xs" alignItems="center">
                      <Text size="xs" color="$text500" fontWeight="$bold">YEARS</Text>
                      <HStack space="md" alignItems="center">
                        <Button
                          size="xs"
                          variant="outline"
                          action="secondary"
                          rounded="$full"
                          px="$3"
                          py="$1"
                          onPress={() => handleAdjustYears(-1)}
                        >
                          <ButtonText fontSize={16} fontWeight="$bold">-</ButtonText>
                        </Button>
                        <Heading size="md" color="$primary800">{years}</Heading>
                        <Button
                          size="xs"
                          variant="outline"
                          action="secondary"
                          rounded="$full"
                          px="$3"
                          py="$1"
                          onPress={() => handleAdjustYears(1)}
                        >
                          <ButtonText fontSize={16} fontWeight="$bold">+</ButtonText>
                        </Button>
                      </HStack>
                    </VStack>
                  </Box>
                </HStack>
              </VStack>

              {/* Expiry Date Display / Manual Edit */}
              <FormControl isRequired>
                <FormControlLabel mb="$2">
                  <FormControlLabelText fontWeight="$bold" color="$text700">Calculated Expiry Date (YYYY-MM-DD)</FormControlLabelText>
                </FormControlLabel>
                <Input borderRadius={12} borderWidth={1} borderColor="$borderLight">
                  <InputField
                    placeholder="YYYY-MM-DD"
                    value={planForm.planExpiresAt}
                    onChangeText={(text) => setPlanForm({ ...planForm, planExpiresAt: text })}
                  />
                </Input>
              </FormControl>

              {/* Payment Method / Notes */}
              <FormControl>
                <FormControlLabel mb="$2">
                  <FormControlLabelText fontWeight="$bold" color="$text700">Manual Payment Notes / Reference</FormControlLabelText>
                </FormControlLabel>
                <Input borderRadius={12} borderWidth={1} borderColor="$borderLight">
                  <InputField
                    placeholder="e.g. Bank transfer, Cash paid, Ref #..."
                    value={planForm.notes}
                    onChangeText={(text) => setPlanForm({ ...planForm, notes: text })}
                  />
                </Input>
              </FormControl>

              <Box bg="$backgroundLight50" p="$3" rounded="$xl">
                <Text size="xs" color="$text600">
                  ℹ️ Use the Month and Year steppers or enter a custom date. Saving will update the shop's subscription expiry date and record the manual payment.
                </Text>
              </Box>
            </VStack>
          </ScrollView>
        </ModalBody>
        <HStack space="md" p="$4" justifyContent="flex-end">
          <Button variant="outline" action="secondary" onPress={onClose} borderRadius="$xl" px="$5">
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button action="primary" onPress={onSave} borderRadius="$xl" bg="$primary800" px="$6">
            {processing ? <Spinner color="white" /> : <ButtonText>Save & Renew</ButtonText>}
          </Button>
        </HStack>
      </ModalContent>
    </Modal>
  );
};

export default ManageShopPlanModal;
