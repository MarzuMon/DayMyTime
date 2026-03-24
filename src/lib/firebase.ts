import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB-YrkdQtabbFBP9dHGHZ52g4bywzVf1Ys",
  authDomain: "day-my-time.firebaseapp.com",
  projectId: "day-my-time",
  storageBucket: "day-my-time.firebasestorage.app",
  messagingSenderId: "453776827954",
  appId: "1:453776827954:web:a601376653eedca45a3e2b",
  measurementId: "G-6VWB90EJFT",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
