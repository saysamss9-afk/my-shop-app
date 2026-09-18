import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

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

  async getShopDetails(shopId: string) {
    const doc = await firestore().collection('registered_shops').doc(shopId).get();
    return doc.exists ? doc.data() : null;
  }

  async getOwnerShops(ownerId: string) {
    // Standard query for shops where the user is direct owner
    const directShopsSnapshot = await firestore()
      .collection('registered_shops')
      .where('ownerId', '==', ownerId)
      .get();

    // We also need to fetch any shop where the ownerId might be missing in metadata
    // but the user is effectively the owner (e.g. from shop_requests or just direct ownerId)
    // The current query covers most cases, but we ensure branches are also caught.
    // Since branches inherit the ownerId, the current where query is actually sufficient.

    return directShopsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
