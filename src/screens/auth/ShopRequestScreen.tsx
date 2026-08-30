import React, { useState } from 'react';
import { ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
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
} from '@gluestack-ui/themed';
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

const ShopRequestScreen: React.FC<Props> = ({ navigation }) => {
  const [ownerName, setOwnerName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopType, setShopType] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const shopRepo = new ShopRepository();

  const handleSubmit = async () => {
    if (!ownerName || !whatsappNumber || !shopName || !shopType || !location) {
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
      });
      Alert.alert(
        "Request Submitted",
        "Your request has been received. Our team will contact you on WhatsApp with your unique shop code shortly.",
        [{ text: "Great!", onPress: () => navigation.navigate('Landing') }]
      );
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
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

          <Box bg="$white" p="$6" rounded="$3xl" borderWidth={1} borderColor="$borderLight" shadowColor="$primary800">
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

              <Button
                size="lg"
                onPress={handleSubmit}
                isDisabled={loading}
                borderRadius={14}
                bg="$primary800"
                mt="$4"
              >
                {loading ? <Spinner color="white" /> : <ButtonText fontWeight="$bold">Submit Registration</ButtonText>}
              </Button>
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
    </Box>
  );
};

export default ShopRequestScreen;
