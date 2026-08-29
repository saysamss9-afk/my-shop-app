import firestore from '@react-native-firebase/firestore';

export interface ShopRequest {
  shopName: string;
  shopType: string;
  location: string;
  ownerName: string;
  whatsappNumber: string;
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
}
