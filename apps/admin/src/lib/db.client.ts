import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, orderBy, where, serverTimestamp,
} from 'firebase/firestore'
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { getDb, getStorageInstance } from '@openbrolly/firebase'
import type { FieldDefinition, FieldSchema } from '@openbrolly/firebase/types'

// ─── Serialisable types ───────────────────────────────────────────────────────

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
  organisation?: string
  intendedDates?: string
  descriptionOfUse?: string
  status: 'new' | 'read' | 'replied'
  createdAt: string
}

// ─── Serialisation helpers ────────────────────────────────────────────────────

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

// ─── Locations ────────────────────────────────────────────────────────────────

export async function getLocations(clientId: string): Promise<PlainLocation[]> {
  const snap = await getDocs(
    query(collection(getDb(), 'clients', clientId, 'locations'), orderBy('createdAt', 'desc'))
  )
  return snap.docs.map((d) => ({ id: d.id, ...serializeDoc(d.data()) }) as PlainLocation)
}

export async function getLocation(clientId: string, locationId: string): Promise<PlainLocation | null> {
  const snap = await getDoc(doc(getDb(), 'clients', clientId, 'locations', locationId))
  if (!snap.exists()) return null
  return { id: snap.id, ...serializeDoc(snap.data()) } as PlainLocation
}

export async function saveLocation(
  clientId: string,
  locationId: string,
  data: Record<string, unknown>,
  isNew: boolean,
): Promise<string> {
  const ref = doc(getDb(), 'clients', clientId, 'locations', locationId)
  if (isNew) {
    await setDoc(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  } else {
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
  }
  return locationId
}

// ─── Field schema ─────────────────────────────────────────────────────────────

export async function getFieldSchema(clientId: string): Promise<FieldSchema> {
  const snap = await getDoc(doc(getDb(), 'clients', clientId, 'fieldSchema', 'default'))
  if (!snap.exists()) return { fields: [] }
  return snap.data() as FieldSchema
}

export async function saveFieldSchema(clientId: string, fields: FieldDefinition[]): Promise<void> {
  if (fields.length > 20) throw new Error('Maximum of 20 custom fields allowed.')
  await setDoc(doc(getDb(), 'clients', clientId, 'fieldSchema', 'default'), { fields })
}

// ─── Enquiries ────────────────────────────────────────────────────────────────

export async function getAllEnquiries(clientId: string): Promise<PlainEnquiry[]> {
  const locsSnap = await getDocs(collection(getDb(), 'clients', clientId, 'locations'))

  const batches = await Promise.all(
    locsSnap.docs.map(async (locDoc) => {
      const locTitle = (locDoc.data().title as string) ?? 'Unknown location'
      const eqSnap = await getDocs(
        query(
          collection(getDb(), 'clients', clientId, 'locations', locDoc.id, 'enquiries'),
          orderBy('createdAt', 'desc'),
        ),
      )
      return eqSnap.docs.map((eqDoc) => ({
        id: eqDoc.id,
        locationId: locDoc.id,
        locationTitle: locTitle,
        ...serializeDoc(eqDoc.data()),
      })) as PlainEnquiry[]
    }),
  )

  return batches.flat().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getUnreadEnquiryCount(clientId: string): Promise<number> {
  const locsSnap = await getDocs(collection(getDb(), 'clients', clientId, 'locations'))
  const counts = await Promise.all(
    locsSnap.docs.map(async (locDoc) => {
      const snap = await getDocs(
        query(
          collection(getDb(), 'clients', clientId, 'locations', locDoc.id, 'enquiries'),
          where('status', '==', 'new'),
        ),
      )
      return snap.size
    }),
  )
  return counts.reduce((a, b) => a + b, 0)
}

export async function updateEnquiryStatus(
  clientId: string,
  locationId: string,
  enquiryId: string,
  status: 'read' | 'replied',
): Promise<void> {
  await updateDoc(
    doc(getDb(), 'clients', clientId, 'locations', locationId, 'enquiries', enquiryId),
    { status },
  )
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export async function getDashboardStats(clientId: string) {
  const locsSnap = await getDocs(collection(getDb(), 'clients', clientId, 'locations'))
  const totalLocations = locsSnap.size
  const publishedLocations = locsSnap.docs.filter((d) => d.data().status === 'published').length

  let totalEnquiries = 0
  let unreadEnquiries = 0

  await Promise.all(
    locsSnap.docs.map(async (locDoc) => {
      const eqSnap = await getDocs(
        collection(getDb(), 'clients', clientId, 'locations', locDoc.id, 'enquiries'),
      )
      totalEnquiries += eqSnap.size
      unreadEnquiries += eqSnap.docs.filter((d) => d.data().status === 'new').length
    }),
  )

  return { totalLocations, publishedLocations, totalEnquiries, unreadEnquiries }
}

// ─── Brand config ─────────────────────────────────────────────────────────────

export async function getClientBrandConfig(clientId: string): Promise<{
  logo: string
  primaryColor: string
  secondaryColor: string
}> {
  const snap = await getDoc(doc(getDb(), 'clients', clientId))
  const brand = (snap.data()?.brandConfig ?? {}) as Record<string, unknown>
  return {
    logo: (brand.logo as string) ?? '',
    primaryColor: (brand.primaryColor as string) ?? '#4F46E5',
    secondaryColor: (brand.secondaryColor as string) ?? '#818CF8',
  }
}

export async function saveBrandConfig(
  clientId: string,
  config: { logo: string; primaryColor: string; secondaryColor: string },
): Promise<void> {
  if (!/^#[0-9A-Fa-f]{6}$/.test(config.primaryColor)) throw new Error('Invalid primaryColor.')
  if (!/^#[0-9A-Fa-f]{6}$/.test(config.secondaryColor)) throw new Error('Invalid secondaryColor.')
  await updateDoc(doc(getDb(), 'clients', clientId), {
    'brandConfig.logo': config.logo,
    'brandConfig.primaryColor': config.primaryColor,
    'brandConfig.secondaryColor': config.secondaryColor,
  })
}

export async function uploadLogo(clientId: string, file: File): Promise<string> {
  if (file.size > 2 * 1024 * 1024) throw new Error('File exceeds 2 MB limit.')
  if (!file.type.startsWith('image/')) throw new Error('File must be an image.')

  const ext = (file.name.split('.').pop() ?? 'png').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `clients/${clientId}/brand/logo.${ext}`
  const sRef = storageRef(getStorageInstance(), path)

  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(sRef, file, { contentType: file.type })
    task.on('state_changed', null, reject, () => resolve())
  })

  return getDownloadURL(sRef)
}
