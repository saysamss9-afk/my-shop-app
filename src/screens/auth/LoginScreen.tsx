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
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  Icon,
  Center,
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  AlertCircleIcon,
  MailIcon,
  LockIcon,
} from '@gluestack-ui/themed';
import { useAuth } from '../../hooks/useAuth';
import { ShieldCheck } from 'lucide-react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = StackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, isSuccess, user, getUserEmployeeData } = useAuth();

  useEffect(() => {
    if (isSuccess && user) {
      const checkData = async () => {
        if (user.uid === "l2JP5nnzVSP6gd8aSDEqI60Tbfl2") {
          navigation.replace('AdminDashboard');
          return;
        }

        const employeeData = await getUserEmployeeData(user.uid);
        if (employeeData) {
          navigation.replace('Dashboard', {
            shopId: employeeData.shopId,
            employeeId: user.uid,
            userRole: employeeData.role
          });
        } else {
          navigation.replace('ShopSetup');
        }
      };
      checkData();
    }
  }, [isSuccess, user, navigation, getUserEmployeeData]);

  const handleState = () => {
    setShowPassword((showState) => !showState);
  };

  return (
    <Box flex={1} bg="$white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar */}
          <Box mt="$4">
            <Button
              variant="link"
              action="primary"
              onPress={() => navigation.goBack()}
              p="$0"
              justifyContent="flex-start"
            >
              <ButtonIcon as={ArrowLeftIcon} size="xl" />
            </Button>
          </Box>

          {/* Header Section */}
          <VStack space="md" mt="$8" alignItems="center">
            <Center
              w={80}
              h={80}
              rounded="$full"
              bg="$primary50"
              shadowColor="$primary800"
            >
              <Icon as={ShieldCheck} size="xl" color="$primary800" />
            </Center>
            <Heading size="2xl" color="$text900" textAlign="center" fontWeight="$black">
              Welcome Back
            </Heading>
            <Text size="md" color="$text600" textAlign="center">
              Enter your credentials to access your store
            </Text>
          </VStack>

          {/* Form Section */}
          <VStack space="lg" mt="$10">
            <FormControl isRequired isInvalid={!!error}>
              <FormControlLabel mb="$1">
                <FormControlLabelText>Email Address</FormControlLabelText>
              </FormControlLabel>
              <Input variant="outline" size="md" borderRadius={12}>
                <InputSlot pl="$3">
                  <InputIcon as={MailIcon} color="$primary800" />
                </InputSlot>
                <InputField
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </Input>
            </FormControl>

            <FormControl isRequired isInvalid={!!error}>
              <FormControlLabel mb="$1">
                <FormControlLabelText>Password</FormControlLabelText>
              </FormControlLabel>
              <Input variant="outline" size="md" borderRadius={12}>
                <InputSlot pl="$3">
                  <InputIcon as={LockIcon} color="$primary800" />
                </InputSlot>
                <InputField
                  placeholder="Enter password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <InputSlot pr="$3" onPress={handleState}>
                  <InputIcon as={showPassword ? EyeIcon : EyeOffIcon} />
                </InputSlot>
              </Input>
              {error && (
                <FormControlError mt="$2">
                  <FormControlErrorIcon as={AlertCircleIcon} />
                  <FormControlErrorText>{error}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <Button
              size="lg"
              variant="solid"
              action="primary"
              isDisabled={isLoading}
              onPress={() => login(email, password)}
              mt="$4"
              borderRadius={14}
              bg="$primary800"
              sx={{
                ':active': {
                  bg: '$primary900',
                },
              }}
            >
              {isLoading ? (
                <ButtonText>Logging in...</ButtonText>
              ) : (
                <ButtonText fontWeight="$bold">Login to Dashboard</ButtonText>
              )}
            </Button>

            <HStack alignItems="center" space="md" my="$4">
              <Box flex={1} h={1} bg="$borderLight" />
              <Text size="xs" color="$text400" fontWeight="$bold">
                OR
              </Text>
              <Box flex={1} h={1} bg="$borderLight" />
            </HStack>

            <Button
              size="lg"
              variant="outline"
              action="secondary"
              onPress={() => navigation.navigate('Register')}
              borderRadius={14}
              borderColor="$primary800"
            >
              <ButtonText color="$primary800" fontWeight="$bold">
                Create Owner Account
              </ButtonText>
            </Button>
          </VStack>

          {/* Footer */}
          <Box mt="auto" pt="$10" pb="$2" alignItems="center">
            <Text size="xs" color="$text300" fontWeight="$bold" letterSpacing={1}>
              SECURE POINT OF SALE ENVIRONMENT
            </Text>
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </Box>
  );
};

export default LoginScreen;
