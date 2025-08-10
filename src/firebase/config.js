import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyASSWUEc5i4tA_wgm6FSR3NS2tyaJkuOjk",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "carbonlens-32147.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "carbonlens-32147",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "carbonlens-32147.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "403682420630",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:403682420630:android:6e284a2e71130723fe9fb7",
  databaseURL: "https://carbonlens-32147-default-rtdb.asia-southeast1.firebasedatabase.app",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app; 