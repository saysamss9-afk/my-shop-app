import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FlatList, SectionList, Linking, Alert, Clipboard, StatusBar, Platform } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Center,
  Spinner,
  Input,
  InputField,
  InputSlot,
  InputIcon,
  SearchIcon,
  Pressable,
  Badge,
  BadgeText,
} from '@gluestack-ui/themed';
import firebase from '../../firebase-config';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import { getAppShadow } from '../../utils/platformStyles';

// Sub-components
import AdminHeader from './components/AdminHeader';
import ShopRequestItem from './components/ShopRequestItem';
import RegisteredShopItem from './components/RegisteredShopItem';
import EditRequestModal from './components/EditRequestModal';

const AdminDashboardScreen = ({ navigation }: any) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [upgrades, setUpgrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('requests');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    ownerName: '',
    whatsappNumber: '',
    shopName: '',
    shopType: '',
    location: '',
    country: '',
    currency: ''
  });

  const handleDeleteRequest = (id: string) => {
    const confirmDelete = Platform.OS === 'web'
      ? window.confirm("Are you sure you want to delete this shop request?")
      : true;

    const deleteFn = async () => {
      setProcessing(id);
      try {
        await firebase.firestore().collection('shop_requests').doc(id).delete();
        if (Platform.OS === 'web') window.alert("Request deleted successfully");
      } catch (e: any) {
        Alert.alert("Error", e.message);
      } finally {
        setProcessing(null);
      }
    };

    if (Platform.OS === 'web') {
      if (confirmDelete) deleteFn();
    } else {
      Alert.alert("Delete Request", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteFn }
      ]);
    }
  };

  const handleDeleteShop = (id: string) => {
    const confirmDelete = Platform.OS === 'web'
      ? window.confirm("Are you sure you want to permanently delete this shop and all its data?")
      : true;

    const deleteFn = async () => {
      setProcessing(id);
      try {
        await firebase.firestore().collection('registered_shops').doc(id).delete();
        if (Platform.OS === 'web') window.alert("Shop record deleted");
      } catch (e: any) {
        Alert.alert("Error", e.message);
      } finally {
        setProcessing(null);
      }
    };

    if (Platform.OS === 'web') {
      if (confirmDelete) deleteFn();
    } else {
      Alert.alert("Delete Shop", "This cannot be undone. Proceed?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteFn }
      ]);
    }
  };

  useEffect(() => {
    let unsubReq: any;
    let unsubShops: any;
    let unsubUpgrades: any;

    const unsubscribeAuth = firebase.auth().onAuthStateChanged(user => {
      // Clean up previous listeners if auth changes
      if (unsubReq) unsubReq();
      if (unsubShops) unsubShops();
      if (unsubUpgrades) unsubUpgrades();

      if (!user || user.uid !== "l2JP5nnzVSP6gd8aSDEqI60Tbfl2") {
        navigation.replace('Landing');
        return;
      }

      // Admin authenticated. Start listeners.
      unsubReq = firebase.firestore().collection('shop_requests')
        .where('status', 'in', ['PENDING', 'REVIEWING'])
        .onSnapshot(snapshot => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setRequests(data);
          setLoading(false);
        }, error => {
          console.error("AdminDashboard: Error fetching shop_requests:", error);
          setLoading(false);
        });

      unsubShops = firebase.firestore().collection('registered_shops')
        .onSnapshot(snapshot => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setShops(data);
        }, error => {
          console.error("AdminDashboard: Error fetching registered_shops:", error);
        });

      unsubUpgrades = firebase.firestore().collection('plan_upgrade_requests')
        .where('status', '==', 'PENDING')
        .onSnapshot(snapshot => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setUpgrades(data);
        }, error => {
          console.error("AdminDashboard: Error fetching upgrade requests:", error);
        });
    });

    return () => {
      unsubscribeAuth();
      if (unsubReq) unsubReq();
      if (unsubShops) unsubShops();
      if (unsubUpgrades) unsubUpgrades();
    };
  }, [navigation]);

  const handleApprove = async (request: any) => {
    setProcessing(request.id);
    try {
      const year = new Date().getFullYear();
      const random = Math.floor(1000 + Math.random() * 9000);
      const shopId = `MS-${year}-${random}`;

      await firebase.firestore().collection('registered_shops').doc(shopId).set({
        id: shopId,
        ownerId: request.userId, // Link the ownerId from the request
        name: request.shopName,
        type: request.shopType,
        location: request.location,
        ownerName: request.ownerName,
        whatsappNumber: request.whatsappNumber,
        country: request.country || 'Ghana',
        currency: request.currency || 'GH₵',
        plan: request.shopCategory || 'STARTER',
        staffCount: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await firebase.firestore().collection('shop_requests').doc(request.id).update({
        status: 'APPROVED',
        shopId: shopId,
        approvedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      if (Platform.OS === 'web') {
        window.alert(`Shop Created Successfully!\n\nShop Code: ${shopId}\n\nCopy this code and share it with the owner.`);
        (navigator as any).clipboard.writeText(shopId);
      } else {
        Alert.alert(
          'Shop Created Successfully',
          `Shop Code: ${shopId}\n\nShare this code with the owner.`,
          [
            { text: "Copy Code", onPress: () => Clipboard.setString(shopId) },
            { text: "Share WhatsApp", onPress: () => openWhatsApp(request.whatsappNumber, request.shopName, shopId) },
            { text: "Done", style: "cancel" }
          ]
        );
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert('Approval failed', e.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleEditRequest = (request: any) => {
    setEditingRequest(request);
    setEditForm({
      ownerName: request.ownerName,
      whatsappNumber: request.whatsappNumber,
      shopName: request.shopName,
      shopType: request.shopType,
      location: request.location,
      country: request.country || 'Ghana',
      currency: request.currency || 'GH₵'
    });
    setIsEditDialogOpen(true);
  };

  const saveEdit = async () => {
    if (!editingRequest) return;
    setProcessing(editingRequest.id);
    try {
      await firebase.firestore().collection('shop_requests').doc(editingRequest.id).update({
        ...editForm
      });
      setIsEditDialogOpen(false);
      setEditingRequest(null);
    } catch (e: any) {
      Alert.alert("Error", "Failed to update request: " + e.message);
    } finally {
      setProcessing(null);
    }
  };

  const openWhatsApp = (phone: string, shopName: string, shopId?: string) => {
    let message = `Hello, this is My Shop admin. regarding your request for ${shopName}.`;
    if (shopId) {
        message += ` Your shop has been approved! Your Shop Code is: ${shopId}. You can now join the shop in the app.`;
    }
    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "WhatsApp is not installed on this device");
    });
  };

  const copyToClipboard = (text: string) => {
    if (Platform.OS === 'web') {
      (navigator as any).clipboard.writeText(text).then(() => {
        window.alert("Copied to clipboard: " + text);
      }).catch((err: any) => {
        console.error('Failed to copy: ', err);
      });
    } else {
      Clipboard.setString(text);
      Alert.alert("Copied", "Shop code copied to clipboard");
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(r =>
      r.shopName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.shopType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ownerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [requests, searchQuery]);

  const filteredShops = useMemo(() => {
    return shops.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [shops, searchQuery]);

  const shopSections = useMemo(() => {
    const starters = filteredShops.filter(s => !(s.parentShopId || s.parentshopid) && (s.plan?.toUpperCase() === 'STARTER' || !s.plan));
    const business = filteredShops.filter(s => !(s.parentShopId || s.parentshopid) && s.plan?.toUpperCase() === 'BUSINESS');
    const premium = filteredShops.filter(s => !(s.parentShopId || s.parentshopid) && s.plan?.toUpperCase() === 'PREMIUM');
    const branches = filteredShops.filter(s => s.parentShopId || s.parentshopid);

    const sections: { title: string; data: any[] }[] = [];
    if (premium.length > 0) sections.push({ title: 'Premium Plan', data: premium });
    if (business.length > 0) sections.push({ title: 'Business Plan', data: business });
    if (starters.length > 0) sections.push({ title: 'Starter Plan', data: starters });
    if (branches.length > 0) sections.push({ title: 'Branch Locations', data: branches });

    return sections;
  }, [filteredShops]);

  const renderReqItem = useCallback(({ item }: any) => (
    <ShopRequestItem
        item={item}
        processing={processing}
        onEdit={handleEditRequest}
        onWhatsApp={openWhatsApp}
        onDelete={handleDeleteRequest}
        onApprove={handleApprove}
    />
  ), [processing]);

  const renderActiveShopItem = useCallback(({ item }: any) => (
    <RegisteredShopItem
        item={item}
        onCopy={copyToClipboard}
        onWhatsApp={openWhatsApp}
        onDelete={handleDeleteShop}
    />
  ), []);

  const renderUpgradeItem = useCallback(({ item }: any) => (
    <Box bg="$white" p="$4" rounded="$2xl" mb="$4" borderWidth={1} borderColor="$borderLight">
      <VStack space="sm">
        <Heading size="sm">{item.shopName}</Heading>
        <HStack space="md" alignItems="center">
          <Badge action="muted" variant="outline"><BadgeText>{item.currentPlan}</BadgeText></Badge>
          <Text size="xs">→</Text>
          <Badge action="success" variant="solid"><BadgeText>{item.requestedPlan}</BadgeText></Badge>
        </HStack>
        <Text size="xs">ID: {item.shopId}</Text>
        <HStack space="md" mt="$2">
          <Button size="xs" flex={1} action="primary" bg="$primary800" onPress={async () => {
             try {
                await firebase.firestore().collection('registered_shops').doc(item.shopId).update({ plan: item.requestedPlan });
                await firebase.firestore().collection('plan_upgrade_requests').doc(item.id).update({ status: 'APPROVED' });
                window.alert("Plan upgraded successfully!");
             } catch(e: any) { window.alert(e.message); }
          }}>
            <ButtonText>Approve</ButtonText>
          </Button>
          <Button size="xs" flex={1} variant="outline" action="negative" onPress={async () => {
             await firebase.firestore().collection('plan_upgrade_requests').doc(item.id).update({ status: 'REJECTED' });
          }}>
            <ButtonText>Reject</ButtonText>
          </Button>
        </HStack>
      </VStack>
    </Box>
  ), []);

  return (
    <ScreenWrapper withHeader>
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />

      <AdminHeader
        viewMode={viewMode}
        onBack={() => navigation.replace('Login')}
        onSignOut={() => firebase.auth().signOut()}
      />

      <VStack space="md" p="$5" bg="$white" borderBottomWidth={1} borderColor="$borderLight">
        <HStack space="md" bg="$backgroundLight50" p="$1" rounded="$xl">
          <Pressable
            flex={1}
            onPress={() => setViewMode('requests')}
            bg={viewMode === 'requests' ? '$white' : 'transparent'}
            p="$2"
            rounded="$lg"
            style={{ ...getAppShadow({ offsetY: 2, radius: 10, color: 'rgba(110,59,230,0.06)' }) }}
          >
            <Center>
              <Text size="sm" fontWeight="$bold" color={viewMode === 'requests' ? '$primary800' : '$text500'}>
                Queue ({requests.length})
              </Text>
            </Center>
          </Pressable>
          <Pressable
            flex={1}
            onPress={() => setViewMode('shops')}
            bg={viewMode === 'shops' ? '$white' : 'transparent'}
            p="$2"
            rounded="$lg"
            style={{ ...getAppShadow({ offsetY: 2, radius: 10, color: 'rgba(110,59,230,0.06)' }) }}
          >
            <Center>
              <Text size="sm" fontWeight="$bold" color={viewMode === 'shops' ? '$primary800' : '$text500'}>
                Shops ({shops.length})
              </Text>
            </Center>
          </Pressable>
          <Pressable
            flex={1}
            onPress={() => setViewMode('upgrades')}
            bg={viewMode === 'upgrades' ? '$white' : 'transparent'}
            p="$2"
            rounded="$lg"
            style={{ ...getAppShadow({ offsetY: 2, radius: 10, color: 'rgba(110,59,230,0.06)' }) }}
          >
            <Center>
              <Text size="sm" fontWeight="$bold" color={viewMode === 'upgrades' ? '$primary800' : '$text500'}>
                Upgrades ({upgrades.length})
              </Text>
            </Center>
          </Pressable>
        </HStack>

        <Input variant="outline" size="md" borderRadius={12}>
          <InputSlot pl="$3">
            <InputIcon as={SearchIcon} color="$primary800" />
          </InputSlot>
          <InputField
            placeholder="Search database..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </Input>
      </VStack>

      {loading ? (
        <Center flex={1}>
          <Spinner size="large" color="$primary800" />
        </Center>
      ) : viewMode === 'shops' ? (
        <SectionList
          sections={shopSections}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          renderItem={renderActiveShopItem}
          renderSectionHeader={({ section: { title } }) => (
            <Box bg="$white" py="$3" borderBottomWidth={1} borderColor="$borderLight200" mb="$3" mt="$4">
              <Heading size="xs" color="$primary800" textTransform="uppercase" fontWeight="$bold">{title}</Heading>
            </Box>
          )}
          ListEmptyComponent={
            <Center mt="$20">
              <Text color="$text400">No registered shops found.</Text>
            </Center>
          }
        />
      ) : (
        <FlatList
          data={viewMode === 'requests' ? filteredRequests : upgrades}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          renderItem={viewMode === 'requests' ? renderReqItem : renderUpgradeItem}
          ListEmptyComponent={
            <Center mt="$20">
              <Text color="$text400">Nothing found in the {viewMode === 'requests' ? 'queue' : 'database'}.</Text>
            </Center>
          }
        />
      )}

      <EditRequestModal
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        editForm={editForm}
        setEditForm={setEditForm}
        onSave={saveEdit}
        processing={processing === editingRequest?.id}
      />
    </ScreenWrapper>
  );
};

export default AdminDashboardScreen;
