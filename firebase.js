// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCLNeyxXIbQ8vy74bWNHg-23rmpyHnQCcU",
  authDomain: "betpro-39e01.firebaseapp.com",
  projectId: "betpro-39e01",
  storageBucket: "betpro-39e01.firebasestorage.app",
  messagingSenderId: "983474747906",
  appId: "1:983474747906:web:92f9c7915b02b53d19451b",
  measurementId: "G-74QJR8HD8L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);






// Initialize Authentication
const auth = getAuth(app);

export { auth };