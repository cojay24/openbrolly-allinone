'use client'

import { useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { getDb } from '@openbrolly/firebase'

const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID ?? 'demo-client'

/**
 * Runs client-side on every page load and applies the latest brand colours
 * from Firestore as CSS custom properties on <html>.
 *
 * Needed because the public site is a static export (output: 'export') —
 * brand config is baked in at build time and won't reflect Firestore changes
 * until the next redeploy. This component keeps colours live without a rebuild.
 */
export function BrandProvider() {
  useEffect(() => {
    async function applyBrand() {
      try {
        const snap = await getDoc(doc(getDb(), 'clients', CLIENT_ID))
        if (!snap.exists()) return
        const brand = (snap.data()?.brandConfig ?? {}) as Record<string, string>
        const root = document.documentElement
        if (brand.primaryColor)   root.style.setProperty('--brand-primary',   brand.primaryColor)
        if (brand.secondaryColor) root.style.setProperty('--brand-secondary', brand.secondaryColor)
        if (brand.fontFamily)     root.style.setProperty('--brand-font',      brand.fontFamily)
      } catch (err) {
        // Non-fatal — static build fallback colours remain in effect
        console.error('[BrandProvider] could not load brand config:', err)
      }
    }
    applyBrand()
  }, [])

  return null
}
