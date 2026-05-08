import { getPublishedLocations } from '@/lib/db.server'
import { LocationBrowser } from '@/components/LocationBrowser'

const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID ?? 'demo-client'

export default async function HomePage() {
  const locations = await getPublishedLocations(CLIENT_ID)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Browse Locations</h1>
        <p className="mt-2 text-gray-500">
          {locations.length} location{locations.length !== 1 ? 's' : ''} available
        </p>
      </div>
      <LocationBrowser locations={locations} />
    </div>
  )
}
