import firebase from '../firebase-config';

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
    return await firebase.firestore().collection('shop_requests').add({
      ...request,
      status: 'PENDING',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  }

  async getMyRequests(userId: string) {
    const snapshot = await firebase.firestore()
      .collection('shop_requests')
      .where('userId', '==', userId)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}
