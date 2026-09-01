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
import { Scan, User, Phone } from 'lucide-react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import firebase from '../../firebase-config';
import ScreenWrapper from '../../components/common/ScreenWrapper';

type Props = StackScreenProps<RootStackParamList, 'JoinShop'>;

interface ShopDetails {
  name: string;
  ownerName: string;
  type: string;
}

const JoinShopScreen: React.FC<Props> = ({ navigation }) => {
  const [shopCode, setShopCode] = useState('');
  const [shopDetails, setShopDetails] = useState<ShopDetails | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [ghanaCard, setGhanaCard] = useState('');
  const [role, setRole] = useState('SALES');

  const { register, isLoading, error, isSuccess, user } = useAuth();

  const formatGhanaCard = (text: string) => {
    // Remove all non-alphanumeric characters
    let cleaned = text.replace(/[^A-Z0-9]/ig, '').toUpperCase();

    // Ensure it starts with GHA
    if (cleaned.length > 0 && !cleaned.startsWith('GHA')) {
        cleaned = 'GHA' + cleaned;
    }
    if (cleaned.length === 0) cleaned = 'GHA';

    // Apply hyphens: GHA-123456789-0
    let formatted = cleaned;
    if (cleaned.length > 3) {
        formatted = cleaned.slice(0, 3) + '-' + cleaned.slice(3);
    }
    if (cleaned.length > 12) {
        formatted = formatted.slice(0, 13) + '-' + formatted.slice(13, 14);
    }

    // Limit to GHA-XXXXXXXXX-X (15 chars total)
    return formatted.slice(0, 15);
  };

  const handleVerifyCode = async () => {
    if (!shopCode) return;

    setIsVerifying(true);
    setShopDetails(null);
    try {
      const shopDoc = await firebase.firestore().collection('registered_shops').doc(shopCode).get();
      if (shopDoc.exists) {
        const data = shopDoc.data();
        setShopDetails({
          name: data?.name || '',
          ownerName: data?.ownerName || '',
          type: data?.type || ''
        });
      } else {
        if (Platform.OS === 'web') {
          window.alert('Invalid Shop Code. Please check with your administrator.');
        } else {
          Alert.alert('Not Found', 'Invalid Shop Code. Please check with your administrator.');
        }
      }
    } catch (e: any) {
      Alert.alert('Error', 'Failed to verify shop code.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleJoin = async () => {
    if (!shopDetails) return;
    if (!name || !phoneNumber || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (ghanaCard.length > 3 && ghanaCard.length < 15) {
        Alert.alert('Invalid Card', 'Please enter a complete Ghana Card number (e.g. GHA-123456789-0)');
        return;
    }

    try {
      await register(email, password, shopCode, role, name, phoneNumber, ghanaCard === 'GHA' ? '' : ghanaCard);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  React.useEffect(() => {
    if (isSuccess && user) {
        navigation.replace('Dashboard', {
            shopId: shopCode,
            employeeId: user.uid,
            userRole: role
        });
    }
  }, [isSuccess, user]);

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
              <Box bg="$white" p="$6" rounded="$3xl" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
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
                              <Heading size="md" color="$primary800">{shopDetails.name}</Heading>
                              <Text size="xs" color="$primary600" fontWeight="$bold">{shopDetails.type}</Text>
                          </VStack>
                          <Pressable onPress={() => setShopDetails(null)}>
                              <Text size="xs" color="$primary600" underline>Change Code</Text>
                          </Pressable>
                      </HStack>
                  </Box>

                  <Box bg="$white" p="$6" rounded="$3xl" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
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
                                            <Text size="xxs" fontWeight="$bold" color={role === r ? '$primary600' : '$text400'}>
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
                                <InputField placeholder="John Doe" value={name} onChangeText={setName} />
                            </Input>
                        </FormControl>

                        <FormControl isRequired>
                            <FormControlLabel mb="$1"><FormControlLabelText size="sm">Phone Number</FormControlLabelText></FormControlLabel>
                            <Input variant="outline" size="md" borderRadius={16} bg="$backgroundLight50">
                                <InputSlot pl="$3"><Icon as={Phone} size="sm" color="$primary600" /></InputSlot>
                                <InputField placeholder="054..." value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
                            </Input>
                        </FormControl>

                        <FormControl>
                            <FormControlLabel mb="$1"><FormControlLabelText size="sm">Ghana Card (Optional)</FormControlLabelText></FormControlLabel>
                            <Input variant="outline" size="md" borderRadius={16} bg="$backgroundLight50">
                                <InputField
                                    placeholder="GHA-000000000-0"
                                    value={ghanaCard}
                                    onChangeText={(t) => setGhanaCard(formatGhanaCard(t))}
                                    onFocus={() => { if(!ghanaCard) setGhanaCard('GHA-'); }}
                                />
                            </Input>
                        </FormControl>

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

                        {error && <Text size="xs" color="$error600" textAlign="center">{error}</Text>}

                        <Button
                            size="lg"
                            onPress={handleJoin}
                            isDisabled={isLoading || !email || !password || !name || !phoneNumber}
                            borderRadius={20}
                            bg="$primary600"
                            style={{ height: 56, marginTop: 10 }}
                        >
                            {isLoading ? <Spinner color="white" /> : <ButtonText fontWeight="$black">Create Account & Join</ButtonText>}
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

export default JoinShopScreen;
