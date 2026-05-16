/**
 * Seed script — deletes all existing locations and creates 6 demo locations.
 * Run from the repo root: node scripts/seed-locations.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const CLIENT_ID = 'demo-client'

const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDmXt1HGAoofDak
dtqgRPcd2hHeK+BZR3e+JXmC8VNfLQQU7r5AZOpJWdnSMjXLqTsKvV5gty5SiXNu
i76Z1kgyxCrgNiefmHTr2Ke3v0M6Lv+tTrcqKo1P5DxaQb8zp/jZQ9fx9DJ+BvMU
Likdxlqi+1jqmuduFiAGX+KJENkpwsyWsvmIQGuZoY1h/iZSpmrtx5Cyy0JasEQF
K7Hvfc1pYjJvluf5urjOg7ljescvGzPNUQFvSO1FKXO6oj2sl0MSM3el0YJYSX5D
aZvAYlXsd7KBRyJXGeLINtxhu12kgddYEWtfhCStmV62CwxQir4ZeCThaq31sNsb
C3SX/aE5AgMBAAECggEABP59/A5SnA2TTq3v7+UG2WwSkpcvaigRObtMvtC1/rx2
V/DUCYfWh2gN/49MmMFusP0peF3IQIxPxw/6/hFF5+nWRx2NbtmKgVllS2e3UKHX
s51e/ahF/3sibs95kmhcDfO5UPq7BH3ok6GrjQRxjxJ1W0Kn7TxIDfNSsSd/Gbdf
mJurh2qK1zfan9J1LQ+rrDbUCDRXEUcD8xqEmlJNpbGVdzNJc7RmHjsdnJl7TLYJ
ufSSYiT6UoeS78sdM27ix9ixf55t4u/4zED53IGyfVRmO8dHkreJzDBkrGCWT74d
i7EQzUuU1yNuzNPpyH49yDze8lRbmxaV+x36TiEi4QKBgQD65llzJFYe5kPEr7Dc
Xys2xCwoAKkqcJgvUVVrwSPqRasD+ls+PjQk81iMwp7w+TiTUjqKvSjWwfLtzBfN
oLjGBi6l8vrFvm9RVEGfzRyhbeeJBBhFt+TdCqq8oZL6AqOat++MoNk+yjEv9Uv5
nwS3Hc7IeLHFdwo3EXutI4zkKQKBgQDrDa70J0UFtIwqU2s+xrAAVamZbi5MDqgw
bgVEALDVOHxG3fdMwf6GDGhUueNJoVnJVtyQECmk0ELqxSI+7+EnGeXa4Hvr+BH9
r0aYWvWF0jwX+pcr55O1M312r9lX5+I9M2orzLK2MHpB5VSyq8DO/m1H1OocWmYf
HPvzOIn2kQKBgGU8xSMcqlNVfkrCyY5iKEG07kxF1/xz6jRNkTYlfKRu8A5u2ppG
5ytxtW02qoN5TEbFizGoGe5t2+Pv0jr6exQMMo5reJyJtskOQlyEmuTYP/CdYl3f
Uc2PHE14tKGEpxcq2NHZpU8crrQ3OizC6VgqAuIJMVIIMmr99vVpvtPhAoGBAOLG
j931KS2I9JY9Z0HotZONEhT6bWZp2bDn5OKn+/OrDJPewSJoI+U2gU4FDhlSt2p+
CExhm5vsZjNVQGYST1rHLLFQVZ7i9pCXk3eYgjq7C8litojgYuy2obxpijq6eNbt
DOj3FBCckseSt3WuKVZLuClObRQvz0kDUL1m9gxRAoGAdXP6DPAuelqKe6pCcZbh
zlZfc/5hbUhQ6raP/H/DHqXGK6Ef2M2P8LX/UUUK/0QDqN3jFXyWE/qm4v4nlsmD
QX3Gk0WPhxYUO2oGn8jjTBvjMBx6C7S1LIz3sDinZBDzOU5jXz075k6XDkuf3T5G
SCOUviw4mbrlNyggIz6l1ao=
-----END PRIVATE KEY-----`

initializeApp({
  credential: cert({
    projectId: 'openbrolly-core',
    clientEmail: 'firebase-adminsdk-fbsvc@openbrolly-core.iam.gserviceaccount.com',
    privateKey: PRIVATE_KEY,
  }),
})

const db = getFirestore()

// ─── Demo locations ───────────────────────────────────────────────────────────

const img = (id, params = 'w=1400&q=85&auto=format&fit=crop') =>
  `https://images.unsplash.com/photo-${id}?${params}`

const LOCATIONS = [
  {
    title: 'The Glasshouse Rooftop',
    description:
      'A stunning contemporary rooftop terrace perched 22 storeys above the city, enclosed by a dramatic glass canopy. The 4,000 sq ft space offers 360° panoramic views of the skyline, making it one of the most sought-after locations for high-end commercials, fashion editorials, and architectural photography. The retractable roof panels allow full open-air shoots during the day and intimate enclosed sets after dark.',
    categories: ['Rooftop', 'Urban', 'Contemporary', 'Outdoor'],
    images: [
      img('1477959858617-67f85cf4f1df'),
      img('1534430480872-3498386e7856'),
      img('1549488799-5a3d12f5c38f'),
    ],
    status: 'published',
  },
  {
    title: 'Meridian Victorian Warehouse',
    description:
      'A meticulously preserved Grade II-listed Victorian warehouse spanning 12,000 sq ft across two floors. Original cast-iron columns, exposed brick, and period timber flooring create an authentic industrial atmosphere that has featured in over 40 productions. The building retains its working goods lift and loading bay, adding further visual authenticity. Extensive natural light floods the space through original north-facing skylights.',
    categories: ['Industrial', 'Period', 'Indoor', 'Warehouse'],
    images: [
      img('1558618666-fcd25c85cd64'),
      img('1504307651254-35680f356dfd'),
      img('1560518883-ce09059eeffa'),
    ],
    status: 'published',
  },
  {
    title: 'Kestrel Point Sea Cliffs',
    description:
      'Dramatic 80-metre coastal cliffs stretching over a kilometre of unspoilt coastline on the west-facing headland. The location offers exceptional golden-hour and blue-hour light for stills and motion work. A network of maintained paths provides safe crew access to multiple vantage points, including a natural rock arch framing the open ocean. The adjacent grassland plateau provides excellent base camp facilities and vehicle access.',
    categories: ['Coastal', 'Outdoor', 'Scenic', 'Natural'],
    images: [
      img('1507525428034-b723cf961d3e'),
      img('1469474968028-56623f02e42e'),
      img('1520250497591-112f2f40a3f4'),
    ],
    status: 'published',
  },
  {
    title: 'Elara Modernist Atrium',
    description:
      'The award-winning central atrium of a landmark 1970s modernist building, recently restored to its original specification. A 30-metre vaulted ceiling of white reinforced concrete rises above a polished terrazzo floor, creating a stark, architectural canvas of near-limitless versatility. The space has hosted everything from automotive reveals to couture runway shows. Blackout capability, a 3-phase power supply, and on-site parking for 60 vehicles.',
    categories: ['Architecture', 'Contemporary', 'Indoor', 'Exhibition'],
    images: [
      img('1497366216548-37526070297c'),
      img('1486325212027-8081e485255e'),
      img('1564069114553-7215e1ff1890'),
    ],
    status: 'published',
  },
  {
    title: 'Thornwood Ancient Clearing',
    description:
      'A secluded 2-acre clearing at the heart of a working ancient woodland, surrounded by oak and beech estimated to be over 400 years old. The dappled, diffused light filtering through the forest canopy creates a naturally cinematic quality throughout the day. The clearing features a moss-covered stone ruin, a seasonal stream, and an undisturbed wildflower meadow. Generator-free lighting solutions are available and the site is wheelchair accessible via a compacted gravel path.',
    categories: ['Forest', 'Natural', 'Outdoor', 'Rural'],
    images: [
      img('1448375240586-882707db888b'),
      img('1441974231531-c6227db76b6e'),
      img('1542273917363-3b1817f69a2d'),
    ],
    status: 'published',
  },
  {
    title: 'The Cavendish Ballroom',
    description:
      'An opulent Art Deco ballroom within a 1930s grand hotel, fully restored with original gilded plasterwork, Murano glass chandeliers, and a sprung maple dance floor. At 8,500 sq ft with a 14-metre ceiling height, the ballroom can accommodate large crew and equipment with ease. The adjoining mezzanine gallery provides a perfect elevated angle for wide establishing shots. Exclusive hire includes use of the hotel\'s original dressing rooms and private bar.',
    categories: ['Period', 'Indoor', 'Luxury', 'Architecture'],
    images: [
      img('1519167758481-83f550bb49b3'),
      img('1478147427282-58a87a433b2a'),
      img('1560185127-6ed189bf02f4'),
    ],
    status: 'published',
  },
]

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  const col = db.collection('clients').doc(CLIENT_ID).collection('locations')

  // 1. Delete all existing locations
  console.log('Deleting existing locations…')
  const existing = await col.get()
  const deleteOps = existing.docs.map((d) => d.ref.delete())
  await Promise.all(deleteOps)
  console.log(`  Deleted ${existing.size} document(s).`)

  // 2. Create 6 demo locations with staggered timestamps
  console.log('Creating demo locations…')
  const now = Date.now()

  for (let i = 0; i < LOCATIONS.length; i++) {
    const loc = LOCATIONS[i]
    // Stagger created dates so they sort naturally (newest first)
    const createdAt = new Date(now - i * 7 * 24 * 60 * 60 * 1000) // each 1 week apart

    const ref = col.doc()
    await ref.set({
      ...loc,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      // Override with staggered date for nice ordering
      createdAt: createdAt,
      updatedAt: createdAt,
    })
    console.log(`  ✓ Created "${loc.title}" (${ref.id})`)
  }

  console.log('\nDone! 6 demo locations created.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
