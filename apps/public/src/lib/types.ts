/**
 * Shared serialisable types used by both server (db.server.ts) and
 * client (lists.client.ts, my-lists page) contexts.
 * Do NOT import 'server-only' here.
 */

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
