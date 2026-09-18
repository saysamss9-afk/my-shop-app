import firebase from '../firebase-config';

export class AuthRepository {
  async login(email: string, pass: string) {
    const result = await firebase.auth().signInWithEmailAndPassword(email, pass);
    return { user: result.user };
  }

  async signUp(email: string, pass: string) {
    const result = await firebase.auth().createUserWithEmailAndPassword(email, pass);
    return { user: result.user };
  }

  async linkUserToShop(uid: string, email: string, shopId: string, role: string, name: string, phoneNumber: string, country?: string) {
    const batch = firebase.firestore().batch();

    const employeeRef = firebase.firestore().collection('employees').doc(uid);
    batch.set(employeeRef, {
      uid,
      email,
      shopId,
      role,
      name,
      phoneNumber,
      country: country || null,
      joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    const shopRef = firebase.firestore().collection('registered_shops').doc(shopId);
    const shopDoc = await shopRef.get();
    const shopData = shopDoc.data();

    const updateData: any = {
      staffCount: firebase.firestore.FieldValue.increment(1)
    };

    // If joining as OWNER and shop has no owner yet, claim it
    if (role === 'OWNER' && (!shopData?.ownerId || shopData?.ownerId === '')) {
      updateData.ownerId = uid;
    }

    batch.update(shopRef, updateData);

    await batch.commit();
  }

  async getUserEmployeeData(uid: string) {
    const doc = await firebase.firestore().collection('employees').doc(uid).get();
    return doc.data();
  }

  async logout() {
    await firebase.auth().signOut();
  }

  getCurrentUser() {
    return firebase.auth().currentUser;
  }
}
