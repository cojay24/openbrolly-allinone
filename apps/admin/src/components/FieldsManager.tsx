'use client'

import { useState, useRef } from 'react'
import type { FieldDefinition, FieldSchema, FieldType } from '@openbrolly/firebase/types'
import { saveFieldSchema } from '@/lib/db.client'
import { AddFieldWizard } from './AddFieldWizard'

// ─── Display maps ────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<FieldType, string> = {
  text: 'Short text',
  textarea: 'Long text',
  boolean: 'Yes / No',
  select: 'Dropdown',
  number: 'Number',
}

const TYPE_COLORS: Record<FieldType, string> = {
  text: 'bg-blue-100 text-blue-700',
  textarea: 'bg-purple-100 text-purple-700',
  boolean: 'bg-green-100 text-green-700',
  select: 'bg-amber-100 text-amber-700',
  number: 'bg-rose-100 text-rose-700',
}

// ─── Toggle ──────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  label: string
}) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 w-9 h-5 rounded-full transition-colors focus-ring ${
          checked ? 'bg-indigo-600' : 'bg-gray-200'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </button>
      <span className="text-xs text-gray-500 hidden sm:block">{label}</span>
    </label>
  )
}

// ─── Toast ───────────────────────────────────────────────────────────────────

interface ToastState {
  msg: string
  type: 'success' | 'error'
}

// ─── Main component ──────────────────────────────────────────────────────────

interface Props {
  clientId: string
  initialSchema: FieldSchema
}

export function FieldsManager({ clientId, initialSchema }: Props) {
  const [fields, setFields] = useState<FieldDefinition[]>(
    [...(initialSchema.fields ?? [])].sort((a, b) => a.order - b.order),
  )
  const [wizardOpen, setWizardOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const dragIndex = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  function showToast(msg: string, type: ToastState['type'] = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function autoSave(nextFields: FieldDefinition[]) {
    setSaving(true)
    try {
      await saveFieldSchema(clientId, nextFields)
    } catch (err) {
      console.error('[FieldsManager] saveFieldSchema failed:', err)
      showToast('Failed to save. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  function updateField(id: string, changes: Partial<FieldDefinition>) {
    const updated = fields.map((f) => (f.id === id ? { ...f, ...changes } : f))
    setFields(updated)
    autoSave(updated)
  }

  async function handleDelete(id: string) {
    const field = fields.find((f) => f.id === id)!
    const confirmed = confirm(
      `Delete "${field.label}"?\n\nThis will hide existing data for this field. It will not be deleted from saved locations.`,
    )
    if (!confirmed) return
    const updated = fields.filter((f) => f.id !== id).map((f, i) => ({ ...f, order: i }))
    setFields(updated)
    await autoSave(updated)
    showToast(`"${field.label}" deleted`)
  }

  async function handleAddField(field: FieldDefinition) {
    const newFields = [...fields, { ...field, order: fields.length }]
    setFields(newFields)
    setWizardOpen(false)
    await autoSave(newFields)
    showToast(`"${field.label}" added`)
  }

  // ── Drag-to-reorder ──
  function onDragStart(i: number) {
    dragIndex.current = i
  }
  function onDragOver(e: React.DragEvent, i: number) {
    e.preventDefault()
    setDragOver(i)
  }
  function onDrop(i: number) {
    const from = dragIndex.current
    if (from === null || from === i) {
      setDragOver(null)
      return
    }
    const next = [...fields]
    const [moved] = next.splice(from, 1)
    next.splice(i, 0, moved)
    const reordered = next.map((f, idx) => ({ ...f, order: idx }))
    setFields(reordered)
    setDragOver(null)
    dragIndex.current = null
    autoSave(reordered)
  }

  const atLimit = fields.length >= 20

  return (
    <>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500 mt-1">
            {fields.length}/20 fields
            {saving && <span className="ml-2 text-indigo-500">Saving…</span>}
          </p>
        </div>
        <button
          onClick={() => setWizardOpen(true)}
          disabled={atLimit}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-ring"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add field
        </button>
      </div>

      {/* ── Context line ── */}
      <p className="text-sm text-gray-500 mb-5 bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
        These fields extend the location editor and can optionally be shown on the public site.
        Drag rows to reorder. Toggle changes auto-save.
      </p>

      {/* ── Empty state ── */}
      {fields.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 py-16 text-center text-gray-400">
          <svg
            className="w-10 h-10 mx-auto mb-3 opacity-40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="font-medium">No custom fields yet</p>
          <p className="text-sm mt-1">Click &ldquo;Add field&rdquo; to extend the location editor</p>
        </div>
      ) : (
        <div className="space-y-2" role="list" aria-label="Custom fields">
          {/* Column headers */}
          <div className="flex items-center gap-4 px-4 mb-1 text-xs font-medium text-gray-400 uppercase tracking-wide">
            <span className="w-4 flex-shrink-0" />
            <span className="flex-1">Label</span>
            <span className="w-20 text-center hidden xs:block">Type</span>
            <span className="w-24 text-center hidden sm:block">Public site</span>
            <span className="w-20 text-center hidden sm:block">Required</span>
            <span className="w-8" />
          </div>

          {fields.map((field, i) => (
            <div
              key={field.id}
              role="listitem"
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={(e) => onDragOver(e, i)}
              onDrop={() => onDrop(i)}
              onDragEnd={() => setDragOver(null)}
              className={`flex items-center gap-4 bg-white rounded-xl border px-4 py-3 transition-all ${
                dragOver === i
                  ? 'border-indigo-400 shadow-md scale-[1.01]'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Drag handle */}
              <div
                className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 flex-shrink-0"
                aria-hidden
              >
                <svg className="w-4 h-5" fill="currentColor" viewBox="0 0 16 20">
                  <circle cx="5" cy="4" r="1.5" />
                  <circle cx="5" cy="10" r="1.5" />
                  <circle cx="5" cy="16" r="1.5" />
                  <circle cx="11" cy="4" r="1.5" />
                  <circle cx="11" cy="10" r="1.5" />
                  <circle cx="11" cy="16" r="1.5" />
                </svg>
              </div>

              {/* Label */}
              <span className="flex-1 font-medium text-gray-900 text-sm truncate">{field.label}</span>

              {/* Type badge */}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                  TYPE_COLORS[field.type]
                }`}
              >
                {TYPE_LABELS[field.type]}
              </span>

              {/* Toggles */}
              <Toggle
                label="Public"
                checked={field.showOnPublic}
                onChange={(v) => updateField(field.id, { showOnPublic: v })}
                disabled={saving}
              />
              <Toggle
                label="Required"
                checked={field.required}
                onChange={(v) => updateField(field.id, { required: v })}
                disabled={saving}
              />

              {/* Delete */}
              <button
                onClick={() => handleDelete(field.id)}
                disabled={saving}
                className="flex-shrink-0 text-gray-300 hover:text-red-500 disabled:opacity-40 transition-colors focus-ring rounded"
                aria-label={`Delete ${field.label}`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {atLimit && (
        <p className="text-sm text-amber-700 mt-4 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-lg">
          Maximum of 20 custom fields reached. Delete a field to add another.
        </p>
      )}

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

      {/* ── Wizard ── */}
      {wizardOpen && (
        <AddFieldWizard
          existingFields={fields}
          onAdd={handleAddField}
          onClose={() => setWizardOpen(false)}
        />
      )}
    </>
  )
}
