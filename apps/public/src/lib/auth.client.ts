import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { getAuthInstance, getDb } from '@openbrolly/firebase'

export interface SignUpData {
  firstName: string
  surname: string
  email: string
  password: string
  phone: string
  company?: string
}

/**
 * Creates a Firebase Auth user and writes their profile document to Firestore.
 * The profile is global — the same user can sign in to any client's public site.
 */
export async function signUp(data: SignUpData): Promise<void> {
  const auth = getAuthInstance()
  const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password)

  await setDoc(doc(getDb(), 'users', user.uid), {
    firstName: data.firstName,
    surname: data.surname,
    email: data.email,
    phone: data.phone,
    company: data.company ?? '',
    // Hidden fields — set here for future Location Owner approval flow
    accountType: 'viewer',
    accountStatus: 'active',
    createdAt: serverTimestamp(),
  })
}

export async function signIn(email: string, password: string): Promise<void> {
  const auth = getAuthInstance()
  await signInWithEmailAndPassword(auth, email, password)
}

export async function signOut(): Promise<void> {
  const auth = getAuthInstance()
  await firebaseSignOut(auth)
}

/** Maps Firebase auth error codes to user-friendly messages. */
export function getAuthErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    switch ((err as { code: string }).code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password.'
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.'
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.'
      default:
        return 'Something went wrong. Please try again.'
    }
  }
  return 'Something went wrong. Please try again.'
}
