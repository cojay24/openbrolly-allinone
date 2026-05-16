/**
 * Firebase client-side SDK initialisation.
 * Import this only in browser/client-component contexts.
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'
import { getAuth, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

function getFirebaseApp(): FirebaseApp {
  if (getApps().length) return getApps()[0]!
  return initializeApp(firebaseConfig)
}

// Singleton – initializeFirestore must only be called once per app instance.
let _db: Firestore | null = null

export function getDb(): Firestore {
  if (_db) return _db
  const app = getFirebaseApp()
  try {
    // Persistent cache stores all reads in IndexedDB so subsequent page loads
    // and future sessions are served locally – zero extra Firestore read charges
    // for data that hasn't changed. Multi-tab manager keeps all open tabs in sync.
    _db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  } catch {
    // initializeFirestore already called (e.g. hot-reload / test env)
    _db = getFirestore(app)
  }
  return _db
}

export function getStorageInstance(): FirebaseStorage {
  return getStorage(getFirebaseApp())
}

export function getAuthInstance(): Auth {
  return getAuth(getFirebaseApp())
}
