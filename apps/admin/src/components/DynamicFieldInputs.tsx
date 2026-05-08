'use client'

import type { FieldDefinition } from '@openbrolly/firebase/types'

interface Props {
  fields: FieldDefinition[]
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}

/** Converts a field label to the camelCase key used in location documents. */
export function toFieldKey(label: string): string {
  return label
    .trim()
    .split(/\s+/)
    .map((w, i) =>
      i === 0
        ? w.charAt(0).toLowerCase() + w.slice(1)
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join('')
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'

export function DynamicFieldInputs({ fields, values, onChange }: Props) {
  const sorted = [...fields].sort((a, b) => a.order - b.order)

  if (sorted.length === 0) return null

  return (
    <div className="space-y-4">
      {sorted.map((field) => {
        const key = toFieldKey(field.label)
        const value = values[key]

        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.type === 'text' && (
              <input
                type="text"
                value={(value as string) ?? ''}
                onChange={(e) => onChange(key, e.target.value)}
                required={field.required}
                className={inputClass}
              />
            )}

            {field.type === 'textarea' && (
              <textarea
                rows={3}
                value={(value as string) ?? ''}
                onChange={(e) => onChange(key, e.target.value)}
                required={field.required}
                className={`${inputClass} resize-y`}
              />
            )}

            {field.type === 'number' && (
              <input
                type="number"
                value={(value as number) ?? ''}
                onChange={(e) => onChange(key, e.target.valueAsNumber)}
                required={field.required}
                className={inputClass}
              />
            )}

            {field.type === 'select' && (
              <select
                value={(value as string) ?? ''}
                onChange={(e) => onChange(key, e.target.value)}
                required={field.required}
                className={inputClass}
              >
                <option value="">— Select —</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}

            {field.type === 'boolean' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!value}
                  onChange={(e) => onChange(key, e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-600">{field.label}</span>
              </label>
            )}
          </div>
        )
      })}
    </div>
  )
}
