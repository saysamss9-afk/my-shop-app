import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, useTheme, Surface } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = StackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, isSuccess, user, getUserEmployeeData } = useAuth();
  const theme = useTheme();

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Surface style={styles.header} elevation={0}>
          <MaterialCommunityIcons name="lock-outline" size={64} color={theme.colors.primary} />
          <Text variant="headlineLarge" style={styles.title}>My Shop</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Sign in to manage your business</Text>
        </Surface>

        <View style={styles.form}>
          <TextInput
            label="Email Address"
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
            left={<TextInput.Icon icon="key-outline" />}
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
            onPress={() => login(email, password)}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Login
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Landing')}
            style={styles.textButton}
          >
            Back to Selection
          </Button>
        </View>

        <View style={styles.footer}>
            <Text variant="bodySmall" style={{ color: '#999' }}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: 'transparent',
  },
  title: {
    fontWeight: 'bold',
    marginTop: 16,
    color: '#1a1a1a',
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  error: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  textButton: {
    marginTop: 16,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  }
});

export default LoginScreen;
