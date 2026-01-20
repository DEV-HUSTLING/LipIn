import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBaNAHhmMK3I7x1cXXSWoOtQxqfiGsJTNQ",
  authDomain: "lipin-5ab71.firebaseapp.com",
  projectId: "lipin-5ab71",
  storageBucket: "lipin-5ab71.firebasestorage.app",
  messagingSenderId: "308608519140",
  appId: "1:308608519140:web:c71b717860147e2c1d15f1",
  measurementId: "G-CLZV2VJDMR"
};
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)

// Setup google provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt:'select_account'
})

// Keep user logged in
setPersistence(auth, browserLocalPersistence)