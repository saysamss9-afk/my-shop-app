import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FlatList, SectionList, ScrollView, Linking, Clipboard, StatusBar } from 'react-native';
import { displayAlert } from '../../utils/alert';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Center,
  Input,
  InputField,
  InputSlot,
  InputIcon,
  SearchIcon,
  Pressable,
} from '@gluestack-ui/themed';
import firebase from '../../firebase-config';
import type { User } from 'firebase/auth';
import ModernLoader from '../../components/common/ModernLoader';
import { getAppShadow } from '../../utils/platformStyles';

// Sub-components
import AdminHeader from './components/AdminHeader';
import ShopRequestItem from './components/ShopRequestItem';
import RegisteredShopItem from './components/RegisteredShopItem';
import UpgradeRequestItem from './components/UpgradeRequestItem';
import EditRequestModal from './components/EditRequestModal';
import ManageShopPlanModal from './components/ManageShopPlanModal';

const AdminDashboardScreen = ({ navigation }: any) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [upgrades, setUpgrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('requests');
  const [shopPlanFilter, setShopPlanFilter] = useState<'ALL' | 'PREMIUM' | 'BUSINESS' | 'STARTER' | 'BRANCHES'>('ALL');
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
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedShopForPlan, setSelectedShopForPlan] = useState<any | null>(null);
  const [planForm, setPlanForm] = useState({
    plan: 'STARTER',
    planExpiresAt: '',
    paymentMethod: 'MANUAL',
    notes: ''
  });

  const handleOpenPlanModal = (shop: any) => {
    setSelectedShopForPlan(shop);
    const defaultExpiry = shop.planExpiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setPlanForm({
      plan: shop.plan || 'STARTER',
      planExpiresAt: defaultExpiry,
      paymentMethod: 'MANUAL',
      notes: shop.renewalNotes || ''
    });
    setIsPlanModalOpen(true);
  };

  const updateShopAndBranches = async (shopId: string, updateData: any) => {
    const db = firebase.firestore();

    // 1. Update main shop
    await db.collection('registered_shops').doc(shopId).update(updateData);

    // 2. Query and update all child branches
    const branchesQuery1 = await db.collection('registered_shops').where('parentShopId', '==', shopId).get();
    const branchesQuery2 = await db.collection('registered_shops').where('parentshopid', '==', shopId).get();

    const batch = db.batch();
    const branchIds = new Set();

    branchesQuery1.docs.forEach((doc: any) => {
      branchIds.add(doc.id);
      batch.update(doc.ref, updateData);
    });
    branchesQuery2.docs.forEach((doc: any) => {
      if (!branchIds.has(doc.id)) {
        branchIds.add(doc.id);
        batch.update(doc.ref, updateData);
      }
    });

    if (branchIds.size > 0) {
      await batch.commit();
    }
  };

  const handleSaveShopPlan = async () => {
    if (!selectedShopForPlan) return;
    setProcessing(selectedShopForPlan.id);
    try {
      const updateData = {
        plan: planForm.plan,
        planExpiresAt: planForm.planExpiresAt,
        manualPayment: true,
        lastManualPaymentAt: firebase.firestore.FieldValue.serverTimestamp(),
        paymentMethod: planForm.paymentMethod,
        renewalNotes: planForm.notes
      };
      await updateShopAndBranches(selectedShopForPlan.id, updateData);
      setIsPlanModalOpen(false);
      setSelectedShopForPlan(null);
      displayAlert("Success", "Shop plan and expiry date updated for main shop and all its branches!");
    } catch (e: any) {
      displayAlert("Error", "Failed to update plan expiry: " + e.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteRequest = (id: string) => {
    const deleteFn = async () => {
      setProcessing(id);
      try {
        await firebase.firestore().collection('shop_requests').doc(id).delete();
        displayAlert("Success", "Request deleted successfully");
      } catch (e: any) {
        displayAlert("Error", e.message);
      } finally {
        setProcessing(null);
      }
    };

    displayAlert("Delete Request", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteFn }
    ]);
  };

  const handleDeleteShop = (id: string) => {
    const deleteFn = async () => {
      setProcessing(id);
      try {
        await firebase.firestore().collection('registered_shops').doc(id).delete();
        displayAlert("Success", "Shop record deleted");
      } catch (e: any) {
        displayAlert("Error", e.message);
      } finally {
        setProcessing(null);
      }
    };

    displayAlert("Delete Shop", "This cannot be undone. Proceed?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteFn }
    ]);
  };

  useEffect(() => {
    let unsubReq: any;
    let unsubShops: any;
    let unsubUpgrades: any;
    let unsubNotify: any;

    const unsubscribeAuth = firebase.auth().onAuthStateChanged((user: User | null) => {
      if (unsubReq) unsubReq();
      if (unsubShops) unsubShops();
      if (unsubUpgrades) unsubUpgrades();
      if (unsubNotify) unsubNotify();

      if (!user || user.uid !== "l2JP5nnzVSP6gd8aSDEqI60Tbfl2") {
        navigation.replace('Landing');
        return;
      }

      unsubReq = firebase.firestore().collection('shop_requests')
        .where('status', 'in', ['PENDING', 'REVIEWING'])
        .onSnapshot((snapshot: any) => {
          const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as any));
          data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setRequests(data);
          setLoading(false);
        }, (error: any) => {
          console.error("AdminDashboard: Error fetching shop_requests:", error);
          setLoading(false);
        });

      unsubShops = firebase.firestore().collection('registered_shops')
        .onSnapshot((snapshot: any) => {
          const data = snapshot.docs.map((doc: any) => {
            const shopData = { id: doc.id, ...doc.data() } as any;
            if (!shopData.planExpiresAt) {
              let baseDate = new Date();
              if (shopData.createdAt?.seconds) {
                baseDate = new Date(shopData.createdAt.seconds * 1000);
              } else if (shopData.createdAt?.toDate) {
                baseDate = shopData.createdAt.toDate();
              } else if (shopData.createdAt && typeof shopData.createdAt === 'string') {
                baseDate = new Date(shopData.createdAt);
              }
              const trialExpiry = new Date(baseDate);
              trialExpiry.setMonth(trialExpiry.getMonth() + 1);

              const now = new Date();
              if (trialExpiry < now) {
                trialExpiry.setTime(now.getTime());
                trialExpiry.setMonth(trialExpiry.getMonth() + 1);
              }
              const computedExpiry = trialExpiry.toISOString().split('T')[0];
              shopData.planExpiresAt = computedExpiry;

              doc.ref.update({ planExpiresAt: computedExpiry }).catch((err: any) => {
                console.warn("AdminDashboard: Error backfilling planExpiresAt:", err);
              });
            }
            return shopData;
          });
          setShops(data);
        }, (error: any) => {
          console.error("AdminDashboard: Error fetching registered_shops:", error);
        });

      unsubUpgrades = firebase.firestore().collection('plan_upgrade_requests')
        .where('status', '==', 'PENDING')
        .onSnapshot((snapshot: any) => {
          const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
          setUpgrades(data);
        }, (error: any) => {
          console.error("AdminDashboard: Error fetching upgrade requests:", error);
        });

      unsubNotify = firebase.firestore().collection('shop_requests')
        .where('status', '==', 'PENDING')
        .where('notified', '==', false)
        .onSnapshot((snapshot: any) => {
           if (!snapshot.empty) {
              snapshot.docs.forEach((doc: any) => {
                const req = doc.data();
                displayAlert(
                  "New Shop Request",
                  `A new request for "${req.shopName}" has been submitted by ${req.ownerName}.`,
                  [{ text: "View", onPress: () => setViewMode('requests') }]
                );
                doc.ref.update({ notified: true });
              });
           }
        });
    });

    return () => {
      unsubscribeAuth();
      if (unsubReq) unsubReq();
      if (unsubShops) unsubShops();
      if (unsubUpgrades) unsubUpgrades();
      if (unsubNotify) unsubNotify();
    };
  }, [navigation]);

  const handleApprove = async (request: any) => {
    setProcessing(request.id);
    try {
      const year = new Date().getFullYear();
      const random = Math.floor(1000 + Math.random() * 9000);
      const shopId = `MS-${year}-${random}`;

      const plan = (request.shopCategory || 'STARTER').toUpperCase();
      const trialDate = new Date();
      trialDate.setMonth(trialDate.getMonth() + 1);
      const planExpiresAt = trialDate.toISOString().split('T')[0];

      await firebase.firestore().collection('registered_shops').doc(shopId).set({
        id: shopId,
        shopCode: shopId,
        ownerId: request.userId,
        name: request.shopName,
        type: request.shopType,
        location: request.location,
        ownerName: request.ownerName,
        whatsappNumber: request.whatsappNumber,
        country: request.country || 'Ghana',
        currency: request.currency || 'GH₵',
        plan: plan,
        planExpiresAt: planExpiresAt,
        staffCount: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await firebase.firestore().collection('shop_requests').doc(request.id).update({
        status: 'APPROVED',
        shopId: shopId,
        approvedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      displayAlert(
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
      displayAlert('Approval failed', e.message);
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
      displayAlert("Success", "Request updated successfully");
    } catch (e: any) {
      displayAlert("Error", "Failed to update request: " + e.message);
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
      displayAlert("Error", "WhatsApp is not installed on this device");
    });
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    displayAlert("Copied", "Shop code copied to clipboard");
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
    if ((shopPlanFilter === 'ALL' || shopPlanFilter === 'PREMIUM') && premium.length > 0) sections.push({ title: 'Premium Plan', data: premium });
    if ((shopPlanFilter === 'ALL' || shopPlanFilter === 'BUSINESS') && business.length > 0) sections.push({ title: 'Business Plan', data: business });
    if ((shopPlanFilter === 'ALL' || shopPlanFilter === 'STARTER') && starters.length > 0) sections.push({ title: 'Starter Plan', data: starters });
    if ((shopPlanFilter === 'ALL' || shopPlanFilter === 'BRANCHES') && branches.length > 0) sections.push({ title: 'Branch Locations', data: branches });

    return sections;
  }, [filteredShops, shopPlanFilter]);

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
        onManagePlan={handleOpenPlanModal}
    />
  ), []);

  const renderUpgradeItem = useCallback(({ item }: any) => (
    <UpgradeRequestItem
      item={item}
      processing={processing}
      onApprove={async (req) => {
        setProcessing(req.id);
        try {
          const trialDate = new Date();
          trialDate.setMonth(trialDate.getMonth() + 1);
          const planExpiresAt = trialDate.toISOString().split('T')[0];
          const updateData = { plan: req.requestedPlan, planExpiresAt };
          await updateShopAndBranches(req.shopId, updateData);
          await firebase.firestore().collection('plan_upgrade_requests').doc(req.id).update({ status: 'APPROVED' });
          displayAlert("Success", "Plan upgraded successfully for main shop and all branches!");
        } catch (e: any) {
          displayAlert("Error", e.message);
        } finally {
          setProcessing(null);
        }
      }}
      onReject={async (req) => {
        setProcessing(req.id);
        try {
          await firebase.firestore().collection('plan_upgrade_requests').doc(req.id).update({ status: 'REJECTED' });
          displayAlert("Success", "Plan upgrade request rejected.");
        } catch (e: any) {
          displayAlert("Error", e.message);
        } finally {
          setProcessing(null);
        }
      }}
    />
  ), [processing]);

  const renderHeader = () => (
    <VStack bg="#F2EFE9" pb="$2">
      <AdminHeader
        viewMode={viewMode}
        onBack={() => navigation.replace('Login')}
        onSignOut={() => firebase.auth().signOut()}
      />
      {/* Summary Stats Cards */}
      <HStack px="$5" pt="$4" space="md">
        <Box flex={1} bg="$white" p="$3.5" rounded="$2xl" borderWidth={1} borderColor="$borderLight" style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.03)' }) }}>
          <Text size="2xs" color="$text500" fontWeight="$bold">PENDING</Text>
          <Heading size="md" color="$primary800" fontWeight="$black" mt="$1">{requests.length}</Heading>
        </Box>
        <Box flex={1} bg="$white" p="$3.5" rounded="$2xl" borderWidth={1} borderColor="$borderLight" style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.03)' }) }}>
          <Text size="2xs" color="$text500" fontWeight="$bold">SHOPS</Text>
          <Heading size="md" color="$success700" fontWeight="$black" mt="$1">{shops.length}</Heading>
        </Box>
        <Box flex={1} bg="$white" p="$3.5" rounded="$2xl" borderWidth={1} borderColor="$borderLight" style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.03)' }) }}>
          <Text size="2xs" color="$text500" fontWeight="$bold">UPGRADES</Text>
          <Heading size="md" color="$amber600" fontWeight="$black" mt="$1">{upgrades.length}</Heading>
        </Box>
      </HStack>

      <VStack
        space="md"
        p="$5"
        bg="$white"
        mx="$5"
        mt="$4"
        rounded="$3xl"
        borderWidth={1}
        borderColor="$borderLight"
        style={{ ...getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(0,0,0,0.03)', opacity: 0.03 }) }}
      >
        <HStack space="md" bg="$backgroundLight50" p="$1.5" rounded="$2xl">
          <Pressable
            flex={1}
            onPress={() => setViewMode('requests')}
            bg={viewMode === 'requests' ? '$white' : 'transparent'}
            py="$2.5"
            rounded="$xl"
            style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(110,59,230,0.06)' }) }}
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
            py="$2.5"
            rounded="$xl"
            style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(110,59,230,0.06)' }) }}
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
            py="$2.5"
            rounded="$xl"
            style={{ ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(110,59,230,0.06)' }) }}
          >
            <Center>
              <Text size="sm" fontWeight="$bold" color={viewMode === 'upgrades' ? '$primary800' : '$text500'}>
                Upgrades ({upgrades.length})
              </Text>
            </Center>
          </Pressable>
        </HStack>

        <Input variant="outline" size="md" borderRadius={14} borderWidth={1} borderColor="$borderLight">
          <InputSlot pl="$3">
            <InputIcon as={SearchIcon} color="$primary800" />
          </InputSlot>
          <InputField
            placeholder="Search database..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </Input>

        {viewMode === 'shops' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 2 }}>
            <HStack space="xs">
              {[
                { id: 'ALL', label: 'All Shops' },
                { id: 'PREMIUM', label: 'Premium' },
                { id: 'BUSINESS', label: 'Business' },
                { id: 'STARTER', label: 'Starter' },
                { id: 'BRANCHES', label: 'Branches' },
              ].map(f => (
                <Pressable
                  key={f.id}
                  onPress={() => setShopPlanFilter(f.id as any)}
                  bg={shopPlanFilter === f.id ? '$primary800' : '$backgroundLight100'}
                  px="$3.5"
                  py="$1.5"
                  rounded="$full"
                >
                  <Text size="xs" color={shopPlanFilter === f.id ? '$white' : '$text700'} fontWeight="$bold">
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </HStack>
          </ScrollView>
        )}
      </VStack>
    </VStack>
  );

  return (
    <Box flex={1} bg="#F2EFE9">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {loading ? (
        <ModernLoader label="Loading Dashboard..." subLabel="Fetching system data" icon="store" />
      ) : viewMode === 'shops' ? (
        <SectionList
          sections={shopSections}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={renderActiveShopItem}
          renderSectionHeader={({ section: { title } }) => (
            <Box bg="#F2EFE9" px="$5" py="$3" mb="$2" mt="$3">
              <Heading size="xs" color="$primary800" textTransform="uppercase" fontWeight="$bold" letterSpacing={1}>{title}</Heading>
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
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: 100 }}
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

      <ManageShopPlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        shop={selectedShopForPlan}
        planForm={planForm}
        setPlanForm={setPlanForm}
        onSave={handleSaveShopPlan}
        processing={processing === selectedShopForPlan?.id}
      />
    </Box>
  );
};

export default AdminDashboardScreen;
