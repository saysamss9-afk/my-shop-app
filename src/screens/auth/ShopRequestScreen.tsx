import React, { useState } from 'react';
import { ScrollView, Alert, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  ButtonText,
  ButtonIcon,
  Input,
  InputField,
  InputSlot,
  InputIcon,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  Icon,
  ArrowLeftIcon,
  PhoneIcon,
  ChevronDownIcon,
  Menu,
  MenuItem,
  MenuItemLabel,
  Spinner,
  Pressable,
  CheckCircleIcon,
  Center,
} from '@gluestack-ui/themed';
import SilkyButton from '../../components/common/SilkyButton';
import { StackScreenProps } from '@react-navigation/stack';
import { User, MapPin } from 'lucide-react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { ShopRepository } from '../../repositories/ShopRepository';

type Props = StackScreenProps<RootStackParamList, 'ShopRequest'>;

const SHOP_TYPES = [
  'Provision',
  'Supermarket',
  'Electrical',
  'Spare Parts',
  'Clothing',
  'Pharmacy',
  'Hardware',
  'Other'
];

const CURRENCIES = [
  { label: 'GHS (Ghana Cedi)', value: 'GH₵' },
  { label: 'USD (US Dollar)', value: '$' },
  { label: 'NGN (Nigeria Naira)', value: '₦' },
  { label: 'KES (Kenya Shilling)', value: 'KSh' },
  { label: 'EUR (Euro)', value: '€' },
  { label: 'GBP (Pound)', value: '£' },
];

