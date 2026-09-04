import firebase from './firebase-config';
const auth = () => firebase.auth();
auth.PhoneAuthProvider = firebase.auth.PhoneAuthProvider;
export default auth;
