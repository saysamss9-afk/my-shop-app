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
    await firestore().collection('employees').doc(uid).set({
      uid,
      email,
      shopId,
      role,
      name,
      phoneNumber,
      country: country || null,
      joinedAt: firestore.FieldValue.serverTimestamp(),
    });
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
