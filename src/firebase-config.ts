import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  projectId: "my-shop-699ad",
  appId: "1:308718634009:web:3eab3c5d82e5286d899688",
  storageBucket: "my-shop-699ad.firebasestorage.app",
  apiKey: "AIzaSyA3CHNO48bFvw6SE0J0Dd8AM5o0mZzCNQM",
  authDomain: "my-shop-699ad.firebaseapp.com",
  messagingSenderId: "308718634009",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default firebase;
