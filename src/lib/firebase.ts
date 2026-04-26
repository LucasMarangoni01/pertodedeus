import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, onMessage } from 'firebase/messaging';
import firebaseConfigLocal from '../../firebase-applet-config.json';

// Centralized timeout helper for production resilience
export const withTimeout = <T>(promise: Promise<T>, ms: number = 10000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT_FIREBASE")), ms)
    ),
  ]);
};

// configuration helper to safely merge env vars with fallback config
const getFirebaseConfig = () => {
  const env = import.meta.env;
  
  // Try to use environment variables first (good for Vercel/Production)
  // Then fallback to the local config (good for AI Studio)
  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfigLocal.apiKey,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigLocal.authDomain,
    projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfigLocal.projectId,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigLocal.storageBucket,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigLocal.messagingSenderId,
    appId: env.VITE_FIREBASE_APP_ID || firebaseConfigLocal.appId,
    firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || (firebaseConfigLocal as any).firestoreDatabaseId
  };

  return config;
};

const firebaseConfig = getFirebaseConfig();

if (import.meta.env.PROD) {
  console.log("[Firebase] Production Mode initialized.");
} else {
  console.log("[Firebase] Development Mode initialized. Project:", firebaseConfig.projectId);
}

// Validate essential config
if (!firebaseConfig.apiKey) {
  console.error("[Firebase] Critical Error: API Key is missing. Check your .env or firebase-applet-config.json");
}

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
