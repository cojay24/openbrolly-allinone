/**
 * Firebase client-side SDK initialisation.
 * Import this only in browser/client-component contexts.
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
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

export function getDb(): Firestore {
  return getFirestore(getFirebaseApp())
}

export function getStorageInstance(): FirebaseStorage {
  return getStorage(getFirebaseApp())
}

export function getAuthInstance(): Auth {
  return getAuth(getFirebaseApp())
}
