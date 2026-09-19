import React, { useState } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, I18nManager, StatusBar } from 'react-native';
import { displayAlert } from '../../utils/alert';
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
  Modal,
  ModalBody,
  ModalContent,
  ModalBackdrop,
  Spinner,
  Pressable,
  CheckCircleIcon,
  Center,
  GlobeIcon,
  MailIcon,
} from '@gluestack-ui/themed';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import SilkyButton from '../../components/common/SilkyButton';
import { useAuthContext } from '../../auth/AuthContext';
import type { StackScreenProps } from '@react-navigation/stack';
import { User, MapPin, Globe } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { ShopRepository } from '../../repositories/ShopRepository';
import { getAppShadow } from '../../utils/platformStyles';
import { COUNTRIES, getCountryData } from '../../utils/geoData';
import { useTranslation } from 'react-i18next';
import SearchableCountryPicker from '../../components/common/SearchableCountryPicker';
import firebase from '../../firebase-config';

type Props = StackScreenProps<RootStackParamList, 'ShopRequest'>;

const SHOP_TYPES = [
  'Provision',
  'Supermarket',
  'Electronics',
  'Mobile & Accessories',
  'Electrical',
  'Spare Parts',
  'Hardware',
  'Construction Materials',
  'Clothing',
  'Boutique',
  'Pharmacy',
  'Beauty & Cosmetics',
  'Restaurant & Food',
  'Stationery & Bookshop',
  'Furniture',
  'Jewelry',
  'Auto Dealer',
  'Other'
];

const LANGUAGES = [
  { label: 'English', code: 'en' },
  { label: 'Français', code: 'fr' },
  { label: 'Español', code: 'es' },
  { label: 'العربية', code: 'ar' },
];

const SHOP_CATEGORIES = [
  {
    id: 'STARTER',
    label: 'Starter',
    description: 'Max 3 staff including owner',
    basePrice: 100,
    color: '$blue600',
    bg: '$blue50'
  },
  {
    id: 'BUSINESS',
    label: 'Business',
    description: '4 or more staff',
    basePrice: 200,
    color: '$purple600',
    bg: '$purple50'
  },
  {
    id: 'PREMIUM',
    label: 'Premium',
    description: 'Shop with branches (up to 5)',
    basePrice: 300,
    color: '$amber600',
    bg: '$amber50'
  },
];

