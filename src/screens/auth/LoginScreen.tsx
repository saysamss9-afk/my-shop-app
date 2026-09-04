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
  Pressable,
  Center,
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  AlertCircleIcon,
  MailIcon,
  LockIcon,
  Spinner,
} from '@gluestack-ui/themed';
import { useAuth } from '../../hooks/useAuth';
import { ShieldCheck } from 'lucide-react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import { getButtonHeight, platformShadow } from '../../utils/platformStyles';

type Props = StackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, isSuccess, user, getUserEmployeeData, getShopDetails } = useAuth();

  useEffect(() => {
    if (isSuccess && user) {
      const checkData = async () => {
        if (user.uid === "l2JP5nnzVSP6gd8aSDEqI60Tbfl2") {
          navigation.replace('AdminDashboard');
          return;
        }

        const employeeData = await getUserEmployeeData(user.uid);
        if (employeeData) {
          let shopName = 'Your Shop';
          try {
            const shopData = await getShopDetails(employeeData.shopId);
            if (shopData) {
              shopName = shopData.name || shopName;
            }
          } catch (error) {
            console.warn('Failed to fetch shop name for dashboard:', error);
          }

          navigation.replace('Dashboard', {
            shopId: employeeData.shopId,
            employeeId: user.uid,
            userRole: employeeData.role,
            shopName,
          });
        } else {
          navigation.replace('ShopSetup');
        }
      };
      checkData();
    }
  }, [isSuccess, user, navigation, getUserEmployeeData, getShopDetails]);

  const handleState = () => {
    setShowPassword((showState) => !showState);
  };

  return (
    <ScreenWrapper scrollable>
      <StatusBar barStyle="dark-content" backgroundColor="#F3ECFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <VStack space="xl" py="$6">
          {/* Top Bar */}
          <HStack alignItems="center">
            <Pressable onPress={() => navigation.goBack()} p="$2" bg="$white" rounded="$full">
              <Icon as={ArrowLeftIcon} size="md" color="$primary600" />
            </Pressable>
          </HStack>

          {/* Header Section */}
          <VStack space="xs" mt="$4">
            <Heading size="2xl" color="$text900" fontWeight="$black">
              Welcome Back
            </Heading>
            <Text size="md" color="$text500">
              Sign in to continue managing your shop.
            </Text>
          </VStack>

          {/* Form Card */}
          <Box
            bg="$white"
            p="$6"
            rounded="$3xl"
            style={{ ...platformShadow({ offsetY: 8, radius: 24, color: 'rgba(0,0,0,0.05)' }) }}
          >
            <VStack space="lg">
              <FormControl isRequired isInvalid={!!error}>
                <FormControlLabel mb="$1">
                  <FormControlLabelText size="sm">Email Address</FormControlLabelText>
                </FormControlLabel>
                <Input variant="outline" size="md" borderRadius={16} bg="$backgroundLight50">
                  <InputSlot pl="$3">
                    <InputIcon as={MailIcon} color="$primary600" />
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
                  <FormControlLabelText size="sm">Password</FormControlLabelText>
                </FormControlLabel>
                <Input variant="outline" size="md" borderRadius={16} bg="$backgroundLight50">
                  <InputSlot pl="$3">
                    <InputIcon as={LockIcon} color="$primary600" />
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
                onPress={() => login(email, password)}
                isDisabled={isLoading}
                mt="$4"
                borderRadius={20}
                bg="$primary600"
                style={{ height: getButtonHeight(56) }}
              >
                {isLoading ? (
                  <Spinner color="white" />
                ) : (
                  <ButtonText fontWeight="$black">Sign In</ButtonText>
                )}
              </Button>
            </VStack>
          </Box>

          {/* Footer Actions */}
          <VStack space="md" alignItems="center" mt="$4">
            <Pressable onPress={() => navigation.navigate('Register')}>
              <HStack space="xs">
                <Text size="sm" color="$text500">Don't have an account?</Text>
                <Text size="sm" color="$primary600" fontWeight="$bold">Register</Text>
              </HStack>
            </Pressable>

            <Box h={1} w="50%" bg="$borderLight" my="$2" />

            <Text size="xs" color="$text300" fontWeight="$bold" letterSpacing={1.5}>
              SECURE POS ENVIRONMENT
            </Text>
          </VStack>
        </VStack>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default LoginScreen;
