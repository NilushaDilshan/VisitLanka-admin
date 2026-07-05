import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCQXbDwVRjh_FyZ_sCTiRb4V1bskJUKAo8",
  authDomain: "visitlanka-b8c0a.firebaseapp.com",
  projectId: "visitlanka-b8c0a",
  storageBucket: "visitlanka-b8c0a.appspot.com",
  messagingSenderId: "168243551210",
  appId: "1:168243551210:web:b18d98f3f58c4accd03093",
  measurementId: "G-F4H8QLGP2B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔐 Auth & DB (IMPORTANT)
export const auth = getAuth(app);
export const db = getFirestore(app);

// 📊 Analytics (optional)
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.log("Analytics not supported in this environment");
}

export { analytics };