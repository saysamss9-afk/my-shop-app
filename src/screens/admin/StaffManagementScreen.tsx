import React, { useState, useEffect } from 'react';
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
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = StackScreenProps<RootStackParamList, 'StaffManagement'>;

const StaffManagementScreen: React.FC<Props> = ({ route, navigation }) => {
  const { shopId } = route.params;
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const renderEmployeeItem = ({ item }: { item: any }) => (
    <Box bg="$white" p="$5" rounded="$3xl" mb="$4" borderWidth={1} borderColor="$borderLight" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <HStack justifyContent="space-between" alignItems="flex-start">
        <HStack space="md" flex={1}>
          <Center w={48} h={48} rounded="$full" bg="$primary50">
            <Icon as={User} color="$primary600" />
          </Center>
          <VStack flex={1} space="xs">
            <Heading size="md" color="$text900">{item.name || 'Unnamed Staff'}</Heading>
            <HStack space="xs" alignItems="center">
                <Badge action={item.role === 'OWNER' ? 'info' : 'warning'} variant="outline" rounded="$lg" size="sm">
                    <BadgeText size="xs">{item.role}</BadgeText>
                </Badge>
                {item.joinedAt && (
                    <Text size="xxs" color="$text400">Joined: {new Date(item.joinedAt.seconds * 1000).toLocaleDateString()}</Text>
                )}
            </HStack>
          </VStack>
        </HStack>
      </HStack>

      <Box h={1} bg="$backgroundLight100" my="$4" />

      <VStack space="sm">
        <HStack space="sm" alignItems="center">
          <Icon as={MailIcon} size="xs" color="$text400" />
          <Text size="sm" color="$text700">{item.email}</Text>
        </HStack>
        <HStack space="sm" alignItems="center">
          <Icon as={PhoneIcon} size="xs" color="$text400" />
          <Pressable onPress={() => Linking.openURL(`tel:${item.phoneNumber}`)}>
            <Text size="sm" color="$primary600" fontWeight="$medium">{item.phoneNumber || 'No phone'}</Text>
          </Pressable>
        </HStack>
        {item.ghanaCard && (
          <HStack space="sm" alignItems="center">
            <Icon as={CreditCard} size="xs" color="$text400" />
            <Text size="sm" color="$text700">Ghana Card: {item.ghanaCard}</Text>
          </HStack>
        )}
      </VStack>
    </Box>
  );

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
              <Text size="xs" color="$text500">Manage your shop team</Text>
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
          renderItem={renderEmployeeItem}
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
