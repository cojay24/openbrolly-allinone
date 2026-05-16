/**
 * Lightweight in-memory TTL cache.
 *
 * Lives at module scope so it survives React re-renders and component
 * unmounts within the same browser tab session. Much faster than IndexedDB
 * and prevents redundant reads even before Firestore's offline cache kicks in.
 *
 * Usage:
 *   const myCache = createTTLCache<MyType>(5 * 60 * 1000) // 5 min
 *   const cached = myCache.get()
 *   if (cached) return cached
 *   const fresh = await fetchFromFirestore()
 *   myCache.set(fresh)
 *   return fresh
 */

export interface TTLCache<T> {
  get(): T | null
  set(value: T): void
  clear(): void
}

export function createTTLCache<T>(ttlMs: number): TTLCache<T> {
  let value: T | null = null
  let expiresAt = 0

  return {
    get(): T | null {
      return Date.now() < expiresAt ? value : null
    },
    set(v: T): void {
      value = v
      expiresAt = Date.now() + ttlMs
    },
    clear(): void {
      value = null
      expiresAt = 0
    },
  }
}

/** Keyed cache — like createTTLCache but indexed by a string key (e.g. locationId). */
export function createKeyedTTLCache<T>(ttlMs: number) {
  const map = new Map<string, { value: T; expiresAt: number }>()

  return {
    get(key: string): T | null {
      const entry = map.get(key)
      if (entry && Date.now() < entry.expiresAt) return entry.value
      return null
    },
    set(key: string, value: T): void {
      map.set(key, { value, expiresAt: Date.now() + ttlMs })
    },
    clear(key?: string): void {
      if (key) map.delete(key)
      else map.clear()
    },
  }
}
