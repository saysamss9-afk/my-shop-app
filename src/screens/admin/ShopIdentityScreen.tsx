import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Icon,
  Pressable,
  Input,
  InputField,
  InputSlot,
  Button,
  ButtonText,
  ButtonIcon,
  Divider,
  Spinner,
} from '@gluestack-ui/themed';
import {
  ArrowLeft,
  Store,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  Printer,
  Save,
  Building,
  CheckCircle2,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import ModernLoader from '../../components/common/ModernLoader';
import { getDBConnection } from '../../db/database';
import { ShopRepository } from '../../repositories/ShopRepository';
import { PrintingService } from '../../services/PrintingService';
import { displayAlert } from '../../utils/alert';
import { getAppShadow } from '../../utils/platformStyles';
import { useTranslation } from 'react-i18next';
import { useSync } from '../../sync/SyncContext';

const ShopIdentityScreen = ({ route, navigation }: any) => {
  const { shopId } = route.params;
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const flexDir = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' : 'left';
  const insets = useSafeAreaInsets();
  const { triggerSync } = useSync();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Identity Form State
  const [shopName, setShopName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [currency, setCurrency] = useState('$');

  const loadShopData = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = await getDBConnection();
      const results = await db.executeSql(
        'SELECT name, companyName, address, location, phone, email, workingHours, currency FROM Shop WHERE TRIM(id) = TRIM(?)',
        [shopId]
      );
      if (results[0]?.rows?.length > 0) {
        const item = results[0].rows.item(0);
        setShopName(item.name || '');
        setCompanyName(item.companyName || '');
        setLocation(item.location || item.address || '');
        setPhone(item.phone || '');
        setEmail(item.email || '');
        setWorkingHours(item.workingHours || '');
        setCurrency(item.currency || '$');
      }
    } catch (e: any) {
      console.error('Failed to load shop identity data:', e);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    loadShopData();
  }, [loadShopData]);

  const handleSave = async () => {
    if (!shopName.trim()) {
      displayAlert('Required Field', 'Shop Name is required.');
      return;
    }

    setIsSaving(true);
    try {
      const repo = new ShopRepository();
      await repo.updateShopIdentity(shopId, {
        name: shopName.trim(),
        companyName: companyName.trim(),
        address: location.trim(),
        location: location.trim(),
        phone: phone.trim(),
        email: email.trim(),
        workingHours: workingHours.trim(),
        currency: currency.trim() || '$',
      });

      triggerSync(shopId, true, 'ALL');
      displayAlert('Identity Saved', 'Your shop details have been updated and will appear on printed receipts.');
    } catch (e: any) {
      console.error('Failed to save shop identity:', e);
      displayAlert('Error', 'Could not update shop identity. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintSampleReceipt = async () => {
    try {
      await PrintingService.printReceipt({
        shopName: shopName.trim() || 'My Shop',
        companyName: companyName.trim() || undefined,
        address: location.trim() || 'Store Location',
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        workingHours: workingHours.trim() || undefined,
        saleId: 'SAMPLE123',
        timestamp: new Date().toLocaleString(),
        items: [
          { name: 'Sample Item 1', quantity: 2, price: 15.00 },
          { name: 'Sample Item 2', quantity: 1, price: 25.50 },
        ],
        total: 55.50,
        employeeName: 'Store Manager',
        customerName: 'Valued Customer',
        paymentMethod: 'CASH',
        currency: currency || '$',
      });
    } catch (e) {
      console.error('Sample print failed:', e);
      displayAlert('Print Error', 'Could not generate sample receipt.');
    }
  };

  return (
    <ScreenWrapper withHeader>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <Box px="$4" pt={Math.max(insets.top, 10)} pb="$3">
        <HStack justifyContent="space-between" alignItems="center" flexDirection={flexDir}>
          <HStack space="md" alignItems="center" flexDirection={flexDir}>
            <Pressable
              onPress={() => navigation.goBack()}
              p="$3"
              minWidth={44}
              minHeight={44}
              justifyContent="center"
              alignItems="center"
              bg="$white"
              rounded="$full"
              accessibilityLabel="Go back"
              accessibilityRole="button"
              style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.05)' }) }}
            >
              <ArrowLeft size={22} color="#111827" style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }} />
            </Pressable>
            <VStack>
              <Heading size="lg" color="$text900" fontWeight="$black" textAlign={textAlign}>Receipt Identity</Heading>
              <Text size="xs" color="$text500" textAlign={textAlign}>Store Details & Printed Header</Text>
            </VStack>
          </HStack>

          <Button
            size="sm"
            action="secondary"
            variant="outline"
            borderRadius={12}
            onPress={handlePrintSampleReceipt}
            accessibilityLabel="Print sample receipt"
            accessibilityRole="button"
          >
            <ButtonIcon as={Printer} mr="$1" size="xs" />
            <ButtonText size="xs" fontWeight="$bold">Test Receipt</ButtonText>
          </Button>
        </HStack>
      </Box>

      {isLoading ? (
        <ModernLoader label="Loading Shop Identity..." subLabel="Fetching shop details" icon="store" />
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            <VStack space="lg">
              {/* Live Receipt Header Preview Card */}
              <Box bg="$white" p="$4" rounded="$2xl" borderWidth={1} borderColor="$primary200" style={getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(110,59,230,0.08)' })}>
                <VStack space="xs" alignItems="center">
                  <HStack space="xs" alignItems="center" mb="$2">
                    <Icon as={CheckCircle2} size="xs" color="$primary600" />
                    <Text size="2xs" color="$primary600" fontWeight="$bold" textTransform="uppercase">
                      Live Receipt Header Preview
                    </Text>
                  </HStack>

                  <Heading size="md" color="$text900" fontWeight="$black" textAlign="center">
                    {shopName || 'MY SHOP NAME'}
                  </Heading>
                  {companyName ? (
                    <Text size="xs" color="$text600" style={{ fontStyle: 'italic' }} textAlign="center">
                      {companyName}
                    </Text>
                  ) : null}
                  {location ? (
                    <Text size="xs" color="$text500" textAlign="center">
                      📍 {location}
                    </Text>
                  ) : null}
                  {phone ? (
                    <Text size="xs" color="$text500" textAlign="center">
                      📞 Tel: {phone}
                    </Text>
                  ) : null}
                  {email ? (
                    <Text size="xs" color="$text500" textAlign="center">
                      ✉️ Email: {email}
                    </Text>
                  ) : null}
                  {workingHours ? (
                    <Text size="xs" color="$text500" textAlign="center">
                      🕒 Hours: {workingHours}
                    </Text>
                  ) : null}
                </VStack>
              </Box>

              {/* Form Input Fields */}
              <Box bg="$white" p="$4" rounded="$2xl" borderWidth={1} borderColor="$borderLight" style={getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.02)' })}>
                <VStack space="md">
                  <Heading size="xs" color="$text500" fontWeight="$bold" textTransform="uppercase">
                    STORE INFORMATION
                  </Heading>

                  {/* Shop Name */}
                  <VStack space="xs">
                    <Text size="xs" fontWeight="$bold" color="$text700">Shop Name *</Text>
                    <Input borderRadius={12} bg="$backgroundLight50" style={{ flexDirection: flexDir }}>
                      <InputSlot pl="$3">
                        <Icon as={Store} size="sm" color="$text400" />
                      </InputSlot>
                      <InputField
                        placeholder="e.g. Mega Store Adum"
                        value={shopName}
                        onChangeText={setShopName}
                        textAlign={textAlign}
                      />
                    </Input>
                  </VStack>

                  {/* Company / Tagline */}
                  <VStack space="xs">
                    <Text size="xs" fontWeight="$bold" color="$text700">Company Tagline / Subtitle</Text>
                    <Input borderRadius={12} bg="$backgroundLight50" style={{ flexDirection: flexDir }}>
                      <InputSlot pl="$3">
                        <Icon as={Building} size="sm" color="$text400" />
                      </InputSlot>
                      <InputField
                        placeholder="e.g. Quality Goods & Best Prices"
                        value={companyName}
                        onChangeText={setCompanyName}
                        textAlign={textAlign}
                      />
                    </Input>
                  </VStack>

                  {/* Contact Lines */}
                  <VStack space="xs">
                    <Text size="xs" fontWeight="$bold" color="$text700">Contact Phone Lines</Text>
                    <Input borderRadius={12} bg="$backgroundLight50" style={{ flexDirection: flexDir }}>
                      <InputSlot pl="$3">
                        <Icon as={Phone} size="sm" color="$text400" />
                      </InputSlot>
                      <InputField
                        placeholder="e.g. +233 24 123 4567, +233 50 987 6543"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        textAlign={textAlign}
                      />
                    </Input>
                  </VStack>

                  {/* Email */}
                  <VStack space="xs">
                    <Text size="xs" fontWeight="$bold" color="$text700">Email Address</Text>
                    <Input borderRadius={12} bg="$backgroundLight50" style={{ flexDirection: flexDir }}>
                      <InputSlot pl="$3">
                        <Icon as={Mail} size="sm" color="$text400" />
                      </InputSlot>
                      <InputField
                        placeholder="e.g. sales@megastore.com"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        textAlign={textAlign}
                      />
                    </Input>
                  </VStack>

                  {/* Location */}
                  <VStack space="xs">
                    <Text size="xs" fontWeight="$bold" color="$text700">Store Location / Address</Text>
                    <Input borderRadius={12} bg="$backgroundLight50" style={{ flexDirection: flexDir }}>
                      <InputSlot pl="$3">
                        <Icon as={MapPin} size="sm" color="$text400" />
                      </InputSlot>
                      <InputField
                        placeholder="e.g. Market Street 12, Kumasi, Ghana"
                        value={location}
                        onChangeText={setLocation}
                        textAlign={textAlign}
                      />
                    </Input>
                  </VStack>

                  {/* Working Hours */}
                  <VStack space="xs">
                    <Text size="xs" fontWeight="$bold" color="$text700">Working Hours</Text>
                    <Input borderRadius={12} bg="$backgroundLight50" style={{ flexDirection: flexDir }}>
                      <InputSlot pl="$3">
                        <Icon as={Clock} size="sm" color="$text400" />
                      </InputSlot>
                      <InputField
                        placeholder="e.g. Mon - Sat: 8:00 AM - 8:00 PM"
                        value={workingHours}
                        onChangeText={setWorkingHours}
                        textAlign={textAlign}
                      />
                    </Input>
                  </VStack>

                  {/* Currency Symbol */}
                  <VStack space="xs">
                    <Text size="xs" fontWeight="$bold" color="$text700">Currency Symbol</Text>
                    <Input borderRadius={12} bg="$backgroundLight50" style={{ flexDirection: flexDir }}>
                      <InputSlot pl="$3">
                        <Icon as={DollarSign} size="sm" color="$text400" />
                      </InputSlot>
                      <InputField
                        placeholder="e.g. GH₵, $, €, £"
                        value={currency}
                        onChangeText={setCurrency}
                        textAlign={textAlign}
                      />
                    </Input>
                  </VStack>
                </VStack>
              </Box>

              {/* Save Button */}
              <Button
                size="lg"
                action="primary"
                bg="$primary600"
                borderRadius={16}
                minHeight={50}
                onPress={handleSave}
                isDisabled={isSaving}
                accessibilityLabel="Save shop identity"
                accessibilityRole="button"
                style={getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(110,59,230,0.25)' })}
              >
                {isSaving ? (
                  <Spinner color="white" size="small" />
                ) : (
                  <HStack space="sm" alignItems="center" justifyContent="center">
                    <ButtonIcon as={Save} size="sm" />
                    <ButtonText fontWeight="$bold">Save Receipt Identity</ButtonText>
                  </HStack>
                )}
              </Button>
            </VStack>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </ScreenWrapper>
  );
};

export default ShopIdentityScreen;
