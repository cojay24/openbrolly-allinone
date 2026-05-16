import type { Timestamp } from 'firebase/firestore'

// ─── Brand / Client ──────────────────────────────────────────────────────────

export interface BrandConfig {
  logo: string
  primaryColor: string
  secondaryColor: string
  fontFamily: string
}

export interface Client {
  id: string
  name: string
  brandConfig: BrandConfig
}

// ─── Field Schema ─────────────────────────────────────────────────────────────

export type FieldType = 'text' | 'textarea' | 'boolean' | 'select' | 'number'

export interface FieldDefinition {
  /** UUID */
  id: string
  label: string
  type: FieldType
  /** Only used when type === 'select' */
  options: string[]
  showOnPublic: boolean
  required: boolean
  /** Display order (ascending) */
  order: number
}

export interface FieldSchema {
  fields: FieldDefinition[]
}

// ─── Location ─────────────────────────────────────────────────────────────────

export type LocationStatus = 'draft' | 'published' | 'pending-approval' | 'rejected'

export interface SubmittedBy {
  uid: string
  firstName: string
  surname: string
  email: string
}

export interface Location {
  id: string
  title: string
  description: string
  categories: string[]
  images: string[]
  status: LocationStatus
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
  /** Set when a location owner submits for approval */
  submittedBy?: SubmittedBy
  submittedAt?: Timestamp | Date
  /** Dynamic custom fields defined by the client's fieldSchema */
  [key: string]: unknown
}

// ─── Enquiry ──────────────────────────────────────────────────────────────────

export type EnquiryType = 'contact' | 'permit'
export type EnquiryStatus = 'new' | 'read' | 'replied'

export interface Enquiry {
  id: string
  type: EnquiryType
  name: string
  email: string
  phone: string
  message: string
  status: EnquiryStatus
  createdAt: Timestamp | Date
}
