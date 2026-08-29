import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, useTheme, RadioButton, Card, ActivityIndicator, Chip, Surface, TouchableRipple } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import firestore from '@react-native-firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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
  const [showPassword, setShowPassword] = useState(false);

  const { register, isLoading, error, isSuccess, user } = useAuth();
  const theme = useTheme();

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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>Join a Shop</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
              {!shopDetails ? 'Enter your shop code to continue.' : 'Great! Now complete your profile.'}
          </Text>
        </View>

        {!shopDetails ? (
            <Surface style={styles.section} elevation={0}>
                <TextInput
                    label="Shop Code (e.g. SHOP_XYZ)"
                    value={shopCode}
                    onChangeText={(text) => setShopCode(text.toUpperCase())}
                    mode="outlined"
                    style={styles.input}
                    autoCapitalize="characters"
                    left={<TextInput.Icon icon="barcode-scan" />}
                />
                <Button
                    mode="contained"
                    onPress={handleVerifyCode}
                    loading={isVerifying}
                    disabled={!shopCode || isVerifying}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                >
                    Verify Shop Code
                </Button>
            </Surface>
        ) : (
            <View style={styles.signupForm}>
                <Surface style={styles.shopCard} elevation={1}>
                    <View style={styles.shopHeader}>
                        <View>
                            <Text variant="titleLarge" style={styles.shopName}>{shopDetails.name}</Text>
                            <Text variant="bodyMedium" style={styles.shopOwner}>Owner: {shopDetails.ownerName}</Text>
                        </View>
                        <Chip icon="storefront" style={styles.typeChip}>{shopDetails.type}</Chip>
                    </View>
                    <Button
                        compact
                        mode="text"
                        onPress={() => setShopDetails(null)}
                        style={styles.changeCodeButton}
                    >
                        Use different code
                    </Button>
                </Surface>

                <Text variant="titleMedium" style={styles.roleLabel}>What is your role?</Text>
                <View style={styles.roleContainer}>
                    {['OWNER', 'MANAGER', 'SALES'].map((r) => (
                        <TouchableRipple
                            key={r}
                            onPress={() => setRole(r)}
                            style={[
                                styles.roleItem,
                                role === r && { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.primary }
                            ]}
                        >
                            <View style={styles.roleItemContent}>
                                <RadioButton.Android
                                    value={r}
                                    status={role === r ? 'checked' : 'unchecked'}
                                    onPress={() => setRole(r)}
                                />
                                <Text style={[styles.roleText, role === r && { fontWeight: 'bold' }]}>
                                    {r.charAt(0) + r.slice(1).toLowerCase()}
                                </Text>
                            </View>
                        </TouchableRipple>
                    ))}
                </View>

                <TextInput
                    label="Your Email"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    left={<TextInput.Icon icon="email-outline" />}
                />

                <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    mode="outlined"
                    style={styles.input}
                    secureTextEntry={!showPassword}
                    left={<TextInput.Icon icon="lock-outline" />}
                    right={
                        <TextInput.Icon
                          icon={showPassword ? "eye-off" : "eye"}
                          onPress={() => setShowPassword(!showPassword)}
                        />
                      }
                />

                {error && (
                    <Text style={[styles.error, { color: theme.colors.error }]}>
                        {error}
                    </Text>
                )}

                <Button
                    mode="contained"
                    onPress={handleJoin}
                    loading={isLoading}
                    disabled={isLoading || !email || !password}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                >
                    Create Account & Join
                </Button>
            </View>
        )}

        <Button
          mode="text"
          onPress={() => navigation.navigate('Login')}
          style={styles.textButton}
        >
          Back to Login
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: 'white',
  },
  header: {
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  section: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  shopCard: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#eee',
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  shopName: {
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  shopOwner: {
    color: '#666',
  },
  typeChip: {
    backgroundColor: 'white',
  },
  changeCodeButton: {
    alignSelf: 'flex-end',
  },
  signupForm: {
    width: '100%',
  },
  roleLabel: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  roleItem: {
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 8,
  },
  roleItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  roleText: {
    fontSize: 12,
  },
  input: {
    marginBottom: 16,
  },
  error: {
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    borderRadius: 12,
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  textButton: {
    marginTop: 24,
    alignSelf: 'center',
  },
});

export default JoinShopScreen;
