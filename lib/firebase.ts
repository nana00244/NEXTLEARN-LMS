import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDa_7OSRMISKmRLqnm_XTpVNFam-Pk-8ig",
  authDomain: "nextlms-90eb2.firebaseapp.com",
  projectId: "nextlms-90eb2",
  storageBucket: "nextlms-90eb2.firebasestorage.app",
  messagingSenderId: "955018568902",
  appId: "1:955018568902:web:40c5aba88b5029932ea3c7",
  measurementId: "G-147SYTQB1S"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export default app;