import firebase from './firebase-config';
const firestore = () => firebase.firestore();
firestore.FieldValue = firebase.firestore.FieldValue;
firestore.Timestamp = firebase.firestore.Timestamp;
export default firestore;
