import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FlatList, Linking, Alert, Clipboard, StatusBar, Platform } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Center,
  Spinner,
  Input,
  InputField,
  InputSlot,
  InputIcon,
  SearchIcon,
  Pressable,
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
    const unsubscribeAuth = firebase.auth().onAuthStateChanged(user => {
      if (!user) {
        navigation.replace('Landing');
        return;
      }

      if (user.uid !== "l2JP5nnzVSP6gd8aSDEqI60Tbfl2") {
        navigation.replace('Landing');
        return;
      }

      // Admin authenticated. Start listeners.
      const unsubscribeReq = firebase.firestore().collection('shop_requests')
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

      const unsubscribeShops = firebase.firestore().collection('registered_shops')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setShops(data);
        }, error => {
          console.error("AdminDashboard: Error fetching registered_shops:", error);
        });

      return () => {
        unsubscribeReq();
        unsubscribeShops();
      };
    });

    return () => unsubscribeAuth();
  }, [navigation]);

  const handleApprove = async (request: any) => {
    setProcessing(request.id);
    try {
      const year = new Date().getFullYear();
      const random = Math.floor(1000 + Math.random() * 9000);
      const shopId = `MS-${year}-${random}`;

      await firebase.firestore().collection('registered_shops').doc(shopId).set({
        id: shopId,
        name: request.shopName,
        type: request.shopType,
        location: request.location,
        ownerName: request.ownerName,
        whatsappNumber: request.whatsappNumber,
        country: request.country || 'Ghana',
        currency: request.currency || 'GH₵',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await firebase.firestore().collection('shop_requests').doc(request.id).update({
        status: 'APPROVED',
        shopId: shopId,
        approvedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      if (Platform.OS === 'web') {
        window.alert(`Shop Created Successfully!\n\nShop Code: ${shopId}\n\nCopy this code and share it with the owner.`);
        navigator.clipboard.writeText(shopId);
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
      navigator.clipboard.writeText(text).then(() => {
        window.alert("Copied to clipboard: " + text);
      }).catch(err => {
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
      ) : (
        <FlatList
          data={viewMode === 'requests' ? filteredRequests : filteredShops}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={viewMode === 'requests' ? renderReqItem : renderActiveShopItem}
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
