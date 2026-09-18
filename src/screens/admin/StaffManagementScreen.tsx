import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, Linking, StatusBar } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Pressable,
  Center,
  Badge,
  BadgeText,
  Spinner,
  ArrowLeftIcon,
  PhoneIcon,
  MailIcon,
  TrashIcon,
} from '@gluestack-ui/themed';
import { Appbar } from 'react-native-paper';
import { User, ShieldCheck, CreditCard } from 'lucide-react-native';
import firebase from '../../firebase-config';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';

import StaffMemberItem from './components/StaffMemberItem';

type Props = StackScreenProps<RootStackParamList, 'StaffManagement'>;

const StaffManagementScreen: React.FC<Props> = ({ route, navigation }) => {
  const { shopId } = route.params;
  const [employees, setEmployees] = useState<any[]>([]);
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch shop info for plan details
    firebase.firestore().collection('registered_shops').doc(shopId).get()
      .then(doc => {
        if (doc.exists) setShopInfo(doc.data());
      })
      .catch(err => console.error("StaffManagement: Error fetching shop info", err));

    const unsubscribe = firebase.firestore().collection('employees')
      .where('shopId', '==', shopId)
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEmployees(data);
        setLoading(false);
      }, error => {
        console.error("StaffManagement: Error fetching employees:", error);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [shopId]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <StaffMemberItem item={item} />
  ), []);

  return (
    <ScreenWrapper withHeader>
      <StatusBar barStyle="dark-content" backgroundColor="#F3ECFF" />

      <Box px="$2" pt="$2" pb="$4">
        <HStack justifyContent="space-between" alignItems="center">
          <HStack space="md" alignItems="center">
            <Pressable onPress={() => navigation.goBack()} p="$2" bg="$white" rounded="$full">
              <Icon as={ArrowLeftIcon} color="$text900" />
            </Pressable>
            <VStack>
              <Heading size="lg" color="$text900" fontWeight="$black">Staff List</Heading>
              {shopInfo && (
                  <HStack space="xs" alignItems="center">
                    <Badge action="info" variant="outline" size="sm" rounded="$md">
                        <BadgeText size="2xs">{shopInfo.plan || 'STARTER'}</BadgeText>
                    </Badge>
                    <Text size="xs" color="$text500">
                        {employees.length} / {shopInfo.plan === 'STARTER' ? '3' : '∞'} Staff
                    </Text>
                  </HStack>
              )}
            </VStack>
          </HStack>
        </HStack>
      </Box>

      {loading ? (
        <Center flex={1}>
          <Spinner size="large" color="$primary600" />
        </Center>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={renderItem}
          ListEmptyComponent={
            <Center mt="$20">
              <Text color="$text400">No staff members found.</Text>
            </Center>
          }
        />
      )}
    </ScreenWrapper>
  );
};

export default StaffManagementScreen;
