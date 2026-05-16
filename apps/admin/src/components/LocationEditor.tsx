'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { FieldDefinition, FieldSchema } from '@openbrolly/firebase/types'
import type { PlainLocation } from '@/lib/db.client'
import { saveLocation } from '@/lib/db.client'
import { DynamicFieldInputs, toFieldKey } from './DynamicFieldInputs'
import { ImageManager } from './ImageManager'

interface Props {
  clientId: string
  location: PlainLocation | null
  fieldSchema: FieldSchema
  isNew: boolean
}

const CORE_KEYS = new Set(['title', 'description', 'categories', 'images', 'status', 'createdAt', 'updatedAt', 'id'])

function extractDynamicValues(data: PlainLocation | null, fields: FieldDefinition[]): Record<string, unknown> {
  if (!data) return {}
  const out: Record<string, unknown> = {}
  for (const f of fields) {
    const key = toFieldKey(f.label)
    if (!CORE_KEYS.has(key) && key in data) out[key] = data[key]
  }
  return out
}

export function LocationEditor({ clientId, location, fieldSchema, isNew }: Props) {
  const router = useRouter()

  // Pre-generate a stable ID for new locations so ImageManager can upload
  // to the correct Storage path before the document is saved.
  const effectiveId = useMemo(
    () => (isNew ? crypto.randomUUID() : (location?.id as string)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [], // intentionally stable for the lifetime of this component instance
  )

  // ── Form state ──
  const [title, setTitle] = useState(location?.title ?? '')
  const [description, setDescription] = useState(location?.description ?? '')
  const rawStatus = location?.status
  const [status, setStatus] = useState<'draft' | 'published'>(
    rawStatus === 'published' ? 'published' : 'draft'
  )
  const [categories, setCategories] = useState(
    (location?.categories as string[] | undefined)?.join(', ') ?? '',
  )
  const [images, setImages] = useState<string[]>((location?.images as string[]) ?? [])
  const dynamicFields = fieldSchema.fields.filter((f) => !CORE_KEYS.has(toFieldKey(f.label)))
  const [dynamicValues, setDynamicValues] = useState<Record<string, unknown>>(
    extractDynamicValues(location, dynamicFields),
  )

  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  // Track unsaved changes
  useEffect(() => { setIsDirty(true) }, [title, description, status, categories, images, dynamicValues])
  useEffect(() => { setIsDirty(false) }, []) // reset on mount

  // Warn before page unload
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  function setDynamic(key: string, value: unknown) {
    setDynamicValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg(null)
    try {
      const parsedCategories = categories
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      const data = {
        title: title.trim(),
        description: description.trim(),
        status,
        categories: parsedCategories,
        images,
        ...dynamicValues,
      }

      const savedId = await saveLocation(clientId, effectiveId, data, isNew)
      setIsDirty(false)
      if (isNew) {
        router.push(`/dashboard/locations/${savedId}`)
      } else {
        setSaveMsg({ type: 'success', text: 'Saved successfully.' })
        setTimeout(() => setSaveMsg(null), 3000)
      }
    } catch (err) {
      console.error('[LocationEditor] save failed:', err)
      setSaveMsg({ type: 'error', text: 'Save failed. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    if (isDirty && !confirm('You have unsaved changes. Leave anyway?')) return
    router.push('/dashboard/locations')
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'

  return (
    <form onSubmit={handleSave} noValidate>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column: main fields ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Core fields */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Location details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Riverside Warehouse District"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the location for potential clients…"
                className={`${inputClass} resize-y`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categories
                <span className="text-gray-400 font-normal ml-1">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
                placeholder="Industrial, Urban, Contemporary"
                className={inputClass}
              />
            </div>
          </div>

          {/* Dynamic fields */}
          {dynamicFields.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Custom fields</h2>
              <DynamicFieldInputs
                fields={dynamicFields}
                values={dynamicValues}
                onChange={setDynamic}
              />
            </div>
          )}

          {/* Images */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Images</h2>
            <ImageManager
              images={images}
              clientId={clientId}
              locationId={effectiveId}
              onImagesChange={setImages}
            />
          </div>
        </div>

        {/* ── Right column: status + actions ── */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Status</h2>

            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              {(['draft', 'published'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-2 text-sm font-medium transition-colors capitalize ${
                    status === s
                      ? s === 'published'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {status === 'published' && (
              <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">
                This location is visible on the public site.
              </p>
            )}
            {status === 'draft' && (
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                This location is hidden from the public site.
              </p>
            )}
          </div>

          {/* Save / Cancel */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            {saveMsg && (
              <p
                role="status"
                className={`text-sm rounded-lg px-3 py-2 ${
                  saveMsg.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {saveMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors focus-ring"
            >
              {saving ? 'Saving…' : isNew ? 'Create location' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors focus-ring"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
