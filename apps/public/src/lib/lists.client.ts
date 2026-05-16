import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore'
import { getDb } from '@openbrolly/firebase'
import type { PlainLocation } from './types'

const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID ?? 'demo-client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserList {
  id: string
  name: string
  locationIds: string[]
  createdAt: string
  updatedAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function listsCol(uid: string) {
  return collection(getDb(), 'users', uid, 'clientLists', CLIENT_ID, 'lists')
}

function listDoc(uid: string, listId: string) {
  return doc(getDb(), 'users', uid, 'clientLists', CLIENT_ID, 'lists', listId)
}

function toIso(v: unknown): string {
  if (v && typeof v === 'object' && 'toDate' in v) {
    return (v as { toDate: () => Date }).toDate().toISOString()
  }
  return ''
}

// ─── List CRUD ────────────────────────────────────────────────────────────────

export async function getLists(uid: string): Promise<UserList[]> {
  const snap = await getDocs(listsCol(uid))
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      name: data.name as string,
      locationIds: (data.locationIds as string[]) ?? [],
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
    }
  })
}

export async function createList(uid: string, name: string): Promise<string> {
  const ref = await addDoc(listsCol(uid), {
    name,
    locationIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function addToList(uid: string, listId: string, locationId: string): Promise<void> {
  await updateDoc(listDoc(uid, listId), {
    locationIds: arrayUnion(locationId),
    updatedAt: serverTimestamp(),
  })
}

export async function removeFromList(uid: string, listId: string, locationId: string): Promise<void> {
  await updateDoc(listDoc(uid, listId), {
    locationIds: arrayRemove(locationId),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteList(uid: string, listId: string): Promise<void> {
  await deleteDoc(listDoc(uid, listId))
}

// ─── Location fetching (client-side, for My Lists detail view) ────────────────

/**
 * Fetches location documents by ID using the client SDK.
 * Only published locations are returned (Firestore rules enforce this).
 */
export async function getLocationsFromIds(locationIds: string[]): Promise<PlainLocation[]> {
  if (!locationIds.length) return []

  const snaps = await Promise.all(
    locationIds.map((id) =>
      getDoc(doc(getDb(), 'clients', CLIENT_ID, 'locations', id))
    )
  )

  return snaps
    .filter((snap) => snap.exists())
    .map((snap) => {
      const data = snap.data()!
      return {
        id: snap.id,
        title: data.title as string,
        description: data.description as string,
        categories: (data.categories as string[]) ?? [],
        images: (data.images as string[]) ?? [],
        status: data.status as 'draft' | 'published',
        createdAt: toIso(data.createdAt),
        updatedAt: toIso(data.updatedAt),
        ...data,
      } as PlainLocation
    })
}
