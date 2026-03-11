'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Usernames blocked because they collide with app routes or are sensitive
const RESERVED_USERNAMES = new Set([
  'admin', 'api', 'auth', 'login', 'logout', 'signup', 'settings',
  'onboarding', 'about', 'me', 'www', 'support', 'help', 'legal',
  'privacy', 'terms', 'home', 'dashboard', 'profile', 'user', 'users',
  'post', 'posts', 'feed', 'explore', 'search', 'notifications',
])

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,30}$/

export default function OnboardingPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [checking, setChecking] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [usernameOk, setUsernameOk] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounced username availability check
  useEffect(() => {
    if (!username) {
      setUsernameError(null)
      setUsernameOk(false)
      return
    }

    if (!USERNAME_RE.test(username)) {
      setUsernameError('3–30 characters. Letters, numbers, _ and - only.')
      setUsernameOk(false)
      return
    }

    if (RESERVED_USERNAMES.has(username.toLowerCase())) {
      setUsernameError('That username is reserved.')
      setUsernameOk(false)
      return
    }

    setUsernameError(null)
    setChecking(true)
    setUsernameOk(false)

    const timer = setTimeout(async () => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any
      const { data } = await db
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .maybeSingle()

      setChecking(false)
      if (data) {
        setUsernameError('That username is taken.')
      } else {
        setUsernameOk(true)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [username])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usernameOk || saving) return

    setSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Update profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any
      const { error: updateError } = await db
        .from('profiles')
        .update({
          username: username.toLowerCase(),
          display_name: displayName.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        setError(updateError.message)
        return
      }

      // Mark onboarding complete in user metadata
      await supabase.auth.updateUser({
        data: { onboarding_complete: true },
      })

      router.push(`/${username.toLowerCase()}?welcome=1`)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full px-4 py-2.5 border-3 border-ink bg-white font-mono text-[0.88rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow'
  const labelClass = 'block font-head font-bold text-[0.78rem] uppercase mb-2'

  return (
    <main className="min-h-[calc(100vh-120px)] flex items-center justify-center px-6">
      <div
        className="w-full max-w-md border-3 border-ink bg-bg p-10"
        style={{ boxShadow: '6px 6px 0 var(--ink)' }}
      >
        <div className="text-3xl mb-4">🧭</div>
        <h1 className="font-head font-[900] text-[2rem] uppercase leading-tight mb-1">
          Pick your username
        </h1>
        <p className="font-mono text-[0.78rem] opacity-60 mb-8">
          This is your permanent URL on SideQuest.me
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className={labelClass}>
              Username
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-[0.88rem] opacity-40 pointer-events-none">
                sidequest.me/
              </span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="yourname"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                className={`${inputClass} pl-[7.4rem]`}
              />
            </div>

            {/* Status indicator */}
            {username && (
              <p
                className={`font-mono text-[0.72rem] mt-1.5 ${
                  usernameError
                    ? 'text-red-600'
                    : checking
                    ? 'opacity-50'
                    : usernameOk
                    ? 'text-green-700'
                    : 'opacity-50'
                }`}
              >
                {usernameError
                  ? usernameError
                  : checking
                  ? 'Checking availability…'
                  : usernameOk
                  ? '✓ Available!'
                  : null}
              </p>
            )}
            {!username && (
              <p className="font-mono text-[0.68rem] opacity-50 mt-1.5">
                3–30 characters. Letters, numbers, _ and - only.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="displayName" className={labelClass}>
              Display Name{' '}
              <span className="font-mono normal-case font-normal opacity-50">(optional)</span>
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name or tagline"
              maxLength={120}
              className={inputClass}
            />
            <p className="font-mono text-[0.68rem] opacity-50 mt-1.5">
              Shown at the top of your profile. Can be changed any time.
            </p>
          </div>

          {error && (
            <div className="border-3 border-red-500 bg-red-50 p-3 font-mono text-[0.78rem] text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!usernameOk || saving}
            className="w-full py-2.5 px-4 bg-ink text-bg font-head font-bold text-[0.82rem] uppercase border-3 border-ink hover:bg-transparent hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? 'Setting up…' : 'Claim username →'}
          </button>

          <p className="font-mono text-[0.68rem] opacity-40 text-center">
            You can change your username later in Settings.
          </p>
        </form>
      </div>
    </main>
  )
}