const ShopRequestScreen: React.FC<Props> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const flexDir = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' : 'left';

  const [currentStep, setCurrentStep] = useState(1);
  const [ownerName, setOwnerName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopType, setShopType] = useState('');
  const [shopCategory, setShopCategory] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('Ghana');
  const [currency, setCurrency] = useState('GH₵');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [email, setEmail] = useState('');

  const { user, isLoading: isAuthLoading } = useAuthContext();
  const shopRepo = new ShopRepository();
  const insets = useSafeAreaInsets();

  const handleCountrySelect = (countryName: string) => {
    const selected = getCountryData(countryName);
    setCountry(selected.name);
    setCurrency(selected.symbol);
  };

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  const getConvertedPrice = (basePrice: number) => {
    const countryObj = getCountryData(country);
    const rate = countryObj.rate;
    const converted = basePrice / rate;
    return converted.toFixed(2);
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!ownerName || !whatsappNumber || !shopName || !shopType || !email) {
        displayAlert(t('common.missing_info'), "Please fill in all fields including a valid contact email.");
        return;
      }
    }
    if (currentStep === 2) {
      if (!country || !location) {
        displayAlert(t('common.missing_info'), t('common.missing_info_desc'));
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    console.log('ShopRequestScreen: handleSubmit triggered');

    if (!shopCategory) {
      console.warn('ShopRequestScreen: No category selected');
      displayAlert(t('common.error'), t('common.select_category_error'));
      return;
    }

    const selectedCategory = SHOP_CATEGORIES.find(c => c.id === shopCategory);
    const registrationFee = selectedCategory ? selectedCategory.basePrice : 0;

    setLoading(true);
    try {
      console.log('ShopRequestScreen: Submitting shop request...', {
        shopName,
        shopCategory,
        email
      });

      await shopRepo.submitShopRequest({
        userId: '',
        userEmail: email,
        ownerName,
        whatsappNumber,
        shopName,
        shopType,
        shopCategory,
        registrationFee,
        location,
        country,
        currency,
      });

      console.log('ShopRequestScreen: Submission success');

      if (Platform.OS === 'web') {
        setShowSuccess(true);
      } else {
        displayAlert(
          t('auth.request_submitted'),
          t('auth.request_submitted_desc'),
          [{ text: "OK", onPress: () => navigation.navigate('Landing') }]
        );
      }
    } catch (e: any) {
      console.error('ShopRequestScreen: Submission error', e);
      displayAlert(t('common.error'), e.message || "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigation.navigate('Landing');
  };

  if (isAuthLoading) {
    return (
      <Center flex={1} bg="$backgroundLight50">
        <Spinner size="large" color="$primary800" />
      </Center>
    );
  }

  return (
    <ScreenWrapper scrollable withHeader>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'android' ? 'height' : 'padding'}
        style={{ flex: 1 }}
      >
        <VStack space="md" pb="$10" pt={Math.max(insets.top, 10)}>
          <HStack justifyContent="space-between" alignItems="center" mt="$2" mb="$6">
            <Button
              variant="link"
              onPress={() => navigation.goBack()}
              p="$0"
              w="$10"
            >
              <ButtonIcon as={ArrowLeftIcon} size="xl" color="$primary800" />
            </Button>

            <Menu trigger={({ ...triggerProps }) => (
                <Pressable {...triggerProps} p="$2" rounded="$full" bg="$primary50">
                  <HStack space="xs" alignItems="center">
                    <Icon as={Globe} size="sm" color="$primary800" />
                    <Text size="xs" color="$primary800" fontWeight="$bold">{LANGUAGES.find(l => l.code === i18n.language)?.label || 'Language'}</Text>
                    <Icon as={ChevronDownIcon} size="xs" color="$primary800" />
                  </HStack>
                </Pressable>
              )}>
              {LANGUAGES.map(lang => (
                <MenuItem key={lang.code} textValue={lang.label} onPress={() => handleLanguageChange(lang.code)}>
                  <MenuItemLabel size="sm">{lang.label}</MenuItemLabel>
                </MenuItem>
              ))}
            </Menu>
          </HStack>

          <VStack space="xs" mb="$6">
            <Heading size="2xl" color="$text900" fontWeight="$black" textAlign={textAlign}>{t('auth.register_business')}</Heading>
            <Text size="md" color="$text600" textAlign={textAlign}>{t('auth.register_business_desc')}</Text>
          </VStack>

          <Box bg="$white" p="$6" rounded="$3xl" borderWidth={1} borderColor="$borderLight" style={{ ...getAppShadow({ offsetY: 6, radius: 18, color: 'rgba(110,59,230,0.08)' }) } as any}>
            <VStack space="xl">
              {/* Step Indicator */}
              <HStack space="md" mb="$4" justifyContent="center" flexDirection={flexDir}>
                {[1, 2, 3].map(step => (
                  <Center key={step} w={30} h={30} rounded="$full" bg={currentStep >= step ? '$primary600' : '$backgroundLight200'}>
                    <Text color="white" size="xs" fontWeight="$bold">{step}</Text>
                  </Center>
                ))}
              </HStack>

              {currentStep === 1 && (
                <VStack space="lg">
                  <Heading size="md" color="$primary700" textAlign={textAlign}>{t('auth.business_identity')}</Heading>
                  <FormControl isRequired>
                    <FormControlLabel style={{ flexDirection: flexDir }}><FormControlLabelText>{t('auth.full_name')}</FormControlLabelText></FormControlLabel>
                    <Input variant="outline" size="md" borderRadius={12} style={{ flexDirection: flexDir }}>
                      <InputSlot pl="$3"><Icon as={User} size="sm" /></InputSlot>
                      <InputField placeholder={t('auth.owner_name_placeholder')} value={ownerName} onChangeText={setOwnerName} autoCorrect={false} autoCapitalize="words" textAlign={textAlign} />
                    </Input>
                  </FormControl>

                  <FormControl isRequired>
                    <FormControlLabel style={{ flexDirection: flexDir }}><FormControlLabelText>{t('auth.whatsapp_number')}</FormControlLabelText></FormControlLabel>
                    <Input variant="outline" size="md" borderRadius={12} style={{ flexDirection: flexDir }}>
                      <InputSlot pl="$3"><Icon as={PhoneIcon} color="$success600" /></InputSlot>
                      <InputField placeholder={t('auth.whatsapp_placeholder')} value={whatsappNumber} onChangeText={setWhatsappNumber} keyboardType="phone-pad" autoCorrect={false} textAlign={textAlign} />
                    </Input>
                  </FormControl>

                  <FormControl isRequired>
                    <FormControlLabel style={{ flexDirection: flexDir }}><FormControlLabelText>{t('auth.shop_name')}</FormControlLabelText></FormControlLabel>
                    <Input variant="outline" size="md" borderRadius={12} style={{ flexDirection: flexDir }}>
                      <InputField placeholder={t('auth.shop_name_placeholder')} value={shopName} onChangeText={setShopName} autoCorrect={false} autoCapitalize="words" textAlign={textAlign} />
                    </Input>
                  </FormControl>

                  <FormControl isRequired>
                    <FormControlLabel style={{ flexDirection: flexDir }}><FormControlLabelText>Contact Email Address</FormControlLabelText></FormControlLabel>
                    <Input variant="outline" size="md" borderRadius={12} style={{ flexDirection: flexDir }}>
                      <InputSlot pl="$3"><InputIcon as={MailIcon} color="$primary600" /></InputSlot>
                      <InputField placeholder="owner@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textAlign={textAlign} />
                    </Input>
                  </FormControl>

                  <VStack space="xs">
                    <Text size="sm" fontWeight="$bold" color="$text900" textAlign={textAlign}>{t('auth.business_category')}</Text>
                    <Menu trigger={({ ...triggerProps }) => (
                        <Pressable {...triggerProps} borderWidth={1} borderColor="$borderLight" p="$3" rounded="$lg">
                          <HStack justifyContent="space-between" alignItems="center" flexDirection={flexDir}>
                            <Text size="sm" color={shopType ? '$text900' : '$text400'}>{shopType || t('auth.select_category')}</Text>
                            <Icon as={ChevronDownIcon} />
                          </HStack>
                        </Pressable>
                      )}>
                      {SHOP_TYPES.map(type => (
                        <MenuItem key={type} textValue={type} onPress={() => setShopType(type)}>
                          <MenuItemLabel size="sm">{type}</MenuItemLabel>
                        </MenuItem>
                      ))}
                    </Menu>
                  </VStack>

                  <Button size="lg" onPress={nextStep} borderRadius={14} bg="$primary800" mt="$4">
                    <ButtonText fontWeight="$bold">{t('auth.next_location')}</ButtonText>
                  </Button>
                </VStack>
              )}

              {currentStep === 2 && (
                <VStack space="lg">
                  <Heading size="md" color="$primary700" textAlign={textAlign}>{t('auth.location_currency')}</Heading>
                  <VStack space="xs">
                    <Text size="sm" fontWeight="$bold" color="$text900" textAlign={textAlign}>{t('auth.country')}</Text>
                    <Pressable
                      onPress={() => setIsCountryPickerOpen(true)}
                      borderWidth={1}
                      borderColor="$borderLight"
                      p="$3"
                      rounded="$lg"
                    >
                      <HStack justifyContent="space-between" alignItems="center" flexDirection={flexDir}>
                        <Text size="sm" color={country ? '$text900' : '$text400'}>{country || t('auth.select_country')}</Text>
                        <Icon as={ChevronDownIcon} />
                      </HStack>
                    </Pressable>
                  </VStack>

                  <SearchableCountryPicker
                    isOpen={isCountryPickerOpen}
                    onClose={() => setIsCountryPickerOpen(false)}
                    onSelect={handleCountrySelect}
                    selectedCountry={country}
                  />

                  <VStack space="xs">
                    <Text size="sm" fontWeight="$bold" color="$text900" textAlign={textAlign}>{t('auth.currency_auto')}</Text>
                    <Box borderWidth={1} borderColor="$borderLight" p="$3" rounded="$lg" bg="$backgroundLight50">
                       <Text size="sm" color="$text900" textAlign={textAlign}>{currency}</Text>
                    </Box>
                  </VStack>

                  <FormControl isRequired>
                    <FormControlLabel style={{ flexDirection: flexDir }}><FormControlLabelText>{t('auth.business_address')}</FormControlLabelText></FormControlLabel>
                    <Input variant="outline" size="md" borderRadius={12} style={{ flexDirection: flexDir }}>
                      <InputSlot pl="$3"><Icon as={MapPin} size="sm" /></InputSlot>
                      <InputField placeholder={t('auth.full_address_placeholder')} value={location} onChangeText={setLocation} multiline autoCorrect={false} textAlign={textAlign} />
                    </Input>
                  </FormControl>

                  <HStack space="md" mt="$4" flexDirection={flexDir}>
                    <Button flex={1} variant="outline" action="secondary" onPress={prevStep} borderRadius={14}>
                      <ButtonText>{t('auth.back')}</ButtonText>
                    </Button>
                    <Button flex={2} onPress={nextStep} borderRadius={14} bg="$primary800">
                      <ButtonText fontWeight="$bold">{t('auth.next_plan')}</ButtonText>
                    </Button>
                  </HStack>
                </VStack>
              )}

              {currentStep === 3 && (
                <VStack space="lg">
                  <Heading size="md" color="$primary700" textAlign={textAlign}>{t('auth.choose_plan')}</Heading>
                  <VStack space="sm">
                    {SHOP_CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat.id}
                        onPress={() => setShopCategory(cat.id)}
                        p="$4"
                        rounded="$xl"
                        borderWidth={2}
                        borderColor={shopCategory === cat.id ? cat.color : '$borderLight'}
                        bg={shopCategory === cat.id ? cat.bg : '$white'}
                      >
                        <HStack justifyContent="space-between" alignItems="center" flexDirection={flexDir}>
                          <VStack space="xs" flex={1}>
                            <HStack space="sm" alignItems="center" flexDirection={flexDir}>
                              <Text fontWeight="$bold" color={shopCategory === cat.id ? cat.color : '$text900'}>{cat.label}</Text>
                              {shopCategory === cat.id && <Icon as={CheckCircleIcon} size="xs" color={cat.color} />}
                            </HStack>
                            <Text size="xs" color="$text500" textAlign={textAlign}>{cat.description}</Text>
                          </VStack>
                          <VStack alignItems={isRTL ? 'flex-start' : 'flex-end'}>
                            <Text size="sm" fontWeight="$bold" color={cat.color}>
                              {currency}{getConvertedPrice(cat.basePrice)}
                            </Text>
                            <Text size="2xs" color="$text400">{t('auth.per_annum')}</Text>
                          </VStack>
                        </HStack>
                      </Pressable>
                    ))}
                  </VStack>

                  <HStack space="md" mt="$4" flexDirection={flexDir}>
                    <Button flex={1} variant="outline" action="secondary" onPress={prevStep} borderRadius={14}>
                      <ButtonText>{t('auth.back')}</ButtonText>
                    </Button>
                    <Button flex={2} onPress={handleSubmit} isDisabled={loading} borderRadius={14} bg="$primary800">
                      {loading ? <Spinner color="white" /> : <ButtonText fontWeight="$bold">{t('auth.submit_registration')}</ButtonText>}
                    </Button>
                  </HStack>
                </VStack>
              )}
            </VStack>
          </Box>

          <HStack space="sm" mt="$8" p="$2" alignItems="center" bg="$primary50" rounded="$lg" flexDirection={flexDir}>
            <Icon as={User} size="xs" color="$primary800" />
            <Text size="xs" color="$primary800" flex={1} textAlign={textAlign}>
              {t('auth.admin_verify_note')}
            </Text>
          </HStack>
        </VStack>
      </KeyboardAvoidingView>

      {/* Robust Success Modal for Web */}
      <Modal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
      >
        <ModalBackdrop />
        <ModalContent bg="$white" p="$8" rounded="$3xl" maxWidth={400}>
          <ModalBody alignItems="center">
            <Center w={80} h={80} rounded="$full" bg="$success100" mb="$4">
              <Icon as={CheckCircleIcon} size="xl" color="$success600" />
            </Center>
            <Heading size="lg" textAlign="center" mb="$2">{t('auth.request_submitted')}</Heading>
            <Text textAlign="center" color="$text600" mb="$6">
              {t('auth.request_submitted_desc')}
            </Text>
            <SilkyButton onPress={handleSuccessClose}>
              {t('auth.back_to_start')}
            </SilkyButton>
          </ModalBody>
        </ModalContent>
      </Modal>
    </ScreenWrapper>
  );
};

export default ShopRequestScreen;
