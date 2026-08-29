import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, Linking, Alert, Share, Clipboard, SectionList, ScrollView } from 'react-native';
import { Appbar, Card, Text, useTheme, Chip, ActivityIndicator, Searchbar, SegmentedButtons, Portal, Dialog, TextInput, IconButton, Menu, Surface, TouchableRipple } from 'react-native-paper';
import firebase from '../../firebase-config';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import CustomButton from '../../components/common/CustomButton';

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

  // Edit Dialog State
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    ownerName: '',
    whatsappNumber: '',
    shopName: '',
    shopType: '',
    location: ''
  });
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);

  const theme = useTheme();

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
      const shopId = 'SHOP_' + Math.random().toString(36).substr(2, 9).toUpperCase();

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

  const handleMoveToLater = async (requestId: string) => {
    try {
      await firebase.firestore().collection('shop_requests').doc(requestId).update({
        status: 'REVIEWING'
      });
    } catch (e: any) {
      Alert.alert('Error', 'Failed to update status');
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

  const shareShopCode = async (shopName: string, code: string) => {
    try {
      await Share.share({
        message: `Shop: ${shopName}\nShop Code: ${code}\nJoin My Shop app using this code!`,
      });
    } catch (error: any) {
      Alert.alert(error.message);
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

  return (
    <ScreenWrapper withHeader>
      <Surface style={[styles.headerSurface, { backgroundColor: theme.colors.primary }]} elevation={4}>
        <Appbar.Header style={{ backgroundColor: 'transparent' }}>
            <Appbar.Content
                title="Admin Console"
                titleStyle={styles.appbarTitle}
                subtitle={viewMode === 'requests' ? "Queue Management" : "Registered Shops"}
                subtitleStyle={styles.appbarSubtitle}
            />
            <Appbar.Action icon="logout" iconColor="white" onPress={() => firebase.auth().signOut()} />
        </Appbar.Header>

        <View style={styles.topActions}>
            <SegmentedButtons
                value={viewMode}
                onValueChange={setViewMode}
                buttons={[
                    { value: 'requests', label: `Queue (${requests.length})`, icon: 'tray-full', checkedColor: 'white', uncheckedColor: 'rgba(255,255,255,0.7)' },
                    { value: 'shops', label: `Shops (${shops.length})`, icon: 'storefront', checkedColor: 'white', uncheckedColor: 'rgba(255,255,255,0.7)' },
                ]}
                style={styles.segmented}
            />
            <Searchbar
                placeholder="Search requests or shops..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchbar}
                inputStyle={{ minHeight: 0 }}
                iconColor={theme.colors.primary}
            />
        </View>
      </Surface>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={theme.colors.primary} />
      ) : viewMode === 'requests' ? (
        <FlatList
          data={filteredRequests}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Surface style={styles.card} elevation={2}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                    <Text variant="titleMedium" style={styles.cardTitle}>{item.shopName}</Text>
                    <Text variant="bodySmall" style={styles.cardType}>{item.shopType}</Text>
                </View>
                <Chip
                    selectedColor={item.status === 'REVIEWING' ? theme.colors.primary : '#FF9500'}
                    style={styles.statusChip}
                    textStyle={{ fontSize: 10, fontWeight: 'bold' }}
                >
                    {item.status === 'REVIEWING' ? 'LATER' : 'NEW'}
                </Chip>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="account-circle-outline" size={18} color={theme.colors.primary} />
                    <Text variant="bodyMedium" style={styles.detailText}>{item.ownerName}</Text>
                </View>
                <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="whatsapp" size={18} color="#25D366" />
                    <Text variant="bodyMedium" style={styles.detailText}>{item.whatsappNumber}</Text>
                </View>
                <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="map-marker-outline" size={18} color={theme.colors.outline} />
                    <Text variant="bodySmall" style={styles.detailText}>{item.location}</Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <IconButton icon="pencil-outline" size={20} onPress={() => handleEditRequest(item)} />
                <IconButton icon="whatsapp" size={20} iconColor="#25D366" onPress={() => openWhatsApp(item.whatsappNumber, item.shopName)} />
                <View style={{ flex: 1 }} />
                {item.status === 'PENDING' && (
                    <CustomButton
                        mode="text"
                        title="Later"
                        onPress={() => handleMoveToLater(item.id)}
                        disabled={!!processing}
                        style={styles.actionBtn}
                    />
                )}
                <CustomButton
                    title="Approve"
                    onPress={() => handleApprove(item)}
                    loading={processing === item.id}
                    disabled={!!processing}
                    style={styles.actionBtn}
                />
              </View>
            </Surface>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No matching requests in queue.</Text>}
        />
      ) : (
        <SectionList
          sections={filteredShops}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section: { title } }) => (
            <Text variant="titleMedium" style={styles.sectionHeader}>{title}</Text>
          )}
          renderItem={({ item }) => (
            <Surface style={styles.card} elevation={1}>
              <TouchableRipple onPress={() => copyToClipboard(item.id)} style={styles.cardRipple}>
                <View>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardTitleContainer}>
                            <Text variant="titleMedium" style={styles.cardTitle}>{item.name}</Text>
                            <Text variant="bodySmall" style={styles.shopCode}>ID: {item.id}</Text>
                        </View>
                        <IconButton icon="content-copy" size={20} />
                    </View>
                    <View style={styles.cardBody}>
                        <Text variant="bodyMedium">Owner: {item.ownerName}</Text>
                        <Text variant="bodySmall" style={{ opacity: 0.7 }}>{item.location}</Text>
                    </View>
                </View>
              </TouchableRipple>
              <View style={[styles.cardActions, { borderTopWidth: 0.5, borderTopColor: '#eee' }]}>
                <CustomButton
                    mode="text"
                    icon="share-variant"
                    title="Share"
                    onPress={() => shareShopCode(item.name, item.id)}
                    style={{ flex: 1 }}
                />
                <CustomButton
                    mode="text"
                    icon="whatsapp"
                    title="Message"
                    onPress={() => openWhatsApp(item.whatsappNumber, item.name, item.id)}
                    style={{ flex: 1 }}
                />
              </View>
            </Surface>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No matching shops found.</Text>}
        />
      )}

      {/* Edit Dialog */}
      <Portal>
        <Dialog visible={isEditDialogOpen} onDismiss={() => setIsEditDialogOpen(false)} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>Refine Request</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScroll}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ paddingVertical: 10 }}>
                <TextInput
                    label="Owner Name"
                    value={editForm.ownerName}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, ownerName: text }))}
                    style={styles.dialogInput}
                    mode="outlined"
                />
                <TextInput
                    label="WhatsApp Number"
                    value={editForm.whatsappNumber}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, whatsappNumber: text }))}
                    style={styles.dialogInput}
                    mode="outlined"
                    keyboardType="phone-pad"
                />
                <TextInput
                    label="Shop Name"
                    value={editForm.shopName}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, shopName: text }))}
                    style={styles.dialogInput}
                    mode="outlined"
                />

                <Menu
                    visible={typeMenuVisible}
                    onDismiss={() => setTypeMenuVisible(false)}
                    anchor={
                        <TouchableRipple
                            onPress={() => setTypeMenuVisible(true)}
                            style={styles.menuAnchor}
                        >
                            <View style={styles.menuAnchorContent}>
                                <Text>Type: {editForm.shopType || 'Select'}</Text>
                                <MaterialCommunityIcons name="chevron-down" size={20} />
                            </View>
                        </TouchableRipple>
                    }
                >
                    {SHOP_TYPES.map(type => (
                        <Menu.Item
                            key={type}
                            onPress={() => {
                                setEditForm(prev => ({ ...prev, shopType: type }));
                                setTypeMenuVisible(false);
                            }}
                            title={type}
                        />
                    ))}
                </Menu>

                <TextInput
                    label="Location"
                    value={editForm.location}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, location: text }))}
                    style={styles.dialogInput}
                    mode="outlined"
                    multiline
                    numberOfLines={3}
                />
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <CustomButton mode="text" title="Cancel" onPress={() => setIsEditDialogOpen(false)} />
            <CustomButton
                title="Save Changes"
                onPress={saveEdit}
                loading={processing === editingRequest?.id}
                style={{ marginLeft: 8 }}
            />
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  headerSurface: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 24,
  },
  appbarTitle: {
    fontWeight: 'bold',
    color: 'white',
  },
  appbarSubtitle: {
    color: 'rgba(255,255,255,0.7)',
  },
  topActions: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  segmented: {
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  searchbar: {
    elevation: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    height: 48,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  cardRipple: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 8,
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  cardType: {
    color: '#666',
    marginTop: 2,
  },
  shopCode: {
    fontWeight: 'bold',
    opacity: 0.5,
  },
  statusChip: {
    height: 24,
    borderRadius: 8,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 10,
    color: '#333',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
  },
  actionBtn: {
    marginVertical: 0,
    marginLeft: 8,
  },
  sectionHeader: {
    paddingVertical: 12,
    marginTop: 8,
    fontWeight: 'bold',
    opacity: 0.6,
  },
  emptyText: {
    marginTop: 60,
    textAlign: 'center',
    opacity: 0.5,
  },
  dialog: {
    borderRadius: 24,
  },
  dialogTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  dialogScroll: {
    paddingHorizontal: 16,
  },
  dialogInput: {
    marginBottom: 16,
  },
  menuAnchor: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fff',
  },
  menuAnchorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
});

export default AdminDashboardScreen;
