// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBtdEBC5BAwPoYk_DmDnrXn2Kxs-90qTdk",
  authDomain: "betpro-2f60a.firebaseapp.com",
  projectId: "betpro-2f60a",
  storageBucket: "betpro-2f60a.firebasestorage.app",
  messagingSenderId: "654705922401",
  appId: "1:654705922401:web:ae4cf0d4a033ba2db5f520",
  measurementId: "G-1T3ZCSPW1W"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Realtime Database
const database = getDatabase(app);

console.log('Firebase initialized');
console.log('Auth:', auth ? 'OK' : 'Failed');
console.log('Database:', database ? 'OK' : 'Failed');

export { auth, database };