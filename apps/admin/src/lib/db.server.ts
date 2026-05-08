import 'server-only'
import { getAdminDb } from '@openbrolly/firebase/admin'
import type { FieldSchema } from '@openbrolly/firebase/types'

// ─── Serialised types ────────────────────────────────────────────────────────

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

export interface PlainEnquiry {
  id: string
  locationId: string
  locationTitle: string
  type: 'contact' | 'permit'
  name: string
  email: string
  phone: string
  message?: string
  // permit-specific
  organisation?: string
  intendedDates?: string
  descriptionOfUse?: string
  status: 'new' | 'read' | 'replied'
  createdAt: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type WithToDate = { toDate: () => Date }

function serializeValue(v: unknown): unknown {
  if (v && typeof v === 'object' && 'toDate' in v && typeof (v as WithToDate).toDate === 'function') {
    return (v as WithToDate).toDate().toISOString()
  }
  return v
}

function serializeDoc(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, serializeValue(v)]))
}

// ─── Brand config ─────────────────────────────────────────────────────────────

export async function getClientBrandConfig(clientId: string): Promise<{
  logo: string
  primaryColor: string
  secondaryColor: string
}> {
  const db = getAdminDb()
  const snap = await db.collection('clients').doc(clientId).get()
  const brand = (snap.data()?.brandConfig ?? {}) as Record<string, unknown>
  return {
    logo: (brand.logo as string) ?? '',
    primaryColor: (brand.primaryColor as string) ?? '#4F46E5',
    secondaryColor: (brand.secondaryColor as string) ?? '#818CF8',
  }
}

// ─── Locations ───────────────────────────────────────────────────────────────

export async function getLocations(clientId: string): Promise<PlainLocation[]> {
  const db = getAdminDb()
  const snap = await db
    .collection('clients').doc(clientId)
    .collection('locations')
    .orderBy('createdAt', 'desc')
    .get()
  return snap.docs.map((d) => ({ id: d.id, ...serializeDoc(d.data() as Record<string, unknown>) }) as PlainLocation)
}

export async function getLocation(clientId: string, locationId: string): Promise<PlainLocation | null> {
  const db = getAdminDb()
  const snap = await db
    .collection('clients').doc(clientId)
    .collection('locations').doc(locationId)
    .get()
  if (!snap.exists) return null
  return { id: snap.id, ...serializeDoc(snap.data() as Record<string, unknown>) } as PlainLocation
}

export async function getFieldSchema(clientId: string): Promise<FieldSchema> {
  const db = getAdminDb()
  const snap = await db
    .collection('clients').doc(clientId)
    .collection('fieldSchema').doc('default')
    .get()
  if (!snap.exists) return { fields: [] }
  return snap.data() as FieldSchema
}

// ─── Enquiries ────────────────────────────────────────────────────────────────

export async function getAllEnquiries(clientId: string): Promise<PlainEnquiry[]> {
  const db = getAdminDb()
  const locsSnap = await db.collection('clients').doc(clientId).collection('locations').get()

  const batches = await Promise.all(
    locsSnap.docs.map(async (locDoc) => {
      const locTitle = (locDoc.data().title as string) ?? 'Unknown location'
      const eqSnap = await db
        .collection('clients').doc(clientId)
        .collection('locations').doc(locDoc.id)
        .collection('enquiries')
        .orderBy('createdAt', 'desc')
        .get()
      return eqSnap.docs.map((eqDoc) => ({
        id: eqDoc.id,
        locationId: locDoc.id,
        locationTitle: locTitle,
        ...serializeDoc(eqDoc.data() as Record<string, unknown>),
      })) as PlainEnquiry[]
    }),
  )

  return batches
    .flat()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getUnreadEnquiryCount(clientId: string): Promise<number> {
  const db = getAdminDb()
  const locsSnap = await db.collection('clients').doc(clientId).collection('locations').get()

  const counts = await Promise.all(
    locsSnap.docs.map(async (locDoc) => {
      const snap = await db
        .collection('clients').doc(clientId)
        .collection('locations').doc(locDoc.id)
        .collection('enquiries')
        .where('status', '==', 'new')
        .get()
      return snap.size
    }),
  )
  return counts.reduce((a, b) => a + b, 0)
}

// ─── Dashboard stats ─────────────────────────────────────────────────────────

export async function getDashboardStats(clientId: string) {
  const db = getAdminDb()
  const locsSnap = await db.collection('clients').doc(clientId).collection('locations').get()
  const totalLocations = locsSnap.size
  const publishedLocations = locsSnap.docs.filter((d) => d.data().status === 'published').length

  let totalEnquiries = 0
  let unreadEnquiries = 0

  await Promise.all(
    locsSnap.docs.map(async (locDoc) => {
      const eqSnap = await db
        .collection('clients').doc(clientId)
        .collection('locations').doc(locDoc.id)
        .collection('enquiries')
        .get()
      totalEnquiries += eqSnap.size
      unreadEnquiries += eqSnap.docs.filter((d) => d.data().status === 'new').length
    }),
  )

  return { totalLocations, publishedLocations, totalEnquiries, unreadEnquiries }
}
