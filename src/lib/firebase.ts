import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:            "AIzaSyDy-p1HMVOOPIW9ttWMP6VwnyQNN8Ck7Ps",
  authDomain:        "clube-do-livro-39d61.firebaseapp.com",
  projectId:         "clube-do-livro-39d61",
  storageBucket:     "clube-do-livro-39d61.firebasestorage.app",
  messagingSenderId: "29596319086",
  appId:             "1:29596319086:web:37fe88c62f84ab7d99d57f",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db      = getFirestore(app);
export const auth    = getAuth(app);
export const storage = getStorage(app);
export default app;