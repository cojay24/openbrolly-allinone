import { LocationsLoader } from '@/components/LocationsLoader'

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Browse Locations</h1>
      </div>
      <LocationsLoader />
    </div>
  )
}
