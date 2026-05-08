import 'server-only'
import { getAdminDb } from '@openbrolly/firebase/admin'
import type { FieldSchema } from '@openbrolly/firebase/types'

// Plain serialisable versions of Firestore documents (Timestamps → ISO strings)
export interface PlainClient {
  id: string
  name: string
  brandConfig: {
    logo: string
    primaryColor: string
    secondaryColor: string
    fontFamily: string
  }
}

export interface PlainLocation {
  id: string
  title: string
  description: string
  categories: string[]
  images: string[]
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
  [key: string]: unknown
}

type FirestoreValue = { toDate: () => Date } | Date | unknown

function serializeValue(v: FirestoreValue): unknown {
  if (v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: unknown }).toDate === 'function') {
    return (v as { toDate: () => Date }).toDate().toISOString()
  }
  return v
}

function serializeDoc(data: Record<string, FirestoreValue>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, serializeValue(v)]))
}

export async function getClient(clientId: string): Promise<PlainClient> {
  const db = getAdminDb()
  const snap = await db.collection('clients').doc(clientId).get()
  if (!snap.exists) throw new Error(`Client "${clientId}" not found in Firestore`)
  return { id: snap.id, ...serializeDoc(snap.data() as Record<string, FirestoreValue>) } as PlainClient
}

export async function getPublishedLocations(clientId: string): Promise<PlainLocation[]> {
  const db = getAdminDb()
  const snap = await db
    .collection('clients')
    .doc(clientId)
    .collection('locations')
    .where('status', '==', 'published')
    .orderBy('createdAt', 'desc')
    .get()
  return snap.docs.map(
    (doc) => ({ id: doc.id, ...serializeDoc(doc.data() as Record<string, FirestoreValue>) }) as PlainLocation,
  )
}

export async function getLocation(
  clientId: string,
  locationId: string,
): Promise<PlainLocation | null> {
  const db = getAdminDb()
  const snap = await db
    .collection('clients')
    .doc(clientId)
    .collection('locations')
    .doc(locationId)
    .get()
  if (!snap.exists) return null
  return { id: snap.id, ...serializeDoc(snap.data() as Record<string, FirestoreValue>) } as PlainLocation
}

export async function getFieldSchema(clientId: string): Promise<FieldSchema> {
  const db = getAdminDb()
  const snap = await db
    .collection('clients')
    .doc(clientId)
    .collection('fieldSchema')
    .doc('default')
    .get()
  if (!snap.exists) return { fields: [] }
  return snap.data() as FieldSchema
}
