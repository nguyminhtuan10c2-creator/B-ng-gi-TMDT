import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { Product, FeesConfig } from '../types';

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const FIREBASE_CONFIG_STORAGE_KEY = 'kdt-firebase-config';

export function getSavedFirebaseConfig(): FirebaseCustomConfig | null {
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading saved firebase config', e);
  }

  // Fallback to environment variables if provided
  if (import.meta.env.VITE_FIREBASE_PROJECT_ID && import.meta.env.VITE_FIREBASE_API_KEY) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };
  }

  return null;
}

export function saveFirebaseConfig(config: FirebaseCustomConfig | null) {
  if (!config) {
    localStorage.removeItem(FIREBASE_CONFIG_STORAGE_KEY);
  } else {
    localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
  }
}

let firestoreInstance: Firestore | null = null;

export function initFirebase(config?: FirebaseCustomConfig): Firestore | null {
  const activeConfig = config || getSavedFirebaseConfig();
  if (!activeConfig || !activeConfig.projectId || !activeConfig.apiKey) {
    return null;
  }

  try {
    let app: FirebaseApp;
    if (getApps().length > 0) {
      app = getApp();
    } else {
      app = initializeApp(activeConfig);
    }
    firestoreInstance = getFirestore(app);
    return firestoreInstance;
  } catch (error) {
    console.warn('Firebase init warning:', error);
    return null;
  }
}

export async function syncToFirebase(products: Product[], fees: FeesConfig, overrides: Record<string, number>): Promise<boolean> {
  const db = firestoreInstance || initFirebase();
  if (!db) return false;

  try {
    const docRef = doc(db, 'kdt89_pricing', 'latest_workspace');
    await setDoc(docRef, {
      products,
      fees,
      overrides,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (e) {
    console.error('Failed to sync data to Firestore:', e);
    return false;
  }
}

export async function syncFromFirebase(): Promise<{ products: Product[]; fees: FeesConfig; overrides: Record<string, number> } | null> {
  const db = firestoreInstance || initFirebase();
  if (!db) return null;

  try {
    const docRef = doc(db, 'kdt89_pricing', 'latest_workspace');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as { products: Product[]; fees: FeesConfig; overrides: Record<string, number> };
    }
    return null;
  } catch (e) {
    console.error('Failed to fetch from Firestore:', e);
    return null;
  }
}
