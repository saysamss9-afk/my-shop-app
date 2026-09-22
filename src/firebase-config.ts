import { Platform } from 'react-native';

const firebaseConfig = {
  projectId: "my-shop-699ad",
  appId: Platform.select({
    android: "1:308718634009:android:0d0236f006bcc187899688",
    ios: "1:308718634009:web:3eab3c5d82e5286d899688", // Default to web/ios if not specified
    default: "1:308718634009:web:3eab3c5d82e5286d899688",
  }),
  storageBucket: "my-shop-699ad.firebasestorage.app",
  apiKey: "AIzaSyAEmRd1MawUvqh8tir2x8R90YuVD6W78cY", // Use the key from google-services.json
  authDomain: "my-shop-699ad.firebaseapp.com",
  messagingSenderId: "308718634009",
};

let firebaseExport: any;

if (Platform.OS === 'web') {
  const firebase = require('firebase/compat/app').default;
  require('firebase/compat/auth');
  require('firebase/compat/firestore');

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

  if (!nativeApp.apps.length) {
    try {
      nativeApp.initializeApp(firebaseConfig);
    } catch (error) {
      console.error('Firebase native initialization failed:', error);
    }
  }

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
