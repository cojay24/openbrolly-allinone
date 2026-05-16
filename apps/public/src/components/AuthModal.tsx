'use client'

import { useState } from 'react'
import { signIn, signUp, getAuthErrorMessage } from '@/lib/auth.client'

type View = 'login' | 'signup'

export function AuthModal() {
  const [view, setView] = useState<View>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Login state ─────────────────────────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // ── Signup state ────────────────────────────────────────────────────────────
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
    'w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors'

  const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Non-dismissable backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative bg-white w-full max-w-md overflow-hidden shadow-2xl" style={{ borderRadius: '2px' }}>

        {/* ── Header ── */}
        <div
          className="relative px-8 pt-10 pb-8 overflow-hidden"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          {/* Decorative grid */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

          {/* Gold accent line */}
          <div className="relative">
            <div className="h-px w-8 mb-5" style={{ backgroundColor: 'var(--brand-secondary)' }} />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--brand-secondary)' }}>
              {view === 'login' ? 'Member access' : 'Join Openbrolly'}
            </p>
            <h1 className="font-display text-3xl font-semibold text-white leading-tight">
              {view === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-white/50 text-sm mt-2">
              {view === 'login'
                ? 'Sign in to browse and save locations'
                : 'Join our community of location hunters and owners'}
            </p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-stone-100">
          {(['login', 'signup'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => switchView(v)}
              className="flex-1 py-3.5 text-xs font-semibold uppercase tracking-widest transition-colors"
              style={
                view === v
                  ? { color: 'var(--brand-primary)', borderBottom: '2px solid var(--brand-primary)', marginBottom: '-1px' }
                  : { color: '#9ca3af' }
              }
            >
              {v === 'login' ? 'Sign in' : 'Register'}
            </button>
          ))}
        </div>

        {/* ── Form area ── */}
        <div className="px-8 py-7 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="mb-5 px-4 py-3 rounded bg-red-50 border border-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* ── Login form ── */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className={labelClass}>Email address</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={inputClass}
                  style={{ '--tw-ring-color': 'var(--brand-secondary)' } as React.CSSProperties}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className={inputClass}
                  style={{ '--tw-ring-color': 'var(--brand-secondary)' } as React.CSSProperties}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--brand-primary)', borderRadius: '2px' }}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>

              <p className="text-center text-sm text-gray-400">
                New here?{' '}
                <button
                  type="button"
                  onClick={() => switchView('signup')}
                  className="font-semibold hover:underline"
                  style={{ color: 'var(--brand-secondary)' }}
                >
                  Create a free account
                </button>
              </p>
            </form>
          )}

          {/* ── Signup form ── */}
          {view === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>First name</label>
                  <input
                    type="text"
                    required
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inputClass}
                    style={{ '--tw-ring-color': 'var(--brand-secondary)' } as React.CSSProperties}
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label className={labelClass}>Surname</label>
                  <input
                    type="text"
                    required
                    autoComplete="family-name"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    className={inputClass}
                    style={{ '--tw-ring-color': 'var(--brand-secondary)' } as React.CSSProperties}
                    placeholder="Smith"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Email address</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className={inputClass}
                  style={{ '--tw-ring-color': 'var(--brand-secondary)' } as React.CSSProperties}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className={labelClass}>Phone number</label>
                <input
                  type="tel"
                  required
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  style={{ '--tw-ring-color': 'var(--brand-secondary)' } as React.CSSProperties}
                  placeholder="+44 7700 900000"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Company / Organisation{' '}
                  <span className="normal-case text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  autoComplete="organization"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={inputClass}
                  style={{ '--tw-ring-color': 'var(--brand-secondary)' } as React.CSSProperties}
                  placeholder="Acme Productions"
                />
              </div>

              <div>
                <label className={labelClass}>Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className={inputClass}
                  style={{ '--tw-ring-color': 'var(--brand-secondary)' } as React.CSSProperties}
                  placeholder="Min. 6 characters"
                />
              </div>

              <div>
                <label className={labelClass}>Confirm password</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  style={{ '--tw-ring-color': 'var(--brand-secondary)' } as React.CSSProperties}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--brand-primary)', borderRadius: '2px' }}
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>

              <p className="text-center text-sm text-gray-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="font-semibold hover:underline"
                  style={{ color: 'var(--brand-secondary)' }}
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
