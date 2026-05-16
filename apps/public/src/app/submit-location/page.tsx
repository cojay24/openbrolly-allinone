'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  getFieldSchema,
  generateLocationId,
  uploadLocationImage,
  submitLocation,
} from '@/lib/submit.client'
import type { FieldDefinition, FieldSchema } from '@openbrolly/firebase/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Spinner({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

// ─── Category tag input ───────────────────────────────────────────────────────

function CategoryInput({
  categories,
  onChange,
}: {
  categories: string[]
  onChange: (cats: string[]) => void
}) {
  const [input, setInput] = useState('')

  function add() {
    const val = input.trim()
    if (val && !categories.includes(val)) onChange([...categories, val])
    setInput('')
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() }
    if (e.key === 'Backspace' && !input && categories.length) {
      onChange(categories.slice(0, -1))
    }
  }

  function remove(cat: string) {
    onChange(categories.filter((c) => c !== cat))
  }

  return (
    <div className="rounded-lg border border-gray-300 px-3 py-2 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-[var(--brand-primary)] focus-within:border-transparent transition-colors min-h-[44px]">
      {categories.map((cat) => (
        <span
          key={cat}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          {cat}
          <button
            type="button"
            onClick={() => remove(cat)}
            className="hover:opacity-70 transition-opacity ml-0.5"
            aria-label={`Remove ${cat}`}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={add}
        placeholder={categories.length === 0 ? 'Type a category and press Enter…' : ''}
        className="flex-1 min-w-[160px] outline-none text-sm bg-transparent placeholder-gray-400"
      />
    </div>
  )
}

// ─── Image uploader ────────────────────────────────────────────────────────────

interface UploadingFile {
  file: File
  preview: string
  progress: number
  url: string | null
  error: string | null
}

function ImageUploader({
  locationId,
  images,
  onImagesChange,
}: {
  locationId: string
  images: string[]
  onImagesChange: (urls: string[]) => void
}) {
  const [uploading, setUploading] = useState<UploadingFile[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files) return
    const newFiles: UploadingFile[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        url: null,
        error: null,
      }))

    setUploading((prev) => [...prev, ...newFiles])

    for (const item of newFiles) {
      try {
        const url = await uploadLocationImage(locationId, item.file, (pct) => {
          setUploading((prev) =>
            prev.map((u) => u.preview === item.preview ? { ...u, progress: pct } : u)
          )
        })
        setUploading((prev) =>
          prev.map((u) => u.preview === item.preview ? { ...u, url, progress: 100 } : u)
        )
        onImagesChange([...images, url])
      } catch {
        setUploading((prev) =>
          prev.map((u) =>
            u.preview === item.preview ? { ...u, error: 'Upload failed' } : u
          )
        )
      }
    }
  }

  function removeUploaded(url: string) {
    onImagesChange(images.filter((u) => u !== url))
  }

  return (
    <div className="space-y-3">
      {/* Upload area */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-[var(--brand-primary)] transition-colors"
      >
        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm text-gray-500">
          <span className="font-semibold" style={{ color: 'var(--brand-primary)' }}>Click to upload</span>
          {' '}or drag and drop
        </p>
        <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP up to 10 MB each</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Image grid */}
      {(uploading.length > 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {uploading.map((item) => (
            <div key={item.preview} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.preview} alt="" className="w-full h-full object-cover" />
              {/* Progress overlay */}
              {item.progress < 100 && !item.error && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{item.progress}%</span>
                </div>
              )}
              {/* Error overlay */}
              {item.error && (
                <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center">
                  <span className="text-white text-xs text-center px-1">Failed</span>
                </div>
              )}
              {/* Remove button (once uploaded) */}
              {item.url && (
                <button
                  type="button"
                  onClick={() => removeUploaded(item.url!)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Custom field input ───────────────────────────────────────────────────────

function CustomFieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDefinition
  value: unknown
  onChange: (val: unknown) => void
}) {
  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent'

  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          rows={3}
          className={inputClass}
          placeholder={`Enter ${field.label.toLowerCase()}…`}
        />
      )
    case 'boolean':
      return (
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={(value as boolean) ?? false}
              onChange={(e) => onChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-6 rounded-full bg-gray-200 peer-checked:bg-[var(--brand-primary)] transition-colors" />
            <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
          </div>
          <span className="text-sm text-gray-700">{value ? 'Yes' : 'No'}</span>
        </label>
      )
    case 'select':
      return (
        <select
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className={inputClass}
        >
          <option value="">Select an option…</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )
    case 'number':
      return (
        <input
          type="number"
          value={(value as number) ?? ''}
          onChange={(e) => onChange(e.target.valueAsNumber)}
          required={field.required}
          className={inputClass}
          placeholder="0"
        />
      )
    default: // text
      return (
        <input
          type="text"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className={inputClass}
          placeholder={`Enter ${field.label.toLowerCase()}…`}
        />
      )
  }
}

// ─── Success screen ────────────────────────────────────────────────────────────

function SuccessScreen() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
        style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 12%, transparent)' }}
      >
        <svg className="w-8 h-8" style={{ color: 'var(--brand-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Location submitted!</h1>
      <p className="text-gray-500 mb-8">
        Your location has been submitted for review. We&apos;ll be in touch once it&apos;s been approved.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          Browse locations
        </Link>
        <Link
          href="/submit-location"
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Submit another
        </Link>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SubmitLocationPage() {
  const { user, userProfile } = useAuth()
  const router = useRouter()

  const [fieldSchema, setFieldSchema] = useState<FieldSchema | null>(null)
  const [schemaLoading, setSchemaLoading] = useState(true)

  // Form state
  const [locationId]                  = useState(() => generateLocationId())
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [categories, setCategories]   = useState<string[]>([])
  const [images, setImages]           = useState<string[]>([])
  const [customFields, setCustomFields] = useState<Record<string, unknown>>({})

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [error, setError]           = useState<string | null>(null)

  // Redirect non-location-owners
  useEffect(() => {
    if (!userProfile) return
    if (userProfile.accountType !== 'location-owner' || userProfile.accountStatus !== 'active') {
      router.replace('/')
    }
  }, [userProfile, router])

  // Load field schema
  useEffect(() => {
    getFieldSchema()
      .then(setFieldSchema)
      .catch(() => setFieldSchema({ fields: [] }))
      .finally(() => setSchemaLoading(false))
  }, [])

  function setCustomField(id: string, val: unknown) {
    setCustomFields((prev) => ({ ...prev, [id]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !userProfile) return
    setError(null)
    setSubmitting(true)
    try {
      await submitLocation(user.uid, userProfile, {
        title,
        description,
        categories,
        images,
        customFields,
      })
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) return <SuccessScreen />

  // While profile is loading or user is being redirected
  if (!userProfile || userProfile.accountType !== 'location-owner' || userProfile.accountStatus !== 'active') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner className="w-6 h-6 text-gray-400" />
      </div>
    )
  }

  const sortedFields = fieldSchema?.fields.slice().sort((a, b) => a.order - b.order) ?? []

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to locations
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Submit a Location</h1>
        <p className="text-gray-500 mt-2">
          Fill in the details below. Your submission will be reviewed before it appears on the site.
        </p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Location title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent"
            placeholder="e.g. Victorian Warehouse, East London"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent resize-none"
            placeholder="Describe the location — size, features, access, what makes it unique…"
          />
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Categories</label>
          <CategoryInput categories={categories} onChange={setCategories} />
          <p className="text-xs text-gray-400 mt-1.5">Press Enter or comma to add each category.</p>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Photos</label>
          <ImageUploader
            locationId={locationId}
            images={images}
            onImagesChange={setImages}
          />
        </div>

        {/* Custom fields */}
        {schemaLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Spinner className="w-4 h-4" />
            Loading additional fields…
          </div>
        ) : sortedFields.length > 0 ? (
          <div className="space-y-5 pt-2 border-t border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Additional Details</h2>
            {sortedFields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <CustomFieldInput
                  field={field}
                  value={customFields[field.id]}
                  onChange={(val) => setCustomField(field.id, val)}
                />
              </div>
            ))}
          </div>
        ) : null}

        {/* Submit */}
        <div className="pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            {submitting ? (
              <><Spinner className="w-4 h-4" /> Submitting…</>
            ) : (
              'Submit for approval'
            )}
          </button>
          <p className="text-xs text-gray-400 text-center mt-3">
            Your submission will be reviewed by our team before going live.
          </p>
        </div>
      </form>
    </div>
  )
}
