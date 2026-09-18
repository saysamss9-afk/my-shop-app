import React, { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Pressable,
  ScrollView,
  Button,
  ButtonText,
  Input,
  InputField,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  CloseIcon,
  AddIcon,
  Spinner,
  Badge,
  BadgeText,
  Center,
} from '@gluestack-ui/themed';
import { ChevronLeft, MapPin, Building2, Copy, Check, Store, Edit2, Trash2 } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import { ShopRepository } from '../../repositories/ShopRepository';
import { useAuthContext } from '../../auth/AuthContext';
import { getAppShadow } from '../../utils/platformStyles';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type Props = StackScreenProps<RootStackParamList, 'BranchManagement'>;

const BranchManagementScreen: React.FC<Props> = ({ route, navigation }) => {
  const { shopId } = route.params;
  const { user, employeeData } = useAuthContext();
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const isOwner = employeeData?.role === 'OWNER';

  useEffect(() => {
    if (!loading && !isOwner) {
      navigation.goBack();
    }
  }, [isOwner, loading, navigation]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchLocation, setNewBranchLocation] = useState('');
  const [newBranchType, setNewBranchType] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const shopRepo = new ShopRepository();

  const fetchBranches = async () => {
    if (!user) return;
    try {
      const allShops = await shopRepo.getOwnerShops(user.uid);
      const currentShop = allShops.find(s => s.id === shopId);
      const effectiveParentId = currentShop?.parentShopId || currentShop?.parentshopid || shopId;

      const filtered = allShops.filter(s => {
          const pId = s.parentShopId || s.parentshopid;
          const isDirectBranch = pId === effectiveParentId;
          const parentShopContext = allShops.find(a => a.id === pId);
          const isNestedBranch = (parentShopContext?.parentShopId || parentShopContext?.parentshopid) === effectiveParentId;

          return (isDirectBranch || isNestedBranch) && s.id !== effectiveParentId;
      });
      setBranches(filtered);
    } catch (e) {
      console.error('Error fetching branches:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [user, shopId]);

  const handleCopyCode = (code: string) => {
    Clipboard.setString(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenEdit = (branch: any) => {
    setSelectedBranch(branch);
    setNewBranchName(branch.name);
    setNewBranchLocation(branch.location);
    setNewBranchType(branch.type || '');
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDeleteBranch = (branch: any) => {
    Alert.alert(
      'Delete Branch',
      `Are you sure you want to permanently delete "${branch.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const allShops = await shopRepo.getOwnerShops(user!.uid);
              const currentShop = allShops.find(s => s.id === shopId);
              const rootParentId = currentShop?.parentShopId || currentShop?.parentshopid || shopId;

              await shopRepo.deleteBranch(branch.id, branch.shopCode, rootParentId);
              fetchBranches();
              Alert.alert('Deleted', 'Branch has been removed successfully.');
            } catch (e: any) {
              console.error(e);
              Alert.alert('Error', e.message || 'Failed to delete branch.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleAddOrUpdateBranch = async () => {
    if (!newBranchName.trim() || !newBranchLocation.trim()) {
      Alert.alert('Required Fields', 'Please fill in the Branch Name and Location.');
      return;
    }
    setSubmitting(true);
    try {
      if (isEditMode && selectedBranch) {
        await shopRepo.updateBranch(selectedBranch.id, {
          name: newBranchName.trim(),
          location: newBranchLocation.trim(),
          type: newBranchType.trim(),
        });
        Alert.alert('Success', 'Branch updated successfully!');
      } else {
        const parentShop = await shopRepo.getShopDetails(shopId);
        await shopRepo.createBranch(shopId, {
          name: newBranchName.trim(),
          location: newBranchLocation.trim(),
          type: newBranchType.trim() || parentShop?.type || 'General',
          country: parentShop?.country || '',
          currency: parentShop?.currency || 'GH₵',
          region: parentShop?.region || '',
        });
        Alert.alert('Success', 'Branch created successfully!');
      }

      setNewBranchName('');
      setNewBranchLocation('');
      setNewBranchType('');
      setIsModalOpen(false);
      setIsEditMode(false);
      setSelectedBranch(null);
      fetchBranches();
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e.message || 'Action failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenWrapper withHeader>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <VStack space="xl" pb="$10" pt="$2">
          <HStack space="md" alignItems="center">
            <Pressable onPress={() => navigation.goBack()} p="$1" rounded="$full" bg="$backgroundLight50">
              <Icon as={ChevronLeft} size="lg" color="$text900" />
            </Pressable>
            <VStack>
              <Heading size="xl" color="$text900" fontWeight="$black">Branch Management</Heading>
              <Text size="xs" color="$text500">Overview of your synced business extensions</Text>
            </VStack>
          </HStack>

          <Box bg="$primary50" p="$4" rounded="$2xl" borderWidth={1} borderColor="$primary100">
            <Text size="sm" color="$primary800" fontWeight="$medium">
              As a Premium member, you can hook up to 4 sub-branches making 5 active locations total. Share branch codes with staff to let them register directly into their designated location.
            </Text>
          </Box>

          {loading ? (
            <Center py="$20">
              <Spinner size="large" color="$primary600" />
              <Text size="sm" color="$text400" mt="$2">Loading business profile hierarchy...</Text>
            </Center>
          ) : (
            <VStack space="md">
              {branches.length === 0 ? (
                <Center py="$16" bg="$backgroundLight50" rounded="$3xl" borderWidth={1} borderStyle="dashed" borderColor="$borderLight300" px="$6">
                  <Box bg="$backgroundLight100" p="$4" rounded="$full" mb="$3">
                    <Icon as={Store} size="xl" color="$text400" />
                  </Box>
                  <Heading size="md" color="$text700" textAlign="center" fontWeight="$bold">No branches active yet</Heading>
                  <Text size="xs" color="$text400" textAlign="center" mt="$1" mb="$5">
                    Expand your premium franchise footprint by introducing your first satellite store location today.
                  </Text>
                </Center>
              ) : (
                branches.map((branch) => (
                  <Box
                    key={branch.id}
                    bg="$white"
                    p="$4"
                    rounded="$2xl"
                    style={{ ...getAppShadow({ offsetY: 4, radius: 12, color: 'rgba(0,0,0,0.04)' }) }}
                  >
                    <HStack justifyContent="space-between" alignItems="flex-start">
                      <HStack space="md" flex={1}>
                        <Box bg="$primary100" p="$3" rounded="$xl" mt="$0.5">
                          <Icon as={Building2} color="$primary600" size="sm" />
                        </Box>
                        <VStack space="xs" flex={1}>
                          <HStack space="xs" alignItems="center" flexWrap="wrap">
                            <Text fontWeight="$bold" size="md" color="$text900">{branch.name}</Text>
                            <Badge action="muted" variant="solid" size="sm" bg="$backgroundLight100" rounded="$md">
                              <BadgeText size="2xs" color="$text600" fontWeight="$bold">
                                {(branch.type || 'General').toUpperCase()}
                              </BadgeText>
                            </Badge>
                          </HStack>

                          <HStack space="xs" alignItems="center">
                            <Icon as={MapPin} size="xs" color="$text400" />
                            <Text size="xs" color="$text500">{branch.location}</Text>
                          </HStack>

                          {branch.shopCode && (
                            <Pressable
                              onPress={() => handleCopyCode(branch.shopCode)}
                              bg="$backgroundLight50"
                              px="$2.5"
                              py="$1.5"
                              rounded="$lg"
                              mt="$2"
                              alignSelf="flex-start"
                              borderWidth={1}
                              borderColor="$borderLight200"
                            >
                              <HStack space="xs" alignItems="center">
                                <Text size="2xs" color="$text700" fontWeight="$bold">Staff Code: </Text>
                                <Text size="2xs" color="$primary700" fontWeight="$black">{branch.shopCode}</Text>
                                <Icon
                                  as={copiedCode === branch.shopCode ? Check : Copy}
                                  size="xs"
                                  color={copiedCode === branch.shopCode ? "$success600" : "$text400"}
                                  ml="$1"
                                />
                              </HStack>
                            </Pressable>
                          )}
                        </VStack>
                      </HStack>

                      <HStack space="sm">
                        <Pressable onPress={() => handleOpenEdit(branch)} p="$2" rounded="$lg" bg="$backgroundLight50">
                          <Icon as={Edit2} size="xs" color="$primary600" />
                        </Pressable>
                        <Pressable onPress={() => handleDeleteBranch(branch)} p="$2" rounded="$lg" bg="$red50">
                          <Icon as={Trash2} size="xs" color="$red600" />
                        </Pressable>
                      </HStack>
                    </HStack>
                  </Box>
                ))
              )}

              {branches.length < 4 ? (
                <Pressable
                  onPress={() => setIsModalOpen(true)}
                  bg="$primary600"
                  p="$4"
                  rounded="$2xl"
                  mt="$3"
                  style={{ ...getAppShadow({ offsetY: 6, radius: 14, color: 'rgba(110,59,230,0.15)' }) }}
                >
                  <HStack space="xs" justifyContent="center" alignItems="center">
                    <Icon as={AddIcon} color="white" size="xs" />
                    <Text color="white" fontWeight="$black" size="md">Add Store Location</Text>
                  </HStack>
                </Pressable>
              ) : (
                <Box bg="$amber50" p="$4" rounded="$xl" borderWidth={1} borderColor="$amber200" mt="$2">
                  <Text size="xs" color="$amber700" textAlign="center" fontWeight="$medium">
                    You have introduced the maximum limit of 4 branches allowed under your Premium membership profile tier.
                  </Text>
                </Box>
              )}
            </VStack>
          )}
        </VStack>
      </ScrollView>

      <Modal isOpen={isModalOpen} onClose={() => { if (!submitting) { setIsModalOpen(false); setIsEditMode(false); setSelectedBranch(null); } }}>
        <ModalBackdrop />
        <ModalContent borderRadius={24}>
          <ModalHeader pt="$5" px="$5">
            <Heading size="lg" fontWeight="$black" color="$text900">{isEditMode ? 'Edit Branch' : 'Add New Branch'}</Heading>
            <ModalCloseButton isDisabled={submitting}>
              <Icon as={CloseIcon} />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody px="$5" pb="$4">
            <VStack space="lg" mt="$2">
              <FormControl isRequired isDisabled={submitting}>
                <FormControlLabel mb="$1">
                  <FormControlLabelText size="sm" fontWeight="$bold">Branch Location Name</FormControlLabelText>
                </FormControlLabel>
                <Input variant="outline" size="md" borderRadius={12}>
                  <InputField
                    placeholder="e.g. Osu Branch"
                    value={newBranchName}
                    onChangeText={setNewBranchName}
                  />
                </Input>
              </FormControl>

              <FormControl isRequired isDisabled={submitting}>
                <FormControlLabel mb="$1">
                  <FormControlLabelText size="sm" fontWeight="$bold">City / Physical Location</FormControlLabelText>
                </FormControlLabel>
                <Input variant="outline" size="md" borderRadius={12}>
                  <InputField
                    placeholder="e.g. Cantonments, Accra"
                    value={newBranchLocation}
                    onChangeText={setNewBranchLocation}
                  />
                </Input>
              </FormControl>

              <FormControl isDisabled={submitting}>
                <FormControlLabel mb="$1">
                  <FormControlLabelText size="sm" fontWeight="$bold">Branch Specialization / Service Type</FormControlLabelText>
                </FormControlLabel>
                <Input variant="outline" size="md" borderRadius={12}>
                  <InputField
                    placeholder="e.g. Pharmacy, Wholesale (Optional)"
                    value={newBranchType}
                    onChangeText={setNewBranchType}
                  />
                </Input>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter px="$5" pb="$5">
            <Button variant="outline" action="secondary" onPress={() => { setIsModalOpen(false); setIsEditMode(false); setSelectedBranch(null); }} mr="$3" borderRadius={16} isDisabled={submitting}>
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button onPress={handleAddOrUpdateBranch} disabled={submitting} bg="$primary600" borderRadius={16} style={{ minWidth: 120 }}>
              {submitting ? <Spinner color="white" size="small" /> : <ButtonText fontWeight="$bold">{isEditMode ? 'Save Changes' : 'Create Store'}</ButtonText>}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </ScreenWrapper>
  );
};

export default BranchManagementScreen;
