import React, { useState, useEffect, useMemo } from 'react';
import { FlatList, Linking, Alert, Share, Clipboard, SectionList, ScrollView, StatusBar } from 'react-native';
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

  // Edit Modal State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    ownerName: '',
    whatsappNumber: '',
    shopName: '',
    shopType: '',
    location: ''
  });

  useEffect(() => {
    const unsubscribeReq = firebase.firestore().collection('shop_requests')
      .where('status', 'in', ['PENDING', 'REVIEWING'])
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        data.sort((a: any, b: any) => {
            if (a.status === b.status) return 0;
            return a.status === 'PENDING' ? -1 : 1;
        });
        setRequests(data);
        if (viewMode === 'requests') setLoading(false);
      }, error => {
        console.error(error);
        setLoading(false);
      });

    const unsubscribeShops = firebase.firestore().collection('registered_shops')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setShops(data);
        if (viewMode === 'shops') setLoading(false);
      });

    return () => {
      unsubscribeReq();
      unsubscribeShops();
    };
  }, [viewMode]);

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
        createdAt: Date.now()
      });

      await firebase.firestore().collection('shop_requests').doc(request.id).update({
        status: 'APPROVED',
        shopId: shopId,
        approvedAt: Date.now()
      });

      Alert.alert(
        'Shop Created Successfully',
        `Shop Code: ${shopId}\n\nShare this code with the owner.`,
        [
          { text: "Copy Code", onPress: () => Clipboard.setString(shopId) },
          { text: "Share WhatsApp", onPress: () => openWhatsApp(request.whatsappNumber, request.shopName, shopId) },
          { text: "Done", style: "cancel" }
        ]
      );
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
      location: request.location
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
    Clipboard.setString(text);
    Alert.alert("Copied", "Shop code copied to clipboard");
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
    <Box bg="$white" p="$4" rounded="$2xl" mb="$4" borderWidth={1} borderColor="$borderLight" shadowColor="$primary800">
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
          <Text size="xs" color="$text600" flexShrink={1}>{item.location}</Text>
        </HStack>
      </VStack>

      <HStack space="md">
        <Button variant="outline" size="sm" action="secondary" onPress={() => handleEditRequest(item)} borderRadius="$lg">
          <ButtonIcon as={EditIcon} />
        </Button>
        <Button variant="outline" size="sm" action="positive" onPress={() => openWhatsApp(item.whatsappNumber, item.shopName)} borderRadius="$lg">
          <ButtonIcon as={PhoneIcon} />
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
            shadowColor="$primary800"
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
            shadowColor="$primary800"
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
          data={viewMode === 'requests' ? filteredRequests : []}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={renderRequestItem}
          ListEmptyComponent={
            <Center mt="$20">
              <Text color="$text400">Nothing found in the queue.</Text>
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
