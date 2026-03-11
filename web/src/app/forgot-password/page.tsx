'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })

      if (resetError) {
        setError(friendlyError(resetError.message))
      } else {
        setSent(true)
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <main className="min-h-[calc(100vh-120px)] flex items-center justify-center px-6">
        <div
          className="w-full max-w-md border-3 border-ink bg-bg p-10 text-center"
          style={{ boxShadow: '6px 6px 0 var(--ink)' }}
        >
          <div className="text-4xl mb-4">📬</div>
          <h1 className="font-head font-[900] text-[1.8rem] uppercase mb-3">Check your email</h1>
          <p className="font-mono text-[0.82rem] opacity-70 mb-6">
            If an account exists for <strong>{email}</strong>, you&apos;ll receive a password reset
            link shortly.
          </p>
          <Link href="/login" className="font-mono text-[0.78rem] underline text-ink">
            Back to sign in
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-120px)] flex items-center justify-center px-6">
      <div
        className="w-full max-w-md border-3 border-ink bg-bg p-10"
        style={{ boxShadow: '6px 6px 0 var(--ink)' }}
      >
        <h1 className="font-head font-[900] text-[2rem] uppercase leading-tight mb-1">
          Reset password
        </h1>
        <p className="font-mono text-[0.78rem] opacity-60 mb-8">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block font-head font-bold text-[0.78rem] uppercase mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full px-4 py-2.5 border-3 border-ink bg-white font-mono text-[0.88rem] focus:outline-none focus:shadow-[3px_3px_0_var(--ink)] transition-shadow"
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
            {loading ? 'Sending…' : 'Send reset link'}
          </button>

          <p className="font-mono text-[0.75rem] opacity-60 text-center">
            Remembered it?{' '}
            <Link href="/login" className="text-ink font-bold underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}

function friendlyError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many requests. Please wait a moment and try again.'
  if (m.includes('invalid email') || m.includes('email')) return 'Please enter a valid email address.'
  return msg
}
