import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Text, useTheme, ActivityIndicator, Surface, Avatar } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import firebase from '../../firebase-config';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = StackScreenProps<RootStackParamList, 'ShopSetup'>;

const ShopSetupScreen: React.FC<Props> = ({ navigation }) => {
  const [requestStatus, setRequestStatus] = useState<'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'>('NONE');
  const { user, getUserEmployeeData, logout } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    if (!user) return;

    const checkEmployee = async () => {
        const data = await getUserEmployeeData(user.uid);
        if (data && data.shopId) {
            navigation.replace('Dashboard', {
                shopId: data.shopId,
                employeeId: user.uid,
                userRole: data.role
            });
        }
    };
    checkEmployee();

    const unsubscribe = firebase.firestore().collection('shop_requests')
      .where('userEmail', '==', user.email)
      .onSnapshot(snapshot => {
        if (!snapshot.empty) {
          const request = snapshot.docs[0].data();
          setRequestStatus(request.status);

          if (request.status === 'APPROVED') {
            checkEmployee();
          }
        }
      });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigation.replace('Landing');
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.content} elevation={0}>
        <View style={styles.iconContainer}>
            <MaterialCommunityIcons
                name={requestStatus === 'PENDING' ? "clock-outline" : "store-search-outline"}
                size={80}
                color={theme.colors.primary}
            />
        </View>

        <Text variant="headlineMedium" style={styles.title}>
            {requestStatus === 'PENDING' ? 'Registration Pending' : 'Almost There!'}
        </Text>

        <Text variant="bodyLarge" style={styles.subtitle}>
            {requestStatus === 'PENDING'
                ? "Your shop registration is being reviewed by our team. We'll contact you on WhatsApp with your unique code soon."
                : "It looks like your account isn't linked to a shop yet. Please use the shop code provided by your admin."}
        </Text>

        <Surface style={styles.infoCard} elevation={1}>
            <ListInfo
                icon="whatsapp"
                text="Admin will message you via WhatsApp"
                color="#25D366"
            />
            <Divider style={styles.divider} />
            <ListInfo
                icon="barcode-scan"
                text="Use the code in 'Join Shop' screen"
                color={theme.colors.primary}
            />
        </Surface>

        <Button
            mode="contained"
            onPress={() => navigation.navigate('JoinShop')}
            style={styles.button}
            contentStyle={styles.buttonContent}
        >
            I have a Shop Code
        </Button>

        <Button mode="text" onPress={handleLogout} style={styles.logoutButton}>
            Logout & Exit
        </Button>
      </Surface>
    </View>
  );
};

const ListInfo = ({ icon, text, color }: any) => (
    <View style={styles.infoRow}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
        <Text variant="bodyMedium" style={styles.infoText}>{text}</Text>
    </View>
);

const Divider = ({ style }: any) => <View style={[{ height: 1, backgroundColor: '#eee', marginVertical: 12 }, style]} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
    lineHeight: 24,
  },
  infoCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    marginBottom: 32,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 16,
    color: '#333',
  },
  divider: {
    marginLeft: 40,
  },
  button: {
    width: '100%',
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  logoutButton: {
    marginTop: 16,
  }
});

export default ShopSetupScreen;
