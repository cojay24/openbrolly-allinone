// Session cookie API removed — auth is now handled entirely client-side
// via Firebase Auth persistence (onAuthStateChanged + localStorage).
export async function GET() {
  return Response.json({ message: 'Session management moved to client-side Firebase Auth.' }, { status: 410 })
}
