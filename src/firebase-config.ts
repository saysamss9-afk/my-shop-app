import { Platform } from 'react-native';

let firebaseExport: any;

if (Platform.OS === 'web') {
  const firebase = require('firebase/compat/app').default;
  require('firebase/compat/auth');
  require('firebase/compat/firestore');

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
        .catch((err: any) => console.error('Auth persistence failed:', err));
    }

    // Enable persistence for web
    if (typeof window !== 'undefined') {
      firebase.firestore().enablePersistence({ synchronizeTabs: true })
        .catch((err: any) => {
          if (err.code === 'failed-precondition') {
            console.warn('Firestore persistence failed: Multiple tabs open');
          } else if (err.code === 'unimplemented') {
            console.warn('Firestore persistence failed: Browser not supported');
          }
        });
    }
  }
  firebaseExport = firebase;
} else {
  // Native mobile (Android/iOS) using native SDKs which handle session persistence automatically
  const nativeApp = require('@react-native-firebase/app').default;
  const nativeAuth = require('@react-native-firebase/auth').default;
  const nativeFirestore = require('@react-native-firebase/firestore').default;

  firebaseExport = {
    apps: nativeApp.apps,
    auth: () => nativeAuth(),
    firestore: () => nativeFirestore(),
  };

  // Attach statics
  (firebaseExport.auth as any).PhoneAuthProvider = nativeAuth.PhoneAuthProvider;
  (firebaseExport.firestore as any).FieldValue = nativeFirestore.FieldValue;
  (firebaseExport.firestore as any).Timestamp = nativeFirestore.Timestamp;
}

export default firebaseExport;
