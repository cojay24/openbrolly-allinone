'use client'

import { useState } from 'react'
import { signIn, signUp, getAuthErrorMessage } from '@/lib/auth.client'

type View = 'login' | 'signup'

export function AuthModal() {
  const [view, setView] = useState<View>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Login state ────────────────────────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // ── Signup state ───────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState('')
  const [surname, setSurname] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  function switchView(v: View) {
    setView(v)
    setError(null)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(loginEmail, loginPassword)
      // AuthContext listener updates automatically — modal disappears via AuthGate
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await signUp({
        firstName,
        surname,
        email: signupEmail,
        password: signupPassword,
        phone,
        company,
      })
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent transition-colors'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Non-dismissable backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6" style={{ backgroundColor: 'var(--brand-primary)' }}>
          <h1 className="text-2xl font-bold text-white">
            {view === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-white/75 text-sm mt-1">
            {view === 'login'
              ? 'Sign in to browse and save locations'
              : 'Sign up to browse and save locations to your projects'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {(['login', 'signup'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => switchView(v)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                view === v ? 'bg-white' : 'text-gray-500 hover:text-gray-700'
              }`}
              style={
                view === v
                  ? { color: 'var(--brand-primary)', borderBottom: '2px solid var(--brand-primary)' }
                  : {}
              }
            >
              {v === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        {/* Form area */}
        <div className="px-8 py-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* ── Login ── */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90 mt-2"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
              <p className="text-center text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchView('signup')}
                  className="font-semibold hover:underline"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  Create one
                </button>
              </p>
            </form>
          )}

          {/* ── Signup ── */}
          {view === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                  <input
                    type="text"
                    required
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inputClass}
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Surname</label>
                  <input
                    type="text"
                    required
                    autoComplete="family-name"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    className={inputClass}
                    placeholder="Smith"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                <input
                  type="tel"
                  required
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  placeholder="+44 7700 900000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company / Organisation{' '}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  autoComplete="organization"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={inputClass}
                  placeholder="Acme Productions"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Min. 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm password
                </label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90 mt-1"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>

              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="font-semibold hover:underline"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
