import React, { useState } from 'react';
import { ScrollView, Alert, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
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
  Center,
  ArrowLeftIcon,
  MailIcon,
  LockIcon,
  Badge,
  BadgeText,
  Spinner,
  Pressable,
  CheckCircleIcon,
} from '@gluestack-ui/themed';
import { useAuth } from '../../hooks/useAuth';
import { Scan, User, Phone, AlertTriangle } from 'lucide-react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import firebase from '../../firebase-config';
import ScreenWrapper from '../../components/common/ScreenWrapper';

type Props = StackScreenProps<RootStackParamList, 'JoinShop'>;

interface ShopDetails {
  id: string;
  name: string;
  ownerName: string;
  type: string;
  plan: string;
  staffCount: number;
}

const JoinShopScreen: React.FC<Props> = ({ navigation }) => {
  const [shopCode, setShopCode] = useState('');
  const [shopDetails, setShopDetails] = useState<ShopDetails | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('Ghana');
  const [role, setRole] = useState('SALES');

  const { register, linkUserToShop, isLoading, error, isSuccess, user } = useAuth();

  const handleVerifyCode = async () => {
    const cleanedCode = shopCode.trim().replace(/\s/g, '');
    if (!cleanedCode) return;

    setIsVerifying(true);
    setShopDetails(null);
    setLimitReached(false);
    try {
      let finalShopId = cleanedCode;

      // Check if it's a short code first
      const codeDoc = await firebase.firestore().collection('shop_codes').doc(cleanedCode).get();
      if (codeDoc.exists) {
        finalShopId = codeDoc.data()?.shopId;
      }

      const shopDoc = await firebase.firestore().collection('registered_shops').doc(finalShopId).get();
      if (shopDoc.exists) {
        const data = shopDoc.data();
        const staffCount = data?.staffCount || 0;
        const plan = data?.plan || 'STARTER';

        // Enforce Starter plan limit: 3 staff including owner
        if (plan === 'STARTER' && staffCount >= 3) {
          setLimitReached(true);
        }

        setShopCode(finalShopId);
        setShopDetails({
          id: finalShopId,
          name: data?.name || '',
          ownerName: data?.ownerName || '',
          type: data?.type || '',
          plan: plan,
          staffCount: staffCount,
        });
      } else {
        if (Platform.OS === 'web') {
          window.alert('Invalid Shop Code. Please check with your administrator.');
        } else {
          Alert.alert('Not Found', 'Invalid Shop Code. Please check with your administrator.');
        }
      }
    } catch (e: any) {
      console.error('Verify Code Error:', e);
      Alert.alert('Error', 'Failed to verify shop code: ' + e.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const [localSuccess, setLocalSuccess] = useState(false);

  const handleJoin = async () => {
    if (!shopDetails) return;

    // Validate core fields
    if (!name || !phoneNumber || !country) {
      Alert.alert('Error', 'Please provide your name, phone and country.');
      return;
    }

    try {
      const cleanedCode = shopCode.trim().replace(/\s/g, '');

      if (user) {
        // Authenticated user: just link
        await linkUserToShop(user.uid, user.email, cleanedCode, role, name, phoneNumber, country);
        setLocalSuccess(true);
      } else {
        // New user: register + link
        if (!email || !password) {
            Alert.alert('Error', 'Email and password are required for new accounts.');
            return;
        }
        await register(email, password, cleanedCode, role, name, phoneNumber, country);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  React.useEffect(() => {
    if ((isSuccess || localSuccess) && (user || firebase.auth().currentUser)) {
        const activeUser = user || firebase.auth().currentUser;
        navigation.replace('Dashboard', {
            shopId: shopCode,
            employeeId: activeUser?.uid || '',
            userRole: role,
            shopName: shopDetails?.name || 'Your Shop'
        });
    }
  }, [isSuccess, localSuccess, user, shopCode, role, shopDetails?.name]);

  return (
    <ScreenWrapper scrollable>
      <StatusBar barStyle="dark-content" backgroundColor="#F3ECFF" />

      <VStack space="xl" py="$4">
          <HStack alignItems="center">
            <Pressable onPress={() => navigation.replace('Landing')} p="$2" bg="$white" rounded="$full">
              <Icon as={ArrowLeftIcon} size="md" color="$primary600" />
            </Pressable>
          </HStack>

          <VStack space="xs">
            <Heading size="2xl" color="$text900" fontWeight="$black">
                {shopDetails ? 'Complete Profile' : 'Join a Shop'}
            </Heading>
            <Text size="md" color="$text500">
                {!shopDetails ? 'Enter your shop code to continue.' : `Joining ${shopDetails.name}`}
            </Text>
          </VStack>

          {!shopDetails ? (
              <Box bg="$white" p="$6" rounded="$3xl" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.04)' } as any}>
                  <VStack space="lg">
                      <FormControl isRequired>
                        <FormControlLabel mb="$1">
                          <FormControlLabelText size="sm">Shop ID / Code</FormControlLabelText>
                        </FormControlLabel>
                        <Input variant="outline" size="md" borderRadius={16} bg="$backgroundLight50">
                          <InputSlot pl="$3">
                            <Icon as={Scan} size="sm" color="$primary600" />
                          </InputSlot>
                          <InputField
                            placeholder="e.g. MS-2026-1234"
                            value={shopCode}
                            onChangeText={(text) => setShopCode(text.toUpperCase())}
                            autoCapitalize="characters"
                          />
                        </Input>
                      </FormControl>
                      <Button
                          size="lg"
                          onPress={handleVerifyCode}
                          isDisabled={!shopCode || isVerifying}
                          borderRadius={20}
                          bg="$primary600"
                          style={{ height: 56 }}
                      >
                          {isVerifying ? <Spinner color="white" /> : <ButtonText fontWeight="$black">Verify Shop Code</ButtonText>}
                      </Button>
                  </VStack>
              </Box>
          ) : (
              <VStack space="lg">
                  <Box bg="$primary50" p="$5" rounded="$2xl" borderWidth={1} borderColor="$primary100">
                      <HStack justifyContent="space-between" alignItems="center">
                          <VStack space="xs">
                              <HStack space="xs" alignItems="center">
                                <Heading size="md" color="$primary800">{shopDetails.name}</Heading>
                                <Badge action="info" variant="solid" size="sm" rounded="$md">
                                    <BadgeText size="2xs">{shopDetails.plan}</BadgeText>
                                </Badge>
                              </HStack>
                              <Text size="xs" color="$primary600" fontWeight="$bold">{shopDetails.type}</Text>
                          </VStack>
                          <Pressable onPress={() => { setShopDetails(null); setLimitReached(false); }}>
                              <Text size="xs" color="$primary600" underline>Change Code</Text>
                          </Pressable>
                      </HStack>
                  </Box>

                  {limitReached && (
                      <Box bg="$error50" p="$4" rounded="$xl" borderWidth={1} borderColor="$error200">
                          <HStack space="sm" alignItems="center">
                              <Icon as={AlertTriangle} color="$error600" size="sm" />
                              <VStack flex={1}>
                                  <Text size="sm" fontWeight="$bold" color="$error700">Staff Limit Reached</Text>
                                  <Text size="xs" color="$error600">
                                      This shop is on the Starter plan and has reached its limit of 3 staff members. Please contact the owner to upgrade.
                                  </Text>
                              </VStack>
                          </HStack>
                      </Box>
                  )}

                  <Box
                    bg="$white"
                    p="$6"
                    rounded="$3xl"
                    style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.04)' } as any}
                    opacity={limitReached ? 0.5 : 1}
                    pointerEvents={limitReached ? 'none' : 'auto'}
                  >
                    <VStack space="lg">
                        <VStack space="sm">
                            <Text size="sm" fontWeight="$bold" color="$text900">Your Role</Text>
                            <HStack space="sm">
                                {['SALES', 'MANAGER', 'OWNER'].map((r) => (
                                    <Pressable
                                        key={r}
                                        flex={1}
                                        onPress={() => setRole(r)}
                                        p="$3"
                                        rounded="$xl"
                                        borderWidth={2}
                                        borderColor={role === r ? '$primary600' : '$backgroundLight100'}
                                        bg={role === r ? '$primary50' : 'transparent'}
                                    >
                                        <Center>
                                            <Text size="2xs" fontWeight="$bold" color={role === r ? '$primary600' : '$text400'}>
                                                {r}
                                            </Text>
                                        </Center>
                                    </Pressable>
                                ))}
                            </HStack>
                        </VStack>

                        <FormControl isRequired>
                            <FormControlLabel mb="$1"><FormControlLabelText size="sm">Full Name</FormControlLabelText></FormControlLabel>
                            <Input variant="outline" size="md" borderRadius={16} bg="$backgroundLight50">
                                <InputSlot pl="$3"><Icon as={User} size="sm" color="$primary600" /></InputSlot>
                                <InputField placeholder="John Doe" value={name} onChangeText={setName} autoCorrect={false} />
                            </Input>
                        </FormControl>

                        <FormControl isRequired>
                            <FormControlLabel mb="$1"><FormControlLabelText size="sm">Phone Number</FormControlLabelText></FormControlLabel>
                            <Input variant="outline" size="md" borderRadius={16} bg="$backgroundLight50">
                                <InputSlot pl="$3"><Icon as={Phone} size="sm" color="$primary600" /></InputSlot>
                                <InputField placeholder="054..." value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
                            </Input>
                        </FormControl>

                        <FormControl isRequired>
                            <FormControlLabel mb="$1"><FormControlLabelText size="sm">Country</FormControlLabelText></FormControlLabel>
                            <Input variant="outline" size="md" borderRadius={16} bg="$backgroundLight50">
                                <InputField
                                    placeholder="e.g. Ghana, Nigeria, Kenya"
                                    value={country}
                                    onChangeText={setCountry}
                                    autoCorrect={false}
                                />
                            </Input>
                        </FormControl>

                        {!user && (
                            <>
                                <FormControl isRequired>
                                    <FormControlLabel mb="$1"><FormControlLabelText size="sm">Email</FormControlLabelText></FormControlLabel>
                                    <Input variant="outline" size="md" borderRadius={16} bg="$backgroundLight50">
                                        <InputSlot pl="$3"><InputIcon as={MailIcon} color="$primary600" /></InputSlot>
                                        <InputField placeholder="email@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                                    </Input>
                                </FormControl>

                                <FormControl isRequired>
                                    <FormControlLabel mb="$1"><FormControlLabelText size="sm">Password</FormControlLabelText></FormControlLabel>
                                    <Input variant="outline" size="md" borderRadius={16} bg="$backgroundLight50">
                                        <InputSlot pl="$3"><InputIcon as={LockIcon} color="$primary600" /></InputSlot>
                                        <InputField placeholder="Min 6 characters" value={password} onChangeText={setPassword} secureTextEntry />
                                    </Input>
                                </FormControl>
                            </>
                        )}

                        {error && <Text size="xs" color="$error600" textAlign="center">{error}</Text>}

                        <Button
                            size="lg"
                            onPress={handleJoin}
                            isDisabled={isLoading || (!user && (!email || !password)) || !name || !phoneNumber}
                            borderRadius={20}
                            bg="$primary600"
                            style={{ height: 56, marginTop: 10 }}
                        >
                            {isLoading ? <Spinner color="white" /> : <ButtonText fontWeight="$black">{user ? 'Join Shop' : 'Create Account & Join'}</ButtonText>}
                        </Button>
                    </VStack>
                  </Box>
              </VStack>
          )}

          <Center mt="$4" mb="$8">
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text size="xs" color="$text400" fontWeight="$bold">BACK TO LOGIN</Text>
            </Pressable>
          </Center>
      </VStack>
    </ScreenWrapper>
  );
};

export default JoinShopScreen;
