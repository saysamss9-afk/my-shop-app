import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || "my-shop-699ad",
  appId: process.env.FIREBASE_APP_ID || "1:308718634009:web:3eab3c5d82e5286d899688",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "my-shop-699ad.firebasestorage.app",
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyA3CHNO48bFvw6SE0J0Dd8AM5o0mZzCNQM",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "my-shop-699ad.firebaseapp.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "308718634009",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);

  // Auth persistence for web
  if (typeof window !== 'undefined') {
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .catch(err => console.error('Auth persistence failed:', err));
  }

  // Enable persistence for web
  if (typeof window !== 'undefined') {
    firebase.firestore().enablePersistence({ synchronizeTabs: true })
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled
          // in one tab at a a time.
          console.warn('Firestore persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
          // The current browser does not support all of the
          // features required to enable persistence
          console.warn('Firestore persistence failed: Browser not supported');
        }
      });
  }
}

export default firebase;
