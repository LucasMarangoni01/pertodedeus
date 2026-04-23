import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, onMessage } from 'firebase/messaging';
import firebaseConfigLocal from '../../firebase-applet-config.json';

// Hybrid configuration: Priority to VITE_ environment variables (Vercel/Production),
// then fallback to the local json file (AI Studio).
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigLocal.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigLocal.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigLocal.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigLocal.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigLocal.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigLocal.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || (firebaseConfigLocal as any).firestoreDatabaseId
};

// Ensure no empty strings override valid local config
const firebaseConfig = {
  apiKey: config.apiKey || firebaseConfigLocal.apiKey,
  authDomain: config.authDomain || firebaseConfigLocal.authDomain,
  projectId: config.projectId || firebaseConfigLocal.projectId,
  storageBucket: config.storageBucket || firebaseConfigLocal.storageBucket,
  messagingSenderId: config.messagingSenderId || firebaseConfigLocal.messagingSenderId,
  appId: config.appId || firebaseConfigLocal.appId,
  firestoreDatabaseId: config.firestoreDatabaseId || (firebaseConfigLocal as any).firestoreDatabaseId
};

console.log("[Firebase] Initializing with Project:", firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

// Messaging is only supported in some environments
let messagingInstance = null;
if (typeof window !== 'undefined') {
  try {
    messagingInstance = getMessaging(app);
  } catch (e) {
    console.warn("Firebase Messaging not supported in this environment:", e);
  }
}
export const messaging = messagingInstance;
export { onMessage };

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or internet connection.");
    }
  }
}
testConnection();
