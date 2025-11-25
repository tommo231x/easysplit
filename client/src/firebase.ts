// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCV1njaFK0r7-ZoSnKtUemrQDuqoPgC3Kc",
  authDomain: "easy-split-b7e87.firebaseapp.com",
  projectId: "easy-split-b7e87",
  storageBucket: "easy-split-b7e87.firebasestorage.app",
  messagingSenderId: "1046336879750",
  appId: "1:1046336879750:web:6382debcf6e0d21ecda507",
  measurementId: "G-QEQGJRC6DR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);