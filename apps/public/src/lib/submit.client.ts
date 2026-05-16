import {
  collection,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore'
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage'
import { getDb, getStorageInstance, createTTLCache } from '@openbrolly/firebase'
import type { FieldSchema } from '@openbrolly/firebase/types'
import type { UserProfile } from '@/context/AuthContext'

const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID ?? 'demo-client'

// ─── Field schema ─────────────────────────────────────────────────────────────

// Shared with the locations.client cache — field schema rarely changes.
const _schemaCache = createTTLCache<FieldSchema>(10 * 60 * 1000) // 10 min

export async function getFieldSchema(): Promise<FieldSchema> {
  const cached = _schemaCache.get()
  if (cached) return cached

  const snap = await getDoc(
    doc(getDb(), 'clients', CLIENT_ID, 'fieldSchema', 'default')
  )
  const result: FieldSchema = snap.exists() ? (snap.data() as FieldSchema) : { fields: [] }
  _schemaCache.set(result)
  return result
}

// ─── Image upload ─────────────────────────────────────────────────────────────

export async function uploadLocationImage(
  locationId: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const path = `clients/${CLIENT_ID}/locations/${locationId}/${filename}`
  const sRef = storageRef(getStorageInstance(), path)

  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(sRef, file, { contentType: file.type })
    task.on(
      'state_changed',
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      resolve,
    )
  })

  return getDownloadURL(sRef)
}

// ─── Submit location ──────────────────────────────────────────────────────────

export interface SubmitLocationData {
  title: string
  description: string
  categories: string[]
  images: string[]
  customFields: Record<string, unknown>
}

/**
 * Creates a location document with status 'pending-approval'.
 * Uses a pre-generated ID so images can be uploaded to the correct path first.
 */
export async function submitLocation(
  uid: string,
  profile: UserProfile,
  data: SubmitLocationData,
): Promise<string> {
  const locationRef = doc(collection(getDb(), 'clients', CLIENT_ID, 'locations'))

  await setDoc(locationRef, {
    title:       data.title,
    description: data.description,
    categories:  data.categories,
    images:      data.images,
    status:      'pending-approval',
    submittedBy: {
      uid,
      firstName: profile.firstName,
      surname:   profile.surname,
      email:     profile.email,
    },
    submittedAt: serverTimestamp(),
    createdAt:   serverTimestamp(),
    updatedAt:   serverTimestamp(),
    // Spread dynamic custom fields
    ...data.customFields,
  })

  return locationRef.id
}

/**
 * Pre-generates a location document ID so images can be uploaded
 * before the document is created.
 */
export function generateLocationId(): string {
  return doc(collection(getDb(), 'clients', CLIENT_ID, 'locations')).id
}
