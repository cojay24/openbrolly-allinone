/**
 * Seed script — populates Firestore with demo data.
 *
 * Prerequisites:
 *   1. Copy .env.local.example → .env.local at the repo root and fill in:
 *        FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 *      OR set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON path.
 *   2. Run: pnpm seed
 */

import { randomUUID } from 'crypto'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import type { FieldDefinition } from '../packages/firebase/src/types.js'

// ─── Init ────────────────────────────────────────────────────────────────────

function initAdmin() {
  if (getApps().length) return

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (clientEmail && privateKey) {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
  } else {
    // Falls back to GOOGLE_APPLICATION_CREDENTIALS
    initializeApp()
  }
}

initAdmin()
const db = getFirestore()

// ─── Helpers ─────────────────────────────────────────────────────────────────

function now() {
  return Timestamp.now()
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return Timestamp.fromDate(d)
}

// ─── Seed data ───────────────────────────────────────────────────────────────

const CLIENT_ID = 'demo-client'

const CLIENT_DOC = {
  name: 'Demo Productions',
  brandConfig: {
    logo: 'https://placehold.co/200x60?text=Demo+Productions',
    primaryColor: '#1a1a2e',
    secondaryColor: '#e94560',
    fontFamily: 'Inter, sans-serif',
  },
}

const FIELD_SCHEMA: { fields: FieldDefinition[] } = {
  fields: [
    {
      id: randomUUID(),
      label: 'Title',
      type: 'text',
      options: [],
      showOnPublic: true,
      required: true,
      order: 0,
    },
    {
      id: randomUUID(),
      label: 'Description',
      type: 'textarea',
      options: [],
      showOnPublic: true,
      required: true,
      order: 1,
    },
    {
      id: randomUUID(),
      label: 'Categories',
      type: 'select',
      options: ['Industrial', 'Natural', 'Urban', 'Period', 'Contemporary', 'Rural'],
      showOnPublic: true,
      required: false,
      order: 2,
    },
    {
      id: randomUUID(),
      label: 'Accessibility',
      type: 'select',
      options: ['Full wheelchair access', 'Partial access', 'Limited access', 'No access'],
      showOnPublic: true,
      required: false,
      order: 3,
    },
  ],
}

const LOCATIONS = [
  {
    id: 'loc-warehouse-01',
    title: 'Riverside Warehouse District',
    description:
      'A sprawling 1920s industrial complex with exposed brick, steel trusses, and original factory floors. Perfect for gritty urban dramas, period films, and commercial shoots requiring raw, textured backdrops.',
    categories: ['Industrial', 'Period'],
    images: [
      'https://placehold.co/1200x800?text=Warehouse+Main',
      'https://placehold.co/1200x800?text=Warehouse+Detail',
    ],
    status: 'published' as const,
    accessibility: 'Partial access',
    createdAt: daysAgo(30),
    updatedAt: daysAgo(5),
  },
  {
    id: 'loc-cliffside-02',
    title: 'Cliffside National Reserve',
    description:
      'Dramatic coastal cliffs with 180° ocean views, sea caves accessible at low tide, and dense native bush. Ideal for adventure features, nature documentaries, and atmospheric thriller locations.',
    categories: ['Natural', 'Rural'],
    images: [
      'https://placehold.co/1200x800?text=Cliffside+Vista',
      'https://placehold.co/1200x800?text=Cliffside+Cave',
      'https://placehold.co/1200x800?text=Cliffside+Bush',
    ],
    status: 'published' as const,
    accessibility: 'Limited access',
    createdAt: daysAgo(20),
    updatedAt: daysAgo(2),
  },
  {
    id: 'loc-rooftop-03',
    title: 'Central District Rooftop Garden',
    description:
      'A contemporary rooftop terrace with city skyline views, lush greenery, and modular seating. Suits modern drama, fashion shoots, music videos, and corporate content requiring an aspirational urban feel.',
    categories: ['Urban', 'Contemporary'],
    images: [
      'https://placehold.co/1200x800?text=Rooftop+Day',
      'https://placehold.co/1200x800?text=Rooftop+Night',
    ],
    status: 'draft' as const,
    accessibility: 'Full wheelchair access',
    createdAt: daysAgo(7),
    updatedAt: daysAgo(1),
  },
]

// ─── Write ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱  Seeding Firestore...\n')

  // 1. Client document
  const clientRef = db.collection('clients').doc(CLIENT_ID)
  await clientRef.set(CLIENT_DOC)
  console.log(`✓ client: ${CLIENT_ID}`)

  // 2. Field schema (single document per client)
  await clientRef.collection('fieldSchema').doc('default').set(FIELD_SCHEMA)
  console.log(`✓ fieldSchema: clients/${CLIENT_ID}/fieldSchema/default`)

  // 3. Locations
  for (const { id, ...data } of LOCATIONS) {
    const locRef = clientRef.collection('locations').doc(id)
    await locRef.set(data)
    console.log(`✓ location:   clients/${CLIENT_ID}/locations/${id}  [${data.status}]`)
  }

  console.log('\n✅  Seed complete.')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
