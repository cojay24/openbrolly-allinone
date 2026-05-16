/**
 * Shared serialisable types used by both server (db.server.ts) and
 * client (lists.client.ts, my-lists page) contexts.
 * Do NOT import 'server-only' here.
 */

export interface SubmittedBy {
  uid: string
  firstName: string
  surname: string
  email: string
}

export interface PlainLocation {
  id: string
  title: string
  description: string
  categories: string[]
  images: string[]
  status: 'draft' | 'published' | 'pending-approval' | 'rejected'
  createdAt: string
  updatedAt: string
  submittedBy?: SubmittedBy
  submittedAt?: string
  [key: string]: unknown
}
