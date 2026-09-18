import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export class AuthRepository {
  async login(email: string, pass: string) {
    return await auth().signInWithEmailAndPassword(email, pass);
  }

  async signUp(email: string, pass: string) {
    return await auth().createUserWithEmailAndPassword(email, pass);
  }

  async linkUserToShop(uid: string, email: string, shopId: string, role: string, name: string, phoneNumber: string, country?: string) {
    const batch = firestore().batch();

    const employeeRef = firestore().collection('employees').doc(uid);
    batch.set(employeeRef, {
      uid,
      email,
      shopId,
      role,
      name,
      phoneNumber,
      country: country || null,
      joinedAt: firestore.FieldValue.serverTimestamp(),
    });

    const shopRef = firestore().collection('registered_shops').doc(shopId);
    const shopDoc = await shopRef.get();
    const shopData = shopDoc.data();

    const updateData: any = {
      staffCount: firestore.FieldValue.increment(1)
    };

    // If joining as OWNER and shop has no owner yet, claim it
    if (role === 'OWNER' && (!shopData?.ownerId || shopData?.ownerId === '')) {
      updateData.ownerId = uid;
    }

    batch.update(shopRef, updateData);

    await batch.commit();
  }

  async getUserEmployeeData(uid: string) {
    const doc = await firestore().collection('employees').doc(uid).get();
    return doc.data();
  }

  async logout() {
    await auth().signOut();
  }

  getCurrentUser() {
    return auth().currentUser;
  }
}
