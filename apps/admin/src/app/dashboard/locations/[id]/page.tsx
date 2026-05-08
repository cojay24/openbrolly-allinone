import { EditLocationPageClient } from './EditLocationPageClient'

export function generateStaticParams() {
  // Return a placeholder so Next.js accepts the dynamic route for static export.
  // Firebase's SPA rewrite (/dashboard/** → /dashboard/index.html) handles
  // real URL navigation; the client component fetches the actual location data.
  return [{ id: '_' }]
}

export default function EditLocationPage({ params }: { params: { id: string } }) {
  return <EditLocationPageClient id={params.id} />
}
