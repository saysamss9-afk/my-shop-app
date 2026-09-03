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
    await firebase.firestore().collection('employees').doc(uid).set({
      uid,
      email,
      shopId,
      role,
      name,
      phoneNumber,
      country: country || null,
      joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
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
