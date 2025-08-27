import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "hoctuvung2808.firebaseapp.com",
  projectId: "hoctuvung2808",
  storageBucket: "hoctuvung2808.firebasestorage.app",
  messagingSenderId: "904688869790",
  appId: "1:904688869790:web:d7fdfbfefe8db2fc22768f"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
