import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { getDb, createTTLCache, createKeyedTTLCache } from '@openbrolly/firebase'
import type { PlainLocation } from './types'
import type { FieldSchema } from '@openbrolly/firebase/types'

const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID ?? 'demo-client'

// ─── Serialisation ────────────────────────────────────────────────────────────

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

// ─── Module-level caches ──────────────────────────────────────────────────────
// These live for the lifetime of the browser tab. Firestore's IndexedDB
// persistence handles cross-session caching; these caches handle within-session
// redundant reads (e.g. navigating back to the homepage).

/** All published locations — refreshed at most every 5 minutes. */
const locationsListCache = createTTLCache<PlainLocation[]>(5 * 60 * 1000)

/** Individual location by ID — refreshed at most every 5 minutes. */
const locationByIdCache = createKeyedTTLCache<PlainLocation>(5 * 60 * 1000)

/** Field schema — rarely changes, cache for 10 minutes. */
const fieldSchemaCache = createTTLCache<FieldSchema>(10 * 60 * 1000)

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getPublishedLocations(): Promise<PlainLocation[]> {
  const cached = locationsListCache.get()
  if (cached) return cached

  const snap = await getDocs(
    query(
      collection(getDb(), 'clients', CLIENT_ID, 'locations'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
    ),
  )
  const results = snap.docs.map(
    (d) => ({ id: d.id, ...serializeDoc(d.data() as Record<string, unknown>) }) as PlainLocation,
  )

  locationsListCache.set(results)
  // Also seed the per-ID cache so detail page navigations are free
  results.forEach((loc) => locationByIdCache.set(loc.id, loc))

  return results
}

export async function getPublicLocation(locationId: string): Promise<PlainLocation | null> {
  const cached = locationByIdCache.get(locationId)
  if (cached) return cached

  const snap = await getDoc(
    doc(getDb(), 'clients', CLIENT_ID, 'locations', locationId),
  )
  if (!snap.exists()) return null
  const data = snap.data() as Record<string, unknown>
  if (data.status !== 'published') return null

  const result = { id: snap.id, ...serializeDoc(data) } as PlainLocation
  locationByIdCache.set(locationId, result)
  return result
}

export async function getPublicFieldSchema(): Promise<FieldSchema> {
  const cached = fieldSchemaCache.get()
  if (cached) return cached

  const snap = await getDoc(
    doc(getDb(), 'clients', CLIENT_ID, 'fieldSchema', 'default'),
  )
  const result: FieldSchema = snap.exists() ? (snap.data() as FieldSchema) : { fields: [] }
  fieldSchemaCache.set(result)
  return result
}

/**
 * Call this after an admin approves a location so the homepage reflects
 * the change immediately without waiting for the TTL to expire.
 */
export function invalidateLocationsCache(): void {
  locationsListCache.clear()
}
