import { initializeApp } from "firebase/app";
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

// Initialize analytics only in browser and production
if (typeof window !== 'undefined' && window.location.hostname === 'daymytime.com') {
  import("firebase/analytics").then(({ getAnalytics }) => {
    try { getAnalytics(app); } catch { /* silent */ }
  });
}

export const db = getFirestore(app);
export const storage = getStorage(app);
