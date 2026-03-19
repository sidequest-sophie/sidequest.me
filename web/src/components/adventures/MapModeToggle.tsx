'use client'

import { useState } from 'react'
import type { Waypoint } from '@/lib/adventures'
import dynamic from 'next/dynamic'

const IndianaJonesMap = dynamic(() => import('./IndianaJonesMap'), { ssr: false })
const AdventureMap = dynamic(() => import('./AdventureMap'), { ssr: false })

interface MapModeToggleProps {
  waypoints: Waypoint[]
  hasCoords: boolean
}

export default function MapModeToggle({ waypoints, hasCoords }: MapModeToggleProps) {
  const [mode, setMode] = useState<'journey' | 'detailed'>('journey')

  return (
    <div>
      {/* Toggle — only show if detailed mode is possible */}
      {hasCoords && (
        <div className="flex gap-1 mb-3">
          <button
            type="button"
            onClick={() => setMode('journey')}
            className={`px-3 py-1.5 font-mono text-[0.6rem] font-bold uppercase border-2 transition-all cursor-pointer ${
              mode === 'journey' ? 'border-ink bg-ink text-bg' : 'border-ink/20 hover:border-ink/50'
            }`}
          >
            🗺️ Journey
          </button>
          <button
            type="button"
            onClick={() => setMode('detailed')}
            className={`px-3 py-1.5 font-mono text-[0.6rem] font-bold uppercase border-2 transition-all cursor-pointer ${
              mode === 'detailed' ? 'border-ink bg-ink text-bg' : 'border-ink/20 hover:border-ink/50'
            }`}
          >
            📍 Detailed
          </button>
        </div>
      )}

      {/* Map */}
      <div className="border-3 border-ink overflow-hidden">
        {mode === 'journey' ? (
          <IndianaJonesMap waypoints={waypoints} className="h-[350px]" />
        ) : (
          <AdventureMap waypoints={waypoints} className="h-[400px]" />
        )}
      </div>
    </div>
  )
}