const ShopRequestScreen: React.FC<Props> = ({ navigation }) => {
  const [ownerName, setOwnerName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopType, setShopType] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('Ghana');
  const [currency, setCurrency] = useState('GH₵');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const shopRepo = new ShopRepository();

  const handleSubmit = async () => {
    console.log('ShopRequestScreen: Attempting to submit registration...');
    if (!ownerName || !whatsappNumber || !shopName || !shopType || !location || !country || !currency) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      await shopRepo.submitShopRequest({
        ownerName,
        whatsappNumber,
        shopName,
        shopType,
        location,
        country,
        currency,
      });
      console.log('ShopRequestScreen: Submission successful!');

      if (Platform.OS === 'web') {
        setShowSuccess(true);
      } else {
        Alert.alert(
          "Request Submitted",
          "Your request has been received. Our team will contact you on WhatsApp with your unique shop code shortly.",
          [{ text: "OK", onPress: () => navigation.navigate('Landing') }]
        );
      }
    } catch (e: any) {
      console.error('ShopRequestScreen: Submission error:', e);
      Alert.alert("Error", e.message || "Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigation.navigate('Landing');
  };

  return (
    <Box flex={1} bg="$backgroundLight50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'android' ? 'height' : 'padding'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
          <VStack space="md" mt="$5" mb="$6">
            <Button
              variant="link"
              onPress={() => navigation.goBack()}
              p="$0"
              justifyContent="flex-start"
              w="$10"
            >
              <ButtonIcon as={ArrowLeftIcon} size="xl" color="$primary800" />
            </Button>
            <VStack space="xs">
              <Heading size="2xl" color="$text900" fontWeight="$black">Register Business</Heading>
              <Text size="md" color="$text600">Provide details to get your shop code.</Text>
            </VStack>
          </VStack>

          <Box bg="$white" p="$6" rounded="$3xl" borderWidth={1} borderColor="$borderLight" style={{ ...platformShadow({ offsetY: 6, radius: 18, color: 'rgba(110,59,230,0.08)' }) }}>
            <VStack space="lg">
              <FormControl isRequired>
                <FormControlLabel>
                  <FormControlLabelText>Full Name</FormControlLabelText>
                </FormControlLabel>
                <Input variant="outline" size="md" borderRadius={12}>
                  <InputSlot pl="$3">
                    <Icon as={User} size="sm" />
                  </InputSlot>
                  <InputField
                    placeholder="Owner Name"
                    value={ownerName}
                    onChangeText={setOwnerName}
                  />
                </Input>
              </FormControl>

              <FormControl isRequired>
                <FormControlLabel>
                  <FormControlLabelText>WhatsApp Number</FormControlLabelText>
                </FormControlLabel>
                <Input variant="outline" size="md" borderRadius={12}>
                  <InputSlot pl="$3">
                    <Icon as={PhoneIcon} color="$success600" />
                  </InputSlot>
                  <InputField
                    placeholder="e.g. +234..."
                    value={whatsappNumber}
                    onChangeText={setWhatsappNumber}
                    keyboardType="phone-pad"
                  />
                </Input>
              </FormControl>

              <FormControl isRequired>
                <FormControlLabel>
                  <FormControlLabelText>Shop Name</FormControlLabelText>
                </FormControlLabel>
                <Input variant="outline" size="md" borderRadius={12}>
                  <InputField
                    placeholder="Official Business Name"
                    value={shopName}
                    onChangeText={setShopName}
                  />
                </Input>
              </FormControl>

              <VStack space="xs">
                <Text size="sm" fontWeight="$bold" color="$text900">Business Category</Text>
                <Menu
                  trigger={({ ...triggerProps }) => (
                    <Pressable {...triggerProps} borderWidth={1} borderColor="$borderLight" p="$3" rounded="$lg">
                      <HStack justifyContent="space-between" alignItems="center">
                        <Text size="sm" color={shopType ? '$text900' : '$text400'}>
                          {shopType || 'Select Category'}
                        </Text>
                        <Icon as={ChevronDownIcon} />
                      </HStack>
                    </Pressable>
                  )}
                >
                  {SHOP_TYPES.map(type => (
                    <MenuItem key={type} textValue={type} onPress={() => setShopType(type)}>
                      <MenuItemLabel size="sm">{type}</MenuItemLabel>
                    </MenuItem>
                  ))}
                </Menu>
              </VStack>

              <FormControl isRequired>
                <FormControlLabel>
                  <FormControlLabelText>Country</FormControlLabelText>
                </FormControlLabel>
                <Input variant="outline" size="md" borderRadius={12}>
                  <InputField
                    placeholder="e.g. Ghana, Nigeria"
                    value={country}
                    onChangeText={setCountry}
                  />
                </Input>
              </FormControl>

              <VStack space="xs">
                <Text size="sm" fontWeight="$bold" color="$text900">Store Currency</Text>
                <Menu
                  trigger={({ ...triggerProps }) => (
                    <Pressable {...triggerProps} borderWidth={1} borderColor="$borderLight" p="$3" rounded="$lg">
                      <HStack justifyContent="space-between" alignItems="center">
                        <Text size="sm" color={currency ? '$text900' : '$text400'}>
                          {CURRENCIES.find(c => c.value === currency)?.label || 'Select Currency'}
                        </Text>
                        <Icon as={ChevronDownIcon} />
                      </HStack>
                    </Pressable>
                  )}
                >
                  {CURRENCIES.map(c => (
                    <MenuItem key={c.value} textValue={c.label} onPress={() => setCurrency(c.value)}>
                      <MenuItemLabel size="sm">{c.label}</MenuItemLabel>
                    </MenuItem>
                  ))}
                </Menu>
              </VStack>

              <FormControl isRequired>
                <FormControlLabel>
                  <FormControlLabelText>Business Location</FormControlLabelText>
                </FormControlLabel>
                <Input variant="outline" size="md" borderRadius={12}>
                  <InputSlot pl="$3">
                    <Icon as={MapPin} size="sm" />
                  </InputSlot>
                  <InputField
                    placeholder="Full Address"
                    value={location}
                    onChangeText={setLocation}
                    multiline
                  />
                </Input>
              </FormControl>

              <SilkyButton onPress={handleSubmit} loading={loading} disabled={loading}>
                Submit Registration
              </SilkyButton>
            </VStack>
          </Box>

          <HStack space="sm" mt="$8" p="$2" alignItems="center" bg="$primary50" rounded="$lg">
            <Icon as={User} size="xs" color="$primary800" />
            <Text size="xs" color="$primary800" flex={1}>
              The admin will verify your details and generate a shop code for you.
            </Text>
          </HStack>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Robust Success Modal for Web */}
      <Modal
        transparent={true}
        visible={showSuccess}
        animationType="fade"
      >
        <Box flex={1} bg="rgba(0,0,0,0.5)" justifyContent="center" alignItems="center" p="$4">
          <Box bg="$white" p="$8" rounded="$3xl" w="100%" maxWidth={400} alignItems="center">
            <Center w={80} h={80} rounded="$full" bg="$success100" mb="$4">
              <Icon as={CheckCircleIcon} size="xl" color="$success600" />
            </Center>
            <Heading size="lg" textAlign="center" mb="$2">Request Submitted!</Heading>
            <Text textAlign="center" color="$text600" mb="$6">
              Your request has been received. Our team will contact you on WhatsApp with your unique shop code shortly.
            </Text>
            <SilkyButton onPress={handleSuccessClose}>
              Back to Start
            </SilkyButton>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default ShopRequestScreen;
