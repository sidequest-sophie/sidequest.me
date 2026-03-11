'use client'

import { useState } from 'react'

interface WelcomeBannerProps {
  type: 'welcome' | 'passwordReset'
  username: string
}

const messages = {
  welcome: {
    emoji: '🎉',
    heading: 'Welcome to SideQuest.me!',
    body: 'Your profile is live. Start exploring, or head to Settings to add a bio and avatar.',
  },
  passwordReset: {
    emoji: '✅',
    heading: 'Password updated',
    body: "You're back in. Your new password is set.",
  },
}

export default function WelcomeBanner({ type }: WelcomeBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const { emoji, heading, body } = messages[type]

  return (
    <div className="border-3 border-ink bg-green/10 p-4 mb-8 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none mt-0.5">{emoji}</span>
        <div>
          <p className="font-head font-bold text-[0.88rem] uppercase">{heading}</p>
          <p className="font-mono text-[0.78rem] opacity-70 mt-0.5">{body}</p>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="font-mono text-[0.78rem] opacity-40 hover:opacity-100 transition-opacity cursor-pointer mt-0.5 shrink-0"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
