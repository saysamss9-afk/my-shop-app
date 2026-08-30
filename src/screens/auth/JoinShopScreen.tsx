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
  Center,
  ArrowLeftIcon,
  MailIcon,
  LockIcon,
  Badge,
  BadgeText,
  Spinner,
  Pressable,
} from '@gluestack-ui/themed';
import { useAuth } from '../../hooks/useAuth';
import { Scan } from 'lucide-react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import firestore from '@react-native-firebase/firestore';

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
  const [role, setRole] = useState('SALES');

  const { register, isLoading, error, isSuccess, user } = useAuth();

  const handleVerifyCode = async () => {
    if (!shopCode) return;

    setIsVerifying(true);
    setShopDetails(null);
    try {
      const shopDoc = await firestore().collection('registered_shops').doc(shopCode).get();
      if (shopDoc.exists) {
        const data = shopDoc.data();
        setShopDetails({
          name: data?.name || '',
          ownerName: data?.ownerName || '',
          type: data?.type || ''
        });
      } else {
        Alert.alert('Not Found', 'Invalid Shop Code. Please check with your administrator.');
      }
    } catch (e: any) {
      Alert.alert('Error', 'Failed to verify shop code.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleJoin = async () => {
    if (!shopDetails) return;
    try {
      await register(email, password, shopCode, role);
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
    <Box flex={1} bg="$white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'android' ? 'height' : 'padding'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
          <VStack space="md" mt="$8" mb="$8">
            <Heading size="2xl" color="$text900" fontWeight="$black">Join a Shop</Heading>
            <Text size="md" color="$text600">
                {!shopDetails ? 'Enter your shop code to continue.' : 'Great! Now complete your profile.'}
            </Text>
          </VStack>

          {!shopDetails ? (
              <VStack space="lg">
                  <FormControl isRequired>
                    <FormControlLabel>
                      <FormControlLabelText>Shop Code</FormControlLabelText>
                    </FormControlLabel>
                    <Input variant="outline" size="md" borderRadius={12}>
                      <InputSlot pl="$3">
                        <Icon as={Scan} size="sm" />
                      </InputSlot>
                      <InputField
                        placeholder="e.g. SHOP_XYZ"
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
                      borderRadius={12}
                      bg="$primary800"
                  >
                      {isVerifying ? <Spinner color="white" /> : <ButtonText fontWeight="$bold">Verify Shop Code</ButtonText>}
                  </Button>
              </VStack>
          ) : (
              <VStack space="xl">
                  <Box bg="$backgroundLight50" p="$5" rounded="$2xl" borderWidth={1} borderColor="$borderLight">
                      <HStack justifyContent="space-between" alignItems="flex-start" mb="$4">
                          <VStack space="xs">
                              <Text size="sm" color="$text500" fontWeight="$bold">SHOP FOUND</Text>
                              <Heading size="lg" color="$text900">{shopDetails.name}</Heading>
                              <Text size="sm" color="$text600">Owner: {shopDetails.ownerName}</Text>
                          </VStack>
                          <Badge action="info" variant="solid" rounded="$lg">
                            <BadgeText>{shopDetails.type}</BadgeText>
                          </Badge>
                      </HStack>
                      <Button
                          variant="link"
                          action="primary"
                          onPress={() => setShopDetails(null)}
                          p="$0"
                      >
                          <ButtonText size="sm">Use different code</ButtonText>
                      </Button>
                  </Box>

                  <VStack space="md">
                    <Text size="sm" fontWeight="$bold" color="$text900">What is your role?</Text>
                    <HStack space="md">
                        {['OWNER', 'MANAGER', 'SALES'].map((r) => (
                            <Pressable
                                key={r}
                                flex={1}
                                onPress={() => setRole(r)}
                                p="$3"
                                rounded="$xl"
                                borderWidth={2}
                                borderColor={role === r ? '$primary800' : '$borderLight'}
                                bg={role === r ? '$primary50' : 'transparent'}
                            >
                                <Center>
                                    <Text size="xs" fontWeight="$bold" color={role === r ? '$primary800' : '$text600'}>
                                        {r}
                                    </Text>
                                </Center>
                            </Pressable>
                        ))}
                    </HStack>
                  </VStack>

                  <FormControl isRequired>
                    <FormControlLabel>
                      <FormControlLabelText>Your Email</FormControlLabelText>
                    </FormControlLabel>
                    <Input variant="outline" size="md" borderRadius={12}>
                      <InputSlot pl="$3">
                        <InputIcon as={MailIcon} />
                      </InputSlot>
                      <InputField
                        placeholder="email@example.com"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </Input>
                  </FormControl>

                  <FormControl isRequired>
                    <FormControlLabel>
                      <FormControlLabelText>Password</FormControlLabelText>
                    </FormControlLabel>
                    <Input variant="outline" size="md" borderRadius={12}>
                      <InputSlot pl="$3">
                        <InputIcon as={LockIcon} />
                      </InputSlot>
                      <InputField
                        placeholder="Minimum 6 characters"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                      />
                    </Input>
                  </FormControl>

                  {error && (
                      <Text size="xs" color="$error600" textAlign="center">
                          {error}
                      </Text>
                  )}

                  <Button
                      size="lg"
                      onPress={handleJoin}
                      isDisabled={isLoading || !email || !password}
                      borderRadius={12}
                      bg="$primary800"
                  >
                      {isLoading ? <Spinner color="white" /> : <ButtonText fontWeight="$bold">Create Account & Join</ButtonText>}
                  </Button>
              </VStack>
          )}

          <Button
            variant="link"
            action="secondary"
            onPress={() => navigation.navigate('Login')}
            mt="$8"
          >
            <ButtonText>Back to Login</ButtonText>
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </Box>
  );
};

export default JoinShopScreen;
