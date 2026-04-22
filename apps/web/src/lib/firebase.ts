/**
 * ElectEd — Firebase Client SDK Configuration
 *
 * Initializes Firebase for the web app:
 * - Firebase Auth (anonymous sign-in)
 * - Firestore client for direct reads
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from 'firebase/firestore';

// ── Firebase Config from Environment ────────────────────
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'localhost',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-elect-ed',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// ── Singleton Initialization ────────────────────────────
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function getFirebaseApp(): FirebaseApp {
  if (_app) return _app;

  const existingApps = getApps();
  if (existingApps.length > 0) {
    _app = existingApps[0];
  } else {
    _app = initializeApp(firebaseConfig);
  }

  return _app;
}

export function getFirebaseAuth(): Auth {
  if (_auth) return _auth;

  _auth = getAuth(getFirebaseApp());

  // Connect to emulator in development
  if (
    typeof window !== 'undefined' &&
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_USE_EMULATORS === 'true'
  ) {
    connectAuthEmulator(_auth, 'http://localhost:9099', { disableWarnings: true });
  }

  return _auth;
}

export function getFirebaseDB(): Firestore {
  if (_db) return _db;

  _db = getFirestore(getFirebaseApp());

  // Connect to emulator in development
  if (
    typeof window !== 'undefined' &&
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_USE_EMULATORS === 'true'
  ) {
    connectFirestoreEmulator(_db, 'localhost', 8181);
  }

  return _db;
}

export { firebaseConfig };
