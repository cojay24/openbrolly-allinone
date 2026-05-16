import {
  collectionGroup,
  collection,
  addDoc,
  updateDoc,
  getDocs,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { getDb } from '@openbrolly/firebase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlainUserEnquiry {
  id: string
  /** Full Firestore document path — used to build the messages subcollection path. */
  docPath: string
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
  unreadByUser: boolean
  createdAt: string
}

export interface EnquiryMessage {
  id: string
  body: string
  senderRole: 'user' | 'admin'
  senderName: string
  createdAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type WithToDate = { toDate: () => Date }

function serializeTs(v: unknown): string {
  if (v && typeof v === 'object' && 'toDate' in v) {
    return (v as WithToDate).toDate().toISOString()
  }
  if (typeof v === 'string') return v
  return new Date().toISOString()
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch all enquiries the current user has submitted, across all locations.
 * Requires a COLLECTION_GROUP index on enquiries.userId + createdAt (DESC).
 */
export async function getUserEnquiries(uid: string): Promise<PlainUserEnquiry[]> {
  const q = query(
    collectionGroup(getDb(), 'enquiries'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)

  return snap.docs.map((d) => {
    const data = d.data()
    // Path: clients/{clientId}/locations/{locationId}/enquiries/{enquiryId}
    const parts = d.ref.path.split('/')
    const locationId = parts[3] ?? ''

    return {
      id: d.id,
      docPath: d.ref.path,
      locationId,
      locationTitle: (data.locationTitle as string) || 'Unknown location',
      type: (data.type as PlainUserEnquiry['type']) ?? 'contact',
      name: (data.name as string) ?? '',
      email: (data.email as string) ?? '',
      phone: (data.phone as string) ?? '',
      message: data.message as string | undefined,
      organisation: data.organisation as string | undefined,
      intendedDates: data.intendedDates as string | undefined,
      descriptionOfUse: data.descriptionOfUse as string | undefined,
      status: (data.status as PlainUserEnquiry['status']) ?? 'new',
      unreadByUser: data.unreadByUser === true,
      createdAt: serializeTs(data.createdAt),
    }
  })
}

/**
 * Fetch the message thread for a single enquiry.
 * enquiryPath is the full Firestore document path, e.g.
 * "clients/demo-client/locations/abc/enquiries/xyz"
 */
export async function getEnquiryMessages(enquiryPath: string): Promise<EnquiryMessage[]> {
  const snap = await getDocs(
    query(collection(getDb(), enquiryPath, 'messages'), orderBy('createdAt', 'asc')),
  )
  return snap.docs.map((d) => ({
    id: d.id,
    body: (d.data().body as string) ?? '',
    senderRole: (d.data().senderRole as 'user' | 'admin') ?? 'user',
    senderName: (d.data().senderName as string) ?? '',
    createdAt: serializeTs(d.data().createdAt),
  }))
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Send a reply message as the authenticated user. */
export async function sendUserReply(
  enquiryPath: string,
  body: string,
  senderName: string,
): Promise<EnquiryMessage> {
  const docRef = await addDoc(collection(getDb(), enquiryPath, 'messages'), {
    body,
    senderRole: 'user',
    senderName,
    createdAt: serverTimestamp(),
  })

  // Signal to admin that there's a new unread reply
  await updateDoc(doc(getDb(), enquiryPath), { unreadByAdmin: true })

  return {
    id: docRef.id,
    body,
    senderRole: 'user',
    senderName,
    createdAt: new Date().toISOString(),
  }
}

/** Mark all admin replies as seen by the user. */
export async function markEnquiryReadByUser(enquiryPath: string): Promise<void> {
  await updateDoc(doc(getDb(), enquiryPath), { unreadByUser: false })
}
