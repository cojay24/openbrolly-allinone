'use client'

import { useState } from 'react'
import type { FieldDefinition, FieldType } from '@openbrolly/firebase/types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  existingFields: FieldDefinition[]
  onAdd: (field: FieldDefinition) => void
  onClose: () => void
}

interface TypeCard {
  type: FieldType
  label: string
  description: string
  icon: React.ReactNode
}

// ─── Type cards ──────────────────────────────────────────────────────────────

const TYPE_CARDS: TypeCard[] = [
  {
    type: 'text',
    label: 'Short text',
    description: 'Single line of text, e.g. a URL, postcode, or name.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10" />
      </svg>
    ),
  },
  {
    type: 'textarea',
    label: 'Long text',
    description: 'Multi-line text area for notes or longer descriptions.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h10" />
      </svg>
    ),
  },
  {
    type: 'boolean',
    label: 'Yes / No',
    description: 'A simple on/off toggle, e.g. "Has parking".',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    type: 'select',
    label: 'Dropdown',
    description: 'Pick one option from a predefined list.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
      </svg>
    ),
  },
  {
    type: 'number',
    label: 'Number',
    description: 'A numeric value, e.g. capacity, price, or square footage.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
      </svg>
    ),
  },
]

const TYPE_LABELS: Record<FieldType, string> = {
  text: 'Short text',
  textarea: 'Long text',
  boolean: 'Yes / No',
  select: 'Dropdown',
  number: 'Number',
}

// ─── Live preview ─────────────────────────────────────────────────────────────

function FieldPreview({ type, label }: { type: FieldType; label: string }) {
  const displayLabel = label.trim() || 'Field label'
  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-400 bg-gray-50 pointer-events-none select-none'

  return (
    <div className="pointer-events-none select-none">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{displayLabel}</label>
      {type === 'text' && (
        <div className={inputClass}>Short text…</div>
      )}
      {type === 'textarea' && (
        <div className={`${inputClass} h-20`}>Long text…</div>
      )}
      {type === 'boolean' && (
        <div className="flex items-center gap-2">
          <div className="w-9 h-5 rounded-full bg-gray-200 relative flex-shrink-0">
            <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm" />
          </div>
          <span className="text-sm text-gray-400">No</span>
        </div>
      )}
      {type === 'select' && (
        <div className={`${inputClass} flex items-center justify-between`}>
          <span>Choose an option…</span>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )}
      {type === 'number' && (
        <div className={inputClass}>0</div>
      )}
    </div>
  )
}

// ─── Wizard ───────────────────────────────────────────────────────────────────

