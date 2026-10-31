import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, getDocFromServer, Firestore } from 'firebase/firestore';
import { Product, FeesConfig, CampaignConfig } from '../types';
import appletConfig from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  firestoreDatabaseId?: string;
}

const FIREBASE_CONFIG_STORAGE_KEY = 'kdt-firebase-config';

export function getSavedFirebaseConfig(): FirebaseCustomConfig {
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.projectId && parsed.apiKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading saved firebase config', e);
  }

  // Use the auto-provisioned Firebase project configuration by default
  return {
    apiKey: appletConfig.apiKey,
    authDomain: appletConfig.authDomain || `${appletConfig.projectId}.firebaseapp.com`,
    projectId: appletConfig.projectId,
    storageBucket: appletConfig.storageBucket,
    messagingSenderId: appletConfig.messagingSenderId,
    appId: appletConfig.appId,
    firestoreDatabaseId: appletConfig.firestoreDatabaseId,
  };
}

export function saveFirebaseConfig(config: FirebaseCustomConfig | null) {
  if (!config) {
    localStorage.removeItem(FIREBASE_CONFIG_STORAGE_KEY);
  } else {
    localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
  }
}

let firebaseAppInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const auth = authInstance;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function initFirebase(config?: FirebaseCustomConfig): Firestore | null {
  const activeConfig = config || getSavedFirebaseConfig();
  if (!activeConfig || !activeConfig.projectId || !activeConfig.apiKey) {
    return null;
  }

  try {
    if (getApps().length > 0) {
      firebaseAppInstance = getApp();
    } else {
      firebaseAppInstance = initializeApp(activeConfig);
    }
    
    authInstance = getAuth(firebaseAppInstance);
    
    // Explicitly pass firestoreDatabaseId if configured
    if (activeConfig.firestoreDatabaseId) {
      firestoreInstance = getFirestore(firebaseAppInstance, activeConfig.firestoreDatabaseId);
    } else {
      firestoreInstance = getFirestore(firebaseAppInstance);
    }

    // Validate connection in background
    testConnection(firestoreInstance).catch((e) => {
      console.warn('Initial Firestore ping note:', e);
    });

    return firestoreInstance;
  } catch (error) {
    console.warn('Firebase init warning:', error);
    return null;
  }
}

async function testConnection(db: Firestore) {
  try {
    await getDocFromServer(doc(db, 'kdt89_pricing', 'latest_workspace'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration or internet connection.');
    }
  }
}

export interface WorkspaceData {
  products: Product[];
  fees: FeesConfig;
  overrides: Record<string, number>;
  campaign?: CampaignConfig;
  updatedAt?: string;
  sourceName?: string;
}

export async function syncToFirebase(
  products: Product[],
  fees: FeesConfig,
  overrides: Record<string, number>,
  campaign?: CampaignConfig,
  sourceName?: string
): Promise<boolean> {
  const db = firestoreInstance || initFirebase();
  if (!db) return false;

  const docPath = 'kdt89_pricing/latest_workspace';
  try {
    const docRef = doc(db, 'kdt89_pricing', 'latest_workspace');
    await setDoc(docRef, {
      products,
      fees,
      overrides,
      campaign: campaign || null,
      sourceName: sourceName || 'Bảng tính Sàn TMĐT',
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (e: any) {
    console.error('Failed to sync data to Firestore:', e);
    try {
      handleFirestoreError(e, OperationType.WRITE, docPath);
    } catch {
      // already logged
    }
    return false;
  }
}

export async function syncFromFirebase(): Promise<WorkspaceData | null> {
  const db = firestoreInstance || initFirebase();
  if (!db) return null;

  const docPath = 'kdt89_pricing/latest_workspace';
  try {
    const docRef = doc(db, 'kdt89_pricing', 'latest_workspace');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as WorkspaceData;
    }
    return null;
  } catch (e: any) {
    console.error('Failed to fetch from Firestore:', e);
    try {
      handleFirestoreError(e, OperationType.GET, docPath);
    } catch {
      // already logged
    }
    return null;
  }
}
