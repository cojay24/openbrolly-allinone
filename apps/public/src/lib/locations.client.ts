import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { getDb } from '@openbrolly/firebase'
import type { PlainLocation } from './types'
import type { FieldSchema } from '@openbrolly/firebase/types'

const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID ?? 'demo-client'

type WithToDate = { toDate: () => Date }

function serializeValue(v: unknown): unknown {
  if (
    v &&
    typeof v === 'object' &&
    'toDate' in v &&
    typeof (v as WithToDate).toDate === 'function'
  ) {
    return (v as WithToDate).toDate().toISOString()
  }
  return v
}

function serializeDoc(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, serializeValue(v)]))
}

export async function getPublishedLocations(): Promise<PlainLocation[]> {
  const snap = await getDocs(
    query(
      collection(getDb(), 'clients', CLIENT_ID, 'locations'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
    ),
  )
  return snap.docs.map(
    (d) => ({ id: d.id, ...serializeDoc(d.data() as Record<string, unknown>) }) as PlainLocation,
  )
}

export async function getPublicLocation(locationId: string): Promise<PlainLocation | null> {
  const snap = await getDoc(
    doc(getDb(), 'clients', CLIENT_ID, 'locations', locationId),
  )
  if (!snap.exists()) return null
  const data = snap.data() as Record<string, unknown>
  if (data.status !== 'published') return null
  return { id: snap.id, ...serializeDoc(data) } as PlainLocation
}

export async function getPublicFieldSchema(): Promise<FieldSchema> {
  const snap = await getDoc(
    doc(getDb(), 'clients', CLIENT_ID, 'fieldSchema', 'default'),
  )
  if (!snap.exists()) return { fields: [] }
  return snap.data() as FieldSchema
}
