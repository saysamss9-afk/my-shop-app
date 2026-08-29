import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Button, Text, Surface, useTheme, TouchableRipple } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import AppIcon from '../../components/common/AppIcon';

type Props = StackScreenProps<RootStackParamList, 'Landing'>;

const LandingScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.backgroundDecoration, { backgroundColor: theme.colors.primary }]} />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
            <Surface style={styles.logoContainer} elevation={5}>
                <AppIcon name="store" size={64} color={theme.colors.primary} />
            </Surface>
            <Text variant="displaySmall" style={styles.title}>My Shop</Text>
            <Text variant="bodyLarge" style={styles.subtitle}>Empower your business with smart management</Text>
        </View>

        <View style={styles.content}>
            <Surface style={[styles.card, { borderLeftColor: '#673AB7', borderLeftWidth: 8 }]} elevation={2}>
                <TouchableRipple onPress={() => navigation.navigate('Login')} style={styles.cardRipple}>
                    <View style={styles.cardInner}>
                        <View style={[styles.iconBox, { backgroundColor: '#EDE7F6' }]}>
                            <AppIcon name="login" size={32} color="#673AB7" />
                        </View>
                        <View style={styles.cardTextContainer}>
                            <Text variant="titleLarge" style={styles.cardTitle}>Login</Text>
                            <Text variant="bodyMedium" style={styles.cardDesc}>Access your shop dashboard</Text>
                        </View>
                        <AppIcon name="plus" size={24} color="#ccc" />
                    </View>
                </TouchableRipple>
            </Surface>

            <Surface style={[styles.card, { borderLeftColor: '#00BFA5', borderLeftWidth: 8 }]} elevation={2}>
                <TouchableRipple onPress={() => navigation.navigate('ShopRequest')} style={styles.cardRipple}>
                    <View style={styles.cardInner}>
                        <View style={[styles.iconBox, { backgroundColor: '#E0F2F1' }]}>
                            <AppIcon name="store" size={32} color="#00BFA5" />
                        </View>
                        <View style={styles.cardTextContainer}>
                            <Text variant="titleLarge" style={styles.cardTitle}>Register My Shop</Text>
                            <Text variant="bodyMedium" style={styles.cardDesc}>Start a new shop journey</Text>
                        </View>
                        <AppIcon name="plus" size={24} color="#ccc" />
                    </View>
                </TouchableRipple>
            </Surface>

            <Surface style={[styles.card, { borderLeftColor: '#FF4081', borderLeftWidth: 8 }]} elevation={2}>
                <TouchableRipple onPress={() => navigation.navigate('JoinShop')} style={styles.cardRipple}>
                    <View style={styles.cardInner}>
                        <View style={[styles.iconBox, { backgroundColor: '#FCE4EC' }]}>
                            <AppIcon name="group" size={32} color="#FF4081" />
                        </View>
                        <View style={styles.cardTextContainer}>
                            <Text variant="titleLarge" style={styles.cardTitle}>Join a Team</Text>
                            <Text variant="bodyMedium" style={styles.cardDesc}>Join as Owner, Manager or Sales</Text>
                        </View>
                        <AppIcon name="plus" size={24} color="#ccc" />
                    </View>
                </TouchableRipple>
            </Surface>
        </View>

        <View style={styles.footerContainer}>
            <Text style={styles.footer}>© 2026 My Shop • Smart Business Solutions</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  backgroundDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    opacity: 0.1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
    alignItems: 'center',
  },
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontWeight: '900',
    color: '#1a1a1a',
    letterSpacing: -1,
  },
  subtitle: {
    color: '#555',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 16,
    paddingHorizontal: 10,
  },
  content: {
    flex: 1,
  },
  card: {
    marginBottom: 20,
    borderRadius: 20,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  cardRipple: {
    padding: 16,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#222',
  },
  cardDesc: {
    color: '#777',
    marginTop: 2,
  },
  footerContainer: {
    marginTop: 40,
    alignItems: 'center',
    paddingBottom: 20,
  },
  footer: {
    textAlign: 'center',
    color: '#999',
    fontWeight: '500',
  },
});

export default LandingScreen;
