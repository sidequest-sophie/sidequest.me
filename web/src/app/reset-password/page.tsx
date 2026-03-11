'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(friendlyError(updateError.message))
        return
      }

      // Get username for redirect to own profile
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = supabase as any
        const { data: profile } = await db
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()

        router.push(profile?.username ? `/${profile.username}?passwordReset=1` : '/')
      } else {
        router.push('/login')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
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
        <h1 className="font-head font-[900] text-[2rem] uppercase leading-tight mb-1">
          New password
        </h1>
        <p className="font-mono text-[0.78rem] opacity-60 mb-8">
          Choose a strong password for your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className={labelClass}>
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              autoComplete="new-password"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className={labelClass}>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              className={inputClass}
            />
          </div>

          {error && (
            <div className="border-3 border-red-500 bg-red-50 p-3 font-mono text-[0.78rem] text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-ink text-bg font-head font-bold text-[0.82rem] uppercase border-3 border-ink hover:bg-transparent hover:text-ink transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Updating…' : 'Set new password'}
          </button>

          <p className="font-mono text-[0.75rem] opacity-60 text-center">
            <Link href="/login" className="text-ink font-bold underline">
              Back to sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}

function friendlyError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('same password') || m.includes('different from')) return 'New password must be different from your current password.'
  if (m.includes('weak') || m.includes('too short')) return 'Password is too weak. Use at least 8 characters with a mix of letters and numbers.'
  if (m.includes('session') || m.includes('expired') || m.includes('token')) return 'Your reset link has expired. Please request a new one.'
  return msg
}
