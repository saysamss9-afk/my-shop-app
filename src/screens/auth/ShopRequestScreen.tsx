import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, useTheme, Menu, Divider, Surface, IconButton } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { ShopRepository } from '../../repositories/ShopRepository';
import AppIcon from '../../components/common/AppIcon';

type Props = StackScreenProps<RootStackParamList, 'ShopRequest'>;

const SHOP_TYPES = [
  'Provision',
  'Supermarket',
  'Electrical',
  'Spare Parts',
  'Clothing',
  'Pharmacy',
  'Hardware',
  'Other'
];

const ShopRequestScreen: React.FC<Props> = ({ navigation }) => {
  const [ownerName, setOwnerName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopType, setShopType] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const [menuVisible, setMenuVisible] = useState(false);

  const theme = useTheme();
  const shopRepo = new ShopRepository();

  const handleSubmit = async () => {
    if (!ownerName || !whatsappNumber || !shopName || !shopType || !location) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      await shopRepo.submitShopRequest({
        ownerName,
        whatsappNumber,
        shopName,
        shopType,
        location,
      });
      Alert.alert(
        "Request Submitted",
        "Your request has been received. Our team will contact you on WhatsApp with your unique shop code shortly.",
        [{ text: "Great!", onPress: () => navigation.navigate('Landing') }]
      );
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
            <IconButton
                icon="arrow-left"
                onPress={() => navigation.goBack()}
                style={styles.backButton}
            />
            <Text variant="headlineMedium" style={styles.title}>Register Your Business</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
            Provide these details to get your unique shop code.
            </Text>
        </View>

        <Surface style={styles.formCard} elevation={1}>
            <TextInput
            label="Full Name"
            value={ownerName}
            onChangeText={setOwnerName}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="account-outline" />}
            />

            <TextInput
            label="WhatsApp Number"
            value={whatsappNumber}
            onChangeText={setWhatsappNumber}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
            left={<TextInput.Icon icon="whatsapp" color="#25D366" />}
            />

            <TextInput
            label="Shop Name"
            value={shopName}
            onChangeText={setShopName}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="store-outline" />}
            />

            <View style={styles.menuContainer}>
            <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                contentStyle={{ backgroundColor: 'white' }}
                anchor={
                <Button
                    mode="outlined"
                    onPress={() => setMenuVisible(true)}
                    style={styles.menuButton}
                    contentStyle={styles.menuButtonContent}
                    labelStyle={{ color: shopType ? theme.colors.onSurface : theme.colors.outline }}
                    icon="chevron-down"
                >
                    {shopType ? shopType : 'Select Business Category'}
                </Button>
                }
            >
                {SHOP_TYPES.map((type) => (
                <Menu.Item
                    key={type}
                    onPress={() => {
                    setShopType(type);
                    setMenuVisible(false);
                    }}
                    title={type}
                />
                ))}
            </Menu>
            </View>

            <TextInput
            label="Business Location"
            value={location}
            onChangeText={setLocation}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
            left={<TextInput.Icon icon="map-marker-outline" />}
            />

            <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
            contentStyle={styles.buttonContent}
            >
            Submit Registration
            </Button>
        </Surface>

        <View style={styles.helpText}>
            <AppIcon name="group" size={16} color="#666" />
            <Text variant="bodySmall" style={styles.infoText}>
                The admin will verify your details and generate a shop code for you.
            </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Need to import IconButton
// import { TextInput, Button, Text, useTheme, Menu, Divider, Surface, IconButton } from 'react-native-paper';

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  header: {
    marginTop: 20,
    marginBottom: 24,
  },
  backButton: {
    marginLeft: -12,
  },
  title: {
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  input: {
    marginBottom: 16,
  },
  menuContainer: {
    marginBottom: 16,
  },
  menuButton: {
    width: '100%',
    borderColor: '#79747E',
    borderRadius: 4,
    height: 50,
  },
  menuButtonContent: {
    justifyContent: 'space-between',
    flexDirection: 'row-reverse',
    height: 50,
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  helpText: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  infoText: {
    marginLeft: 8,
    color: '#666',
  }
});

export default ShopRequestScreen;
