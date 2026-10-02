import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, StatusBar } from 'react-native';
import {
  Box,
  HStack,
  VStack,
  Text,
  Heading,
  Center,
  Badge,
  BadgeText,
  Spinner,
  Pressable,
} from '@gluestack-ui/themed';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import firebase from '../../firebase-config';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import ModernLoader from '../../components/common/ModernLoader';
import { getAppShadow } from '../../utils/platformStyles';
import { getDBConnection } from '../../db/database';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';

import StaffMemberItem from './components/StaffMemberItem';

type Props = StackScreenProps<RootStackParamList, 'StaffManagement'>;

const StaffManagementScreen: React.FC<Props> = ({ route, navigation }) => {
  const { shopId } = route.params;
  const [employees, setEmployees] = useState<any[]>([]);
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let isMounted = true;

    // 1. Instant Cache Load from local SQLite / AlaSQL DB
    const loadCachedStaff = async () => {
      try {
        const safeShopId = (shopId || '').toString().trim();
        const db = await getDBConnection();

        // Load local shop info
        const shopRes = await db.executeSql(
          'SELECT [plan], name FROM Shop WHERE (TRIM(LOWER(id)) = TRIM(LOWER(?)) OR id = ? OR TRIM(id) = ?)',
          [safeShopId, safeShopId, safeShopId]
        );
        if (shopRes[0]?.rows?.length > 0) {
          const sRows = shopRes[0].rows;
          const sRow = typeof (sRows as any).item === 'function' ? sRows.item(0) : (sRows as any)[0];
          if (isMounted && sRow) setShopInfo({ plan: sRow.plan || 'STARTER', name: sRow.name });
        }

        // Load local employee cache
        const empRes = await db.executeSql(
          'SELECT * FROM Employee WHERE (TRIM(LOWER(shopId)) = TRIM(LOWER(?)) OR shopId = ? OR TRIM(shopId) = ?)',
          [safeShopId, safeShopId, safeShopId]
        );
        const rows = empRes[0]?.rows;
        if (rows && rows.length > 0) {
          const cachedEmps: any[] = [];
          for (let i = 0; i < rows.length; i++) {
            const row = typeof (rows as any).item === 'function' ? rows.item(i) : (rows as any)[i];
            if (row) cachedEmps.push(row);
          }
          if (isMounted && cachedEmps.length > 0) {
            setEmployees(cachedEmps);
            setLoading(false);
          }
        }
      } catch (e) {
        console.warn('StaffManagement: Local cache load error', e);
      }
    };

    loadCachedStaff();

    // 2. Fetch remote shop info & subscribe to remote changes
    firebase.firestore().collection('registered_shops').doc(shopId).get()
      .then((doc: any) => {
        if (doc.exists && isMounted) setShopInfo(doc.data());
      })
      .catch((err: any) => console.error("StaffManagement: Error fetching shop info", err));

    const unsubscribe = firebase.firestore().collection('employees')
      .where('shopId', '==', shopId)
      .onSnapshot((snapshot: any) => {
        if (!isMounted) return;
        const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        setEmployees(data);
        setLoading(false);

        // Background update local DB cache
        getDBConnection().then(async (db) => {
          for (const emp of data) {
            await db.executeSql(
              'INSERT OR REPLACE INTO Employee(id, shopId, name, role, email) VALUES (?, ?, ?, ?, ?)',
              [emp.id || emp.uid, shopId, emp.name || 'Staff', emp.role || 'SALES', emp.email || '']
            );
          }
        }).catch(() => {});
      }, (error: any) => {
        console.error("StaffManagement: Error fetching employees:", error);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [shopId]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <StaffMemberItem item={item} />
  ), []);

  return (
    <ScreenWrapper withHeader>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <Box px="$2" pt={Math.max(insets.top, 10)} pb="$4">
        <HStack justifyContent="space-between" alignItems="center">
          <HStack space="md" alignItems="center">
            <Pressable onPress={() => navigation.goBack()} p="$2.5" bg="$white" rounded="$full" style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.05)' }) }}>
              <ArrowLeft size={22} color="#111827" />
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
        <ModernLoader label="Loading Staff Members..." subLabel="Fetching team records" />
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
