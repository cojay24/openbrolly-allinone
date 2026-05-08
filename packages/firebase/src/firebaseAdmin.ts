/**
 * Firebase Admin SDK — server-side only.
 * Never import this in client components or browser code.
 * Used by Server Actions, API Routes, and scripts.
 */
import admin from 'firebase-admin'
import type { App } from 'firebase-admin/app'
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore'
import { getStorage as getAdminStorage } from 'firebase-admin/storage'
import { getAuth as getAdminAuthSDK } from 'firebase-admin/auth'

function getAdminApp(): App {
  if (admin.apps.length) return admin.apps[0]!

  // When GOOGLE_APPLICATION_CREDENTIALS is set, credential is inferred
  // automatically. For local dev without a service account file you can
  // supply individual env vars instead:
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  const credential =
    clientEmail && privateKey
      ? admin.credential.cert({ projectId, clientEmail, privateKey })
      : admin.credential.applicationDefault()

  return admin.initializeApp({
    credential,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  })
}

export function getAdminDb() {
  return getAdminFirestore(getAdminApp())
}

export function getAdminStorageInstance() {
  return getAdminStorage(getAdminApp())
}

export function getAdminAuth() {
  return getAdminAuthSDK(getAdminApp())
}

export { admin }
