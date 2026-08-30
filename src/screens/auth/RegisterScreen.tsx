import React, { useState, useEffect } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
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
  MailIcon,
  LockIcon,
  Spinner,
} from '@gluestack-ui/themed';
import { useAuth } from '../../hooks/useAuth';
import { UserPlus } from 'lucide-react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = StackScreenProps<RootStackParamList, 'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { register, isLoading, error, isSuccess, user } = useAuth();

  useEffect(() => {
    if (isSuccess && user) {
      navigation.replace('ShopRequest');
    }
  }, [isSuccess, user, navigation]);

  const handleRegister = () => {
    if (password !== confirmPassword) return;
    register(email, password);
  };

  return (
    <Box flex={1} bg="$white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'android' ? 'height' : 'padding'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
          <VStack space="xl" alignItems="center" mb="$8">
            <Center
              w={80}
              h={80}
              rounded="$full"
              bg="$primary50"
            >
              <Icon as={UserPlus} size="xl" color="$primary800" />
            </Center>
            <VStack space="xs" alignItems="center">
              <Heading size="2xl" color="$text900" fontWeight="$black">Create Owner Account</Heading>
              <Text size="md" color="$text600">Start your journey with My Shop</Text>
            </VStack>
          </VStack>

          <VStack space="lg">
            <FormControl isRequired>
              <FormControlLabel>
                <FormControlLabelText>Email Address</FormControlLabelText>
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
                  placeholder="Min 6 characters"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </Input>
            </FormControl>

            <FormControl isRequired isInvalid={password !== confirmPassword && confirmPassword !== ''}>
              <FormControlLabel>
                <FormControlLabelText>Confirm Password</FormControlLabelText>
              </FormControlLabel>
              <Input variant="outline" size="md" borderRadius={12}>
                <InputSlot pl="$3">
                  <InputIcon as={LockIcon} />
                </InputSlot>
                <InputField
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
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
              onPress={handleRegister}
              isDisabled={isLoading || !email || !password || password !== confirmPassword}
              borderRadius={14}
              bg="$primary800"
              mt="$4"
            >
              {isLoading ? <Spinner color="white" /> : <ButtonText fontWeight="$bold">Register as Owner</ButtonText>}
            </Button>

            <Button
              variant="link"
              action="secondary"
              onPress={() => navigation.navigate('Login')}
              mt="$2"
            >
              <ButtonText>Already have an account? Login</ButtonText>
            </Button>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </Box>
  );
};

export default RegisterScreen;