export function AddFieldWizard({ existingFields, onAdd, onClose }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedType, setSelectedType] = useState<FieldType | null>(null)
  const [label, setLabel] = useState('')
  const [required, setRequired] = useState(false)
  const [showOnPublic, setShowOnPublic] = useState(false)
  const [optionsRaw, setOptionsRaw] = useState('') // comma-separated for select type

  // ── Validation ──
  const labelTrimmed = label.trim()
  const existingLabels = new Set(existingFields.map((f) => f.label.toLowerCase()))
  const labelError =
    labelTrimmed.length === 0
      ? 'Label is required.'
      : existingLabels.has(labelTrimmed.toLowerCase())
      ? 'A field with this label already exists.'
      : labelTrimmed.length > 60
      ? 'Label must be 60 characters or fewer.'
      : null

  const parsedOptions = optionsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const optionsError =
    selectedType === 'select' && parsedOptions.length < 2
      ? 'Add at least 2 options.'
      : null

  const step2Valid = !labelError && (selectedType !== 'select' || !optionsError)

  function handleAdd() {
    if (!selectedType || !step2Valid) return
    const field: FieldDefinition = {
      id: crypto.randomUUID(),
      type: selectedType,
      label: labelTrimmed,
      required,
      showOnPublic,
      order: existingFields.length,
      options: selectedType === 'select' ? parsedOptions : [],
    }
    onAdd(field)
  }

  // ── Step summaries ──
  function stepSummary() {
    if (!selectedType) return ''
    const parts: string[] = [
      `A ${TYPE_LABELS[selectedType].toLowerCase()} field labelled "${labelTrimmed}".`,
    ]
    if (required) parts.push('It will be required when editing a location.')
    if (showOnPublic) parts.push('It will be shown on the public site.')
    if (selectedType === 'select') parts.push(`Options: ${parsedOptions.join(', ')}.`)
    return parts.join(' ')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Add custom field</h2>
            <p className="text-xs text-gray-400 mt-0.5">Step {step} of 3</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors focus-ring rounded"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex-1 overflow-y-auto">

          {/* ── Step 1: Choose type ── */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">What kind of field do you want to add?</p>
              {TYPE_CARDS.map((card) => (
                <button
                  key={card.type}
                  type="button"
                  onClick={() => setSelectedType(card.type)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all focus-ring ${
                    selectedType === card.type
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedType === card.type ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {card.icon}
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${selectedType === card.type ? 'text-indigo-700' : 'text-gray-900'}`}>
                      {card.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{card.description}</div>
                  </div>
                  {selectedType === card.type && (
                    <svg className="w-5 h-5 text-indigo-600 ml-auto flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* ── Step 2: Configure ── */}
          {step === 2 && selectedType && (
            <div className="space-y-5">
              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Field label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={`e.g. ${selectedType === 'boolean' ? 'Has parking' : selectedType === 'select' ? 'Venue type' : selectedType === 'number' ? 'Capacity' : 'Additional notes'}`}
                  maxLength={60}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
                {labelError && labelTrimmed.length > 0 && (
                  <p className="text-xs text-red-600 mt-1">{labelError}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{labelTrimmed.length}/60</p>
              </div>

              {/* Options (select only) */}
              {selectedType === 'select' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Options <span className="text-red-500">*</span>
                    <span className="text-gray-400 font-normal ml-1">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={optionsRaw}
                    onChange={(e) => setOptionsRaw(e.target.value)}
                    placeholder="Studio, Warehouse, Exterior, Rooftop"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {optionsError && parsedOptions.length > 0 && (
                    <p className="text-xs text-red-600 mt-1">{optionsError}</p>
                  )}
                  {parsedOptions.length >= 2 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {parsedOptions.map((opt) => (
                        <span key={opt} className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Toggles */}
              <div className="space-y-3">
                <label className="flex items-center justify-between gap-4 cursor-pointer select-none">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Required</span>
                    <p className="text-xs text-gray-400">Location cannot be saved without a value.</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={required}
                    onClick={() => setRequired((v) => !v)}
                    className={`relative flex-shrink-0 w-9 h-5 rounded-full transition-colors focus-ring ${required ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${required ? 'translate-x-4' : ''}`} />
                  </button>
                </label>

                <label className="flex items-center justify-between gap-4 cursor-pointer select-none">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Show on public site</span>
                    <p className="text-xs text-gray-400">Visitors will see this field on the location page.</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showOnPublic}
                    onClick={() => setShowOnPublic((v) => !v)}
                    className={`relative flex-shrink-0 w-9 h-5 rounded-full transition-colors focus-ring ${showOnPublic ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${showOnPublic ? 'translate-x-4' : ''}`} />
                  </button>
                </label>
              </div>

              {/* Live preview */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Preview</p>
                <FieldPreview type={selectedType} label={labelTrimmed} />
              </div>
            </div>
          )}

          {/* ── Step 3: Confirm ── */}
          {step === 3 && selectedType && (
            <div className="space-y-5">
              <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-5 py-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-indigo-800">{stepSummary()}</p>
                </div>
              </div>

              {/* Summary table */}
              <dl className="space-y-3">
                {[
                  { label: 'Type', value: TYPE_LABELS[selectedType] },
                  { label: 'Label', value: labelTrimmed },
                  { label: 'Required', value: required ? 'Yes' : 'No' },
                  { label: 'Show on public site', value: showOnPublic ? 'Yes' : 'No' },
                  ...(selectedType === 'select' ? [{ label: 'Options', value: parsedOptions.join(', ') }] : []),
                ].map((row) => (
                  <div key={row.label} className="flex items-baseline gap-2 text-sm">
                    <dt className="w-36 flex-shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-400">{row.label}</dt>
                    <dd className="text-gray-900">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (step === 1) onClose()
              else setStep((s) => (s - 1) as 1 | 2 | 3)
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors focus-ring"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 3 ? (
            <button
              type="button"
              disabled={step === 1 ? !selectedType : !step2Valid}
              onClick={() => setStep((s) => (s + 1) as 2 | 3)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-ring"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors focus-ring"
            >
              Add field
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
