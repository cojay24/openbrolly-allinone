'use client'

import { useState, useRef } from 'react'
import { useAdmin } from '@/context/AdminContext'
import { uploadLogo, saveBrandConfig } from '@/lib/db.client'

interface Props {
  initialLogo: string
  initialPrimaryColor: string
  initialSecondaryColor: string
}

interface ToastState {
  msg: string
  type: 'success' | 'error'
}

export function BrandEditor({ initialLogo, initialPrimaryColor, initialSecondaryColor }: Props) {
  const { clientId } = useAdmin()
  const [logo, setLogo] = useState(initialLogo)
  const [primaryColor, setPrimaryColor] = useState(initialPrimaryColor || '#4F46E5')
  const [secondaryColor, setSecondaryColor] = useState(initialSecondaryColor || '#818CF8')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function showToast(msg: string, type: ToastState['type'] = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  function handleHexInput(value: string, setter: (v: string) => void) {
    if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) setter(value)
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !clientId) return
    setUploading(true)
    try {
      const url = await uploadLogo(clientId, file)
      setLogo(url)
    } catch (err) {
      console.error('[BrandEditor] logo upload failed:', err)
      showToast('Logo upload failed. Please try again.', 'error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSave() {
    if (!clientId) return
    setSaving(true)
    try {
      await saveBrandConfig(clientId, { logo, primaryColor, secondaryColor })
      showToast('Brand settings saved.')
    } catch (err) {
      console.error('[BrandEditor] save failed:', err)
      showToast('Save failed. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Preview helpers ──
  const primary = primaryColor.length === 7 ? primaryColor : '#4F46E5'
  const secondary = secondaryColor.length === 7 ? secondaryColor : '#818CF8'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* ── Left: form ── */}
      <div className="space-y-5">

        {/* Logo */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Logo</h2>

          {logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt="Current logo"
              className="mb-4 h-12 w-auto max-w-[160px] object-contain rounded border border-gray-200 p-1.5 bg-gray-50"
            />
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={handleLogoChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors focus-ring"
          >
            {uploading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Uploading…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {logo ? 'Replace logo' : 'Upload logo'}
              </>
            )}
          </button>
          <p className="text-xs text-gray-400 mt-2">PNG, JPEG, SVG or WebP · max 2 MB. Uploads immediately on selection.</p>
        </div>

        {/* Colours */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Colours</h2>

          {/* Primary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary colour
              <span className="text-gray-400 font-normal ml-1.5 text-xs">— nav, buttons, headings</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primary}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-9 w-14 rounded border border-gray-300 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => handleHexInput(e.target.value, setPrimaryColor)}
                className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                maxLength={7}
                placeholder="#4F46E5"
              />
            </div>
          </div>

          {/* Secondary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secondary colour
              <span className="text-gray-400 font-normal ml-1.5 text-xs">— accents, highlights</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondary}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-9 w-14 rounded border border-gray-300 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => handleHexInput(e.target.value, setSecondaryColor)}
                className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                maxLength={7}
                placeholder="#818CF8"
              />
            </div>
          </div>
        </div>

        {/* Save */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || uploading}
          className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors focus-ring"
        >
          {saving ? 'Saving…' : 'Save brand settings'}
        </button>
      </div>

      {/* ── Right: live preview ── */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Live preview</h2>

          <div className="rounded-lg overflow-hidden border border-gray-200 text-xs">
            {/* Mock nav */}
            <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: primary }}>
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="Logo preview" className="h-6 w-auto max-w-[80px] object-contain" />
              ) : (
                <div className="h-5 w-20 rounded bg-white/30" />
              )}
              <div className="flex-1" />
              <div
                className="px-3 py-1 rounded-md text-white font-medium"
                style={{ backgroundColor: secondary }}
              >
                Enquire
              </div>
            </div>

            {/* Mock page body */}
            <div className="p-4 bg-gray-50 space-y-3">
              {/* Mock location card */}
              <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                {/* Image placeholder */}
                <div className="h-28 bg-gray-200 relative">
                  <div
                    className="absolute inset-x-0 bottom-0 h-1"
                    style={{ backgroundColor: primary }}
                  />
                </div>
                <div className="p-3 space-y-1.5">
                  <div className="h-4 w-3/4 rounded bg-gray-800" style={{ backgroundColor: primary, opacity: 0.85 }} />
                  <div className="h-2.5 w-full rounded bg-gray-200" />
                  <div className="h-2.5 w-2/3 rounded bg-gray-200" />
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex gap-1.5">
                      <div
                        className="h-5 w-14 rounded-full"
                        style={{ backgroundColor: `${primary}25` }}
                      />
                      <div
                        className="h-5 w-16 rounded-full"
                        style={{ backgroundColor: `${primary}25` }}
                      />
                    </div>
                    <div
                      className="h-7 w-20 rounded-lg flex items-center justify-center font-medium text-white"
                      style={{ backgroundColor: primary }}
                    >
                      View →
                    </div>
                  </div>
                </div>
              </div>

              {/* Second card (faded) */}
              <div className="bg-white rounded-lg overflow-hidden border border-gray-200 opacity-50">
                <div className="h-20 bg-gray-100" />
                <div className="p-3 space-y-1.5">
                  <div className="h-3.5 w-1/2 rounded bg-gray-300" />
                  <div className="h-2.5 w-full rounded bg-gray-200" />
                </div>
              </div>
            </div>

            {/* Mock footer strip */}
            <div
              className="px-4 py-2 text-white text-xs opacity-90"
              style={{ backgroundColor: secondary }}
            >
              Powered by Openbrolly Locations
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Changes to colours are reflected instantly. Click &ldquo;Save brand settings&rdquo; to persist.
          </p>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${
            toast.type === 'success' ? 'bg-gray-900' : 'bg-red-600'
          }`}
        >
          {toast.type === 'success' && (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
