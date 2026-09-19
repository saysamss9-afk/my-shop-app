import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { displayAlert } from '../../../utils/alert';
import {
  Box,
  HStack,
  Text,
  Icon,
  Pressable,
  Menu,
  MenuItem,
  MenuItemLabel,
  GlobeIcon,
  ChevronDownIcon,
  Center,
} from '@gluestack-ui/themed';
import { ShopRepository } from '../../../repositories/ShopRepository';
import { useAuthContext } from '../../../auth/AuthContext';
import { getDBConnection } from '../../../db/database';

interface Props {
  currentShopId: string;
  onSwitch: (shopId: string, shopName: string) => void;
}

const BranchSwitcher: React.FC<Props> = ({ currentShopId, onSwitch }) => {
  const { user } = useAuthContext();
  const [shops, setShops] = useState<any[]>([]);
  const shopRepo = new ShopRepository();

  useEffect(() => {
    if (user) {
      shopRepo.getOwnerShops(user.uid)
        .then(async (fetchedShops) => {
          // If we are currently viewing a shop branch, let's verify if its parentShopId
          // exists in fetchedShops to avoid missing the main branch reference.
          let finalShops = [...fetchedShops];

          // Check if any fetched shop has a matching parentShopId relation
          // or if any branch is missing from the direct query due to ownership indexing delay
          const currentViewShop = fetchedShops.find(s => s.id === currentShopId);
          if (currentViewShop && currentViewShop.parentShopId) {
            const hasParentInList = fetchedShops.some(s => s.id === currentViewShop.parentShopId);
            if (!hasParentInList) {
              const parentDetails = await shopRepo.getShopDetails(currentViewShop.parentShopId);
              if (parentDetails) {
                finalShops.unshift({ ...parentDetails, id: currentViewShop.parentShopId });
              }
            }
          } else {
            // Alternatively, if we are at the main company, let's look for sibling branches
            // that specify this main company as their parentShopId.
            // We safely swallow columns checks if the local SQLite/AlaSQL tables haven't updated yet.
            try {
              const db = await getDBConnection();
              const localShopRes = await db.executeSql('SELECT * FROM Shop WHERE id = ?', [currentShopId]);
              const row = localShopRes[0]?.rows?.item(0);
              const parentIdFromLocal = row?.parentShopId || row?.parentshopid;
              if (parentIdFromLocal) {
                const hasParentInList = fetchedShops.some(s => s.id === parentIdFromLocal);
                if (!hasParentInList) {
                  const parentDetails = await shopRepo.getShopDetails(parentIdFromLocal);
                  if (parentDetails) {
                    finalShops.unshift({ ...parentDetails, id: parentIdFromLocal });
                  }
                }
              }
            } catch (sqle) {
              console.log('Switcher: Local parent check bypassed', sqle);
            }
          }

          setShops(finalShops);
        })
        .catch(err => console.error("BranchSwitcher: Error fetching shops", err));
    }
  }, [user, currentShopId]);

  const handleSwitchBranch = async (targetShopId: string, targetShopName: string) => {
    if (targetShopId === currentShopId) return;

    try {
      const db = await getDBConnection();
      const tables = [
        'Category', 'Product', 'Supplier', 'SupplierPayment',
        'Customer', 'Sale', 'DebtPayment', 'InventoryAdjustment',
        'PurchaseOrder', 'PurchaseReturn', 'AuditLog', 'Expense'
      ];

      let totalUnsynced = 0;
      for (const table of tables) {
        try {
          const res = await db.executeSql(`SELECT COUNT(*) as cnt FROM ${table} WHERE shopId = ? AND syncStatus = 0`, [currentShopId]);
          if (res && res[0]?.rows?.length > 0) {
            // Support both direct item extraction and standard key names across React Native SQLite and Web AlaSQL
            const item = typeof res[0].rows.item === 'function' ? res[0].rows.item(0) : ((res[0].rows as any)[0] || res[0].rows.item(0));
            const count = item?.cnt || item?.CNT || 0;
            totalUnsynced += count;
          }
        } catch (e) {
          // If specific transactional sub-table is not initialized offline yet, gracefully skip it
        }
      }

      if (totalUnsynced > 0) {
        displayAlert(
          'Unsynced Data Warning',
          `You have ${totalUnsynced} unsynced item(s) on your current branch. We highly recommend syncing before switching branches to avoid any data loss.`,
          [
            { text: 'Cancel & Sync First', style: 'cancel' },
            { text: 'Switch Anyway', style: 'destructive', onPress: () => onSwitch(targetShopId, targetShopName) }
          ]
        );
      } else {
        onSwitch(targetShopId, targetShopName);
      }
    } catch (error) {
      console.error('Error verifying sync status before branch switch:', error);
      onSwitch(targetShopId, targetShopName);
    }
  };

  if (shops.length <= 1) {
    // If Firestore hasn't fully loaded the branches yet, or if it's a branch itself,
    // let's ensure the list contains at least the current main shop to keep the switcher visible
    if (shops.length === 0) return null;
  }

  return (
    <Menu
      trigger={(triggerProps) => {
        return (
          <Pressable
            {...triggerProps}
            bg="$white"
            px="$3"
            py="$1.5"
            rounded="$full"
            borderWidth={1}
            borderColor="$borderLight200"
          >
            <HStack space="xs" alignItems="center">
              <Icon as={GlobeIcon} size="xs" color="$primary600" />
              <Text size="xs" fontWeight="$bold" color="$text700">Switch Branch</Text>
              <Icon as={ChevronDownIcon} size="xs" color="$text400" />
            </HStack>
          </Pressable>
        );
      }}
    >
      {shops.map((shop) => (
        <MenuItem
          key={shop.id}
          textValue={shop.name}
          onPress={() => handleSwitchBranch(shop.id, shop.name)}
          bg={shop.id === currentShopId ? '$primary50' : 'transparent'}
        >
          <HStack space="sm" alignItems="center">
            <Center w={24} h={24} bg="$primary100" rounded="$md">
                <Text size="2xs" fontWeight="$bold" color="$primary700">{shop.name[0]}</Text>
            </Center>
            <MenuItemLabel size="sm" color={shop.id === currentShopId ? '$primary700' : '$text700'}>
              {shop.name} {shop.id === currentShopId && '(Current)'}
            </MenuItemLabel>
          </HStack>
        </MenuItem>
      ))}
    </Menu>
  );
};

export default BranchSwitcher;
