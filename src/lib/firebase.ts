// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB-YrkdQtabbFBP9dHGHZ52g4bywzVf1Ys",
  authDomain: "day-my-time.firebaseapp.com",
  projectId: "day-my-time",
  storageBucket: "day-my-time.firebasestorage.app",
  messagingSenderId: "453776827954",
  appId: "1:453776827954:web:a601376653eedca45a3e2b",
  measurementId: "G-6VWB90EJFT",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
