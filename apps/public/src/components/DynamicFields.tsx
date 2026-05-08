import type { PlainLocation } from '@/lib/db.server'
import type { FieldDefinition, FieldSchema } from '@openbrolly/firebase/types'

interface Props {
  location: PlainLocation
  fieldSchema: FieldSchema
}

// Core fields always rendered separately — skip them in the dynamic section
const CORE_KEYS = new Set(['title', 'description', 'categories', 'images', 'status', 'createdAt', 'updatedAt', 'id'])

/**
 * Maps a field label to the key used in the location document.
 * Convention: camelCase of the label words.
 * 'Accessibility' → 'accessibility'
 * 'Intended Dates' → 'intendedDates'
 */
function toFieldKey(label: string): string {
  return label
    .trim()
    .split(/\s+/)
    .map((word, i) =>
      i === 0
        ? word.charAt(0).toLowerCase() + word.slice(1)
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join('')
}

function renderValue(field: FieldDefinition, value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === '') return null

  if (field.type === 'boolean') {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}
      >
        {value ? 'Yes' : 'No'}
      </span>
    )
  }

  if (Array.isArray(value)) {
    return <span>{value.join(', ')}</span>
  }

  if (field.type === 'textarea') {
    return <p className="whitespace-pre-wrap">{String(value)}</p>
  }

  return <span>{String(value)}</span>
}

export function DynamicFields({ location, fieldSchema }: Props) {
  const visibleFields = fieldSchema.fields
    .filter((f) => f.showOnPublic)
    .filter((f) => !CORE_KEYS.has(toFieldKey(f.label)))
    .sort((a, b) => a.order - b.order)

  if (visibleFields.length === 0) return null

  const fieldsWithValues = visibleFields
    .map((f) => ({ field: f, key: toFieldKey(f.label), value: location[toFieldKey(f.label)] }))
    .filter(({ value }) => value !== null && value !== undefined && value !== '')

  if (fieldsWithValues.length === 0) return null

  return (
    <section aria-labelledby="details-heading" className="mb-8">
      <h2 id="details-heading" className="text-xl font-semibold text-gray-900 mb-4">
        Location Details
      </h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        {fieldsWithValues.map(({ field, value }) => (
          <div key={field.id}>
            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {field.label}
            </dt>
            <dd className="mt-1 text-sm text-gray-700">{renderValue(field, value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
