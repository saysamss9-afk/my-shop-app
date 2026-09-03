import React, { useState, useEffect, useMemo } from 'react';
import { FlatList, Linking, Alert, Share, Clipboard, SectionList, ScrollView, StatusBar, Platform } from 'react-native';
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
  Input,
  InputField,
  InputSlot,
  InputIcon,
  SearchIcon,
  Button,
  ButtonText,
  ButtonIcon,
  MailIcon,
  PhoneIcon,
  CopyIcon,
  ShareIcon,
  TrashIcon,
  CheckIcon,
  EditIcon,
  ChevronDownIcon,
  Menu,
  MenuItem,
  MenuItemLabel,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  CloseIcon,
  ArrowLeftIcon,
} from '@gluestack-ui/themed';
import { Appbar } from 'react-native-paper';
import { User, MapPin } from 'lucide-react-native';
import firebase from '../../firebase-config';
import ScreenWrapper from '../../components/common/ScreenWrapper';

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

      // If we are here, user is Admin. Start listeners.
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

  const renderShopItem = ({ item }: { item: any }) => (
    <Box bg="$white" p="$5" rounded="$3xl" mb="$4" borderWidth={1} borderColor="$borderLight" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <HStack justifyContent="space-between" alignItems="flex-start">
        <VStack flex={1} space="xs">
          <Heading size="md" color="$text900">{item.name}</Heading>
          <Text size="xs" color="$text500" textTransform="uppercase" letterSpacing={1}>{item.type}</Text>

          <Pressable onPress={() => copyToClipboard(item.id)} mt="$2">
            <HStack space="xs" alignItems="center" bg="$primary50" px="$3" py="$1.5" rounded="$xl" alignSelf="flex-start">
              <Text size="sm" fontWeight="$bold" color="$primary600" style={{ letterSpacing: 1 }}>
                {item.id}
              </Text>
              <Icon as={CopyIcon} size="xs" color="$primary600" />
            </HStack>
          </Pressable>
        </VStack>

        <HStack space="xs">
            <Button variant="outline" size="sm" action="positive" p="$2" rounded="$full" onPress={() => openWhatsApp(item.whatsappNumber, item.name, item.id)}>
                <ButtonIcon as={PhoneIcon} />
            </Button>
            <Button variant="outline" size="sm" action="negative" p="$2" rounded="$full" onPress={() => handleDeleteShop(item.id)}>
                <ButtonIcon as={TrashIcon} color="$error600" />
            </Button>
        </HStack>
      </HStack>

      <Box h={1} bg="$backgroundLight100" my="$4" />

      <VStack space="sm">
        <HStack space="sm" alignItems="center">
          <Icon as={User} size="xs" color="$text400" />
          <Text size="sm" color="$text700">{item.ownerName}</Text>
        </HStack>
        <HStack space="sm" alignItems="center">
          <Icon as={PhoneIcon} size="xs" color="$text400" />
          <Text size="sm" color="$text700">{item.whatsappNumber}</Text>
        </HStack>
      </VStack>
    </Box>
  );

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
    const filtered = shops.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groups: { [key: string]: any[] } = {};
    filtered.forEach(shop => {
      if (!groups[shop.type]) {
        groups[shop.type] = [];
      }
      groups[shop.type].push(shop);
    });

    return Object.keys(groups).map(type => ({
      title: type,
      data: groups[type]
    })).sort((a, b) => a.title.localeCompare(b.title));
  }, [shops, searchQuery]);

  const renderRequestItem = ({ item }: { item: any }) => (
    <Box bg="$white" p="$4" rounded="$2xl" mb="$4" borderWidth={1} borderColor="$borderLight" style={{ ...platformShadow({ offsetY: 6, radius: 18, color: 'rgba(110,59,230,0.06)' }) }}>
      <HStack justifyContent="space-between" alignItems="flex-start">
        <VStack flex={1}>
          <Heading size="md" color="$text900">{item.shopName}</Heading>
          <Text size="xs" color="$text500" textTransform="uppercase">{item.shopType}</Text>
        </VStack>
        <Badge size="sm" variant="solid" action={item.status === 'REVIEWING' ? 'info' : 'warning'} rounded="$lg">
          <BadgeText size="xs" fontWeight="$bold">{item.status === 'REVIEWING' ? 'REVISIT' : 'NEW REQUEST'}</BadgeText>
        </Badge>
      </HStack>

      <VStack space="sm" mt="$4" mb="$6">
        <HStack space="sm" alignItems="center">
          <Center w="$6" h="$6" rounded="$full" bg="$primary50">
            <Icon as={User} size="xs" color="$primary800" />
          </Center>
          <Text size="sm">{item.ownerName}</Text>
        </HStack>
        <HStack space="sm" alignItems="center">
          <Center w="$6" h="$6" rounded="$full" bg="$success50">
            <Icon as={PhoneIcon} size="xs" color="$success600" />
          </Center>
          <Text size="sm">{item.whatsappNumber}</Text>
        </HStack>
        <HStack space="sm" alignItems="center">
          <Center w="$6" h="$6" rounded="$full" bg="$backgroundLight100">
            <Icon as={MapPin} size="xs" color="$text500" />
          </Center>
          <Text size="xs" color="$text600" flexShrink={1}>{item.location} ({item.country})</Text>
        </HStack>
        {item.currency && (
          <HStack space="sm" alignItems="center">
             <Badge action="info" variant="outline" size="sm">
                <BadgeText size="xxs">Currency: {item.currency}</BadgeText>
             </Badge>
          </HStack>
        )}
      </VStack>

      <HStack space="md">
        <Button variant="outline" size="sm" action="secondary" onPress={() => handleEditRequest(item)} borderRadius="$lg">
          <ButtonIcon as={EditIcon} />
        </Button>
        <Button variant="outline" size="sm" action="positive" onPress={() => openWhatsApp(item.whatsappNumber, item.shopName)} borderRadius="$lg">
          <ButtonIcon as={PhoneIcon} />
        </Button>
        <Button variant="outline" size="sm" action="negative" onPress={() => handleDeleteRequest(item.id)} borderRadius="$lg">
          <ButtonIcon as={TrashIcon} color="$error600" />
        </Button>
        <Box flex={1} />
        <Button size="sm" action="primary" onPress={() => handleApprove(item)} isDisabled={!!processing} borderRadius="$lg" bg="$primary800">
          {processing === item.id ? <Spinner color="white" size="small" /> : <ButtonText fontWeight="$bold">Approve</ButtonText>}
        </Button>
      </HStack>
    </Box>
  );

  return (
    <ScreenWrapper withHeader>
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />

      {/* Modern Solid Header */}
      <Box bg="$primary800">
        <Appbar.Header style={{ backgroundColor: 'transparent', elevation: 0 }}>
          <Pressable onPress={() => navigation.replace('Login')} p="$2">
            <Icon as={ArrowLeftIcon} color="white" />
          </Pressable>
          <Appbar.Content
            title="Admin Control"
            titleStyle={{ color: 'white', fontWeight: '900', fontSize: 20 }}
            subtitle={viewMode === 'requests' ? "Registration Queue" : "Network Overview"}
            subtitleStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}
          />
          <Pressable onPress={() => firebase.auth().signOut()} p="$3">
            <Icon as={CheckIcon} color="white" />
          </Pressable>
        </Appbar.Header>
      </Box>

      {/* Top Actions Section */}
      <VStack space="md" p="$5" bg="$white" borderBottomWidth={1} borderColor="$borderLight">
        <HStack space="md" bg="$backgroundLight50" p="$1" rounded="$xl">
          <Pressable
            flex={1}
            onPress={() => setViewMode('requests')}
            bg={viewMode === 'requests' ? '$white' : 'transparent'}
            p="$2"
            rounded="$lg"
            style={{ ...platformShadow({ offsetY: 2, radius: 10, color: 'rgba(110,59,230,0.06)' }) }}
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
            style={{ ...platformShadow({ offsetY: 2, radius: 10, color: 'rgba(110,59,230,0.06)' }) }}
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
          data={viewMode === 'requests' ? filteredRequests : shops.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={viewMode === 'requests' ? renderRequestItem : renderShopItem}
          ListEmptyComponent={
            <Center mt="$20">
              <Text color="$text400">Nothing found in the {viewMode === 'requests' ? 'queue' : 'database'}.</Text>
            </Center>
          }
        />
      )}

      {/* Shop List for 'shops' mode would go here, simplified for now */}

      {/* Edit Modal */}
      <Modal isOpen={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} size="lg">
        <ModalBackdrop />
        <ModalContent rounded="$3xl">
          <ModalHeader>
            <Heading size="lg">Refine Request</Heading>
            <ModalCloseButton>
              <Icon as={CloseIcon} />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <ScrollView showsVerticalScrollIndicator={false}>
              <VStack space="lg" py="$4">
                <FormControl isRequired>
                  <FormControlLabel mb="$1">
                    <FormControlLabelText>Owner Name</FormControlLabelText>
                  </FormControlLabel>
                  <Input borderRadius={10}>
                    <InputField
                      value={editForm.ownerName}
                      onChangeText={(text) => setEditForm(prev => ({ ...prev, ownerName: text }))}
                    />
                  </Input>
                </FormControl>

                <FormControl isRequired>
                  <FormControlLabel mb="$1">
                    <FormControlLabelText>WhatsApp Number</FormControlLabelText>
                  </FormControlLabel>
                  <Input borderRadius={10}>
                    <InputField
                      value={editForm.whatsappNumber}
                      onChangeText={(text) => setEditForm(prev => ({ ...prev, whatsappNumber: text }))}
                      keyboardType="phone-pad"
                    />
                  </Input>
                </FormControl>

                <FormControl isRequired>
                  <FormControlLabel mb="$1">
                    <FormControlLabelText>Shop Name</FormControlLabelText>
                  </FormControlLabel>
                  <Input borderRadius={10}>
                    <InputField
                      value={editForm.shopName}
                      onChangeText={(text) => setEditForm(prev => ({ ...prev, shopName: text }))}
                    />
                  </Input>
                </FormControl>

                <Menu
                  trigger={({ ...triggerProps }) => (
                    <Pressable {...triggerProps} borderWidth={1} borderColor="$borderLight" p="$3" rounded="$lg">
                      <HStack justifyContent="space-between" alignItems="center">
                        <Text size="sm">Type: {editForm.shopType || 'Select'}</Text>
                        <Icon as={ChevronDownIcon} />
                      </HStack>
                    </Pressable>
                  )}
                >
                  {SHOP_TYPES.map(type => (
                    <MenuItem key={type} textValue={type} onPress={() => setEditForm(prev => ({ ...prev, shopType: type }))}>
                      <MenuItemLabel size="sm">{type}</MenuItemLabel>
                    </MenuItem>
                  ))}
                </Menu>

                <FormControl>
                  <FormControlLabel mb="$1">
                    <FormControlLabelText>Location</FormControlLabelText>
                  </FormControlLabel>
                  <Input borderRadius={10}>
                    <InputField
                      value={editForm.location}
                      onChangeText={(text) => setEditForm(prev => ({ ...prev, location: text }))}
                      multiline
                    />
                  </Input>
                </FormControl>
              </VStack>
            </ScrollView>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" action="secondary" onPress={() => setIsEditDialogOpen(false)} mr="$3" borderRadius="$lg">
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button action="primary" onPress={saveEdit} borderRadius="$lg" bg="$primary800">
              {processing === editingRequest?.id ? <Spinner color="white" /> : <ButtonText>Save Changes</ButtonText>}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </ScreenWrapper>
  );
};

export default AdminDashboardScreen;
