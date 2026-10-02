import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import type { Shop } from '../db/types';
import { getDBConnection } from '../db/database';

export interface ShopRequest {
  userId?: string;
  userEmail?: string;
  shopName: string;
  shopType: string;
  shopCategory: string; // This corresponds to the plan (STARTER, BUSINESS, PREMIUM)
  registrationFee: number;
  location: string;
  ownerName: string;
  whatsappNumber: string;
  country: string;
  currency: string;
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED';
  createdAt: any;
}

export class ShopRepository {
  async submitShopRequest(request: Omit<ShopRequest, 'status' | 'createdAt'>) {
    return await firestore().collection('shop_requests').add({
      ...request,
      status: 'PENDING',
      notified: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  }

  async getMyRequests(userId: string) {
    const snapshot = await firestore()
      .collection('shop_requests')
      .where('userId', '==', userId)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getShopDetails(shopId: string): Promise<Shop | null> {
    const doc = await firestore().collection('registered_shops').doc(shopId).get();
    if (!doc.exists) return null;
    const data = { id: doc.id, ...doc.data() } as any;
    if (!data.planExpiresAt) {
      let baseDate = new Date();
      if (data.createdAt?.toDate) baseDate = data.createdAt.toDate();
      else if (data.createdAt?.seconds) baseDate = new Date(data.createdAt.seconds * 1000);
      else if (data.createdAt) baseDate = new Date(data.createdAt);
      const trialExpiry = new Date(baseDate);
      trialExpiry.setMonth(trialExpiry.getMonth() + 1);
      const now = new Date();
      if (trialExpiry < now) {
        trialExpiry.setTime(now.getTime());
        trialExpiry.setMonth(trialExpiry.getMonth() + 1);
      }
      data.planExpiresAt = trialExpiry.toISOString().split('T')[0];
      doc.ref.update({ planExpiresAt: data.planExpiresAt }).catch(() => {});
    }
    return data as Shop;
  }

  async getOwnerShops(ownerId: string): Promise<Shop[]> {
    // Standard query for shops where the user is direct owner
    const directShopsSnapshot = await firestore()
      .collection('registered_shops')
      .where('ownerId', '==', ownerId)
      .get();

    return directShopsSnapshot.docs.map(doc => {
      const data = { id: doc.id, ...doc.data() } as any;
      if (!data.planExpiresAt) {
        let baseDate = new Date();
        if (data.createdAt?.toDate) baseDate = data.createdAt.toDate();
        else if (data.createdAt?.seconds) baseDate = new Date(data.createdAt.seconds * 1000);
        else if (data.createdAt) baseDate = new Date(data.createdAt);
        const trialExpiry = new Date(baseDate);
        trialExpiry.setMonth(trialExpiry.getMonth() + 1);
        const now = new Date();
        if (trialExpiry < now) {
          trialExpiry.setTime(now.getTime());
          trialExpiry.setMonth(trialExpiry.getMonth() + 1);
        }
        data.planExpiresAt = trialExpiry.toISOString().split('T')[0];
        doc.ref.update({ planExpiresAt: data.planExpiresAt }).catch(() => {});
      }
      return data as Shop;
    });
  }

  async updateShopIdentity(shopId: string, details: Partial<Shop>) {
    const safeShopId = (shopId || '').toString().trim();
    if (!safeShopId) return;

    // 1. Update Firestore registered_shops document if online
    try {
      await firestore().collection('registered_shops').doc(safeShopId).update({
        name: details.name,
        companyName: details.companyName,
        address: details.address || details.location,
        location: details.location || details.address,
        phone: details.phone,
        email: details.email,
        workingHours: details.workingHours,
        currency: details.currency,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.warn('Firestore shop identity update warning:', e);
    }

    // 2. Update local SQLite database
    try {
      const db = await getDBConnection();
      const query = `
        UPDATE Shop
        SET name = ?, companyName = ?, address = ?, location = ?, phone = ?, email = ?, workingHours = ?, currency = ?
        WHERE TRIM(id) = TRIM(?) OR id = ?
      `;
      const params = [
        details.name || '',
        details.companyName || '',
        details.address || details.location || '',
        details.location || details.address || '',
        details.phone || '',
        details.email || '',
        details.workingHours || '',
        details.currency || '$',
        safeShopId,
        safeShopId,
      ];
      await db.executeSql(query, params);
    } catch (e) {
      console.error('Local SQLite shop identity update error:', e);
    }
  }

  async createBranch(shopId: string, branchData: any) {
    const shopRef = firestore().collection('registered_shops').doc(shopId);
    const shopDoc = await shopRef.get();
    if (!shopDoc.exists) throw new Error('Shop not found');

    const shopData = shopDoc.data();
    // Resolve the root parent ID to ensure all branches are siblings under the same HQ
    const rootParentId = shopData?.parentShopId || shopData?.parentshopid || shopId;
    const rootRef = firestore().collection('registered_shops').doc(rootParentId);

    const rootDoc = await rootRef.get();
    const rootData = rootDoc?.data();

    if (rootData?.plan !== 'PREMIUM') throw new Error('Only Premium shops can have branches');

    const currentBranches = rootData?.branchCount || 0;
    if (currentBranches >= 4) throw new Error('Maximum limit of 4 branches reached');

    const currentUserId = auth().currentUser?.uid || '';
    const ownerId = rootData?.ownerId || currentUserId;

    if (!ownerId) throw new Error('Owner identifier could not be determined');

    const prefix = ((branchData.name || 'BRN').replace(/[^a-zA-Z]/g, '').substring(0, 3) || 'SHP').toUpperCase();
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const shopCode = `${prefix}-${suffix}`;

    const batch = firestore().batch();
    const newShopRef = firestore().collection('registered_shops').doc();

    batch.set(newShopRef, {
      ...branchData,
      parentShopId: rootParentId,
      ownerId,
      plan: 'PREMIUM',
      planExpiresAt: rootData?.planExpiresAt || null,
      staffCount: 0,
      shopCode,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    const codeRef = firestore().collection('shop_codes').doc(shopCode);
    batch.set(codeRef, {
      shopId: newShopRef.id,
      shopType: 'BRANCH',
      parentShopId: rootParentId
    });

    batch.update(rootRef, {
      branchCount: currentBranches + 1
    });

    await batch.commit();
    return newShopRef;
  }

  async updateBranch(branchId: string, updateData: any) {
    return await firestore().collection('registered_shops').doc(branchId).update({
      ...updateData,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  }

  async deleteBranch(branchId: string, shopCode: string, rootParentId: string) {
    const batch = firestore().batch();
    const branchRef = firestore().collection('registered_shops').doc(branchId);
    const rootRef = firestore().collection('registered_shops').doc(rootParentId);
    const codeRef = firestore().collection('shop_codes').doc(shopCode);

    batch.delete(branchRef);
    batch.delete(codeRef);

    const rootDoc = await rootRef.get();
    const currentCount = rootDoc.data()?.branchCount || 1;
    batch.update(rootRef, {
      branchCount: Math.max(0, currentCount - 1)
    });

    await batch.commit();
  }
}
