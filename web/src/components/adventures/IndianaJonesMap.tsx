'use client'

import { useEffect, useRef, useState } from 'react'
import type { Waypoint } from '@/lib/adventures'

/* ── Approximate lat/lng for common locations (fallback when no coords) ── */
const LOCATION_COORDS: Record<string, [number, number]> = {
  // Countries
  'uk': [51.5, -1.5], 'united kingdom': [51.5, -1.5], 'england': [52.0, -1.0], 'surrey': [51.25, -0.4],
  'spain': [40.0, -3.7], 'bilbao': [43.26, -2.93], 'madrid': [40.42, -3.7],
  'morocco': [31.8, -7.1], 'tafraoute': [29.72, -8.97], 'marrakech': [31.63, -8.0],
  'france': [46.6, 2.2], 'paris': [48.86, 2.35],
  'germany': [51.2, 10.4], 'berlin': [52.52, 13.4],
  'italy': [42.5, 12.5], 'portugal': [39.4, -8.2],
  'netherlands': [52.1, 5.3], 'belgium': [50.8, 4.4],
  'usa': [39.8, -98.6], 'nevada': [39.3, -116.6],
  'black rock city': [40.79, -119.2],
}

function guessCoords(name: string): [number, number] | null {
  const lower = name.toLowerCase().trim()
  // Direct match
  if (LOCATION_COORDS[lower]) return LOCATION_COORDS[lower]
  // Partial match
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if (lower.includes(key) || key.includes(lower)) return coords
  }
  return null
}

interface IndianaJonesMapProps {
  waypoints: Waypoint[]
  className?: string
}

export default function IndianaJonesMap({ waypoints, className = '' }: IndianaJonesMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [animProgress, setAnimProgress] = useState(0)
  const animRef = useRef<number>(0)

  // Resolve coordinates
  const resolvedWaypoints = waypoints
    .filter((w) => w.name.trim())
    .map((w) => ({
      name: w.name.trim(),
      coords: (w.lat && w.lng) ? [w.lat, w.lng] as [number, number] : guessCoords(w.name),
      arrival: w.arrival_date,
    }))
    .filter((w) => w.coords !== null) as Array<{ name: string; coords: [number, number]; arrival?: string }>

  useEffect(() => {
    if (!canvasRef.current || resolvedWaypoints.length < 2) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    const W = rect.width
    const H = rect.height

    // Calculate bounds
    const lats = resolvedWaypoints.map((w) => w.coords[0])
    const lngs = resolvedWaypoints.map((w) => w.coords[1])
    const minLat = Math.min(...lats) - 2
    const maxLat = Math.max(...lats) + 2
    const minLng = Math.min(...lngs) - 3
    const maxLng = Math.max(...lngs) + 3

    const toX = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * (W - 80) + 40
    const toY = (lat: number) => ((maxLat - lat) / (maxLat - minLat)) * (H - 60) + 30

    const points = resolvedWaypoints.map((w) => ({
      x: toX(w.coords[1]),
      y: toY(w.coords[0]),
      name: w.name,
    }))

    // Calculate total path length
    let totalLen = 0
    const segments: number[] = []
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x
      const dy = points[i].y - points[i - 1].y
      const len = Math.sqrt(dx * dx + dy * dy)
      segments.push(len)
      totalLen += len
    }

    function draw(progress: number) {
      if (!ctx) return
      // Parchment background
      ctx.fillStyle = '#f5edd6'
      ctx.fillRect(0, 0, W, H)

      // Subtle grain
      ctx.globalAlpha = 0.03
      for (let i = 0; i < 2000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#8b7355' : '#d4c5a0'
        ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1)
      }
      ctx.globalAlpha = 1

      // Draw faint grid lines
      ctx.strokeStyle = 'rgba(139, 115, 85, 0.08)'
      ctx.lineWidth = 0.5
      for (let i = 0; i < 10; i++) {
        ctx.beginPath()
        ctx.moveTo(0, (H / 10) * i)
        ctx.lineTo(W, (H / 10) * i)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo((W / 10) * i, 0)
        ctx.lineTo((W / 10) * i, H)
        ctx.stroke()
      }

      // Draw the full route as faint line
      ctx.strokeStyle = 'rgba(139, 115, 85, 0.15)'
      ctx.lineWidth = 2
      ctx.setLineDash([])
      ctx.beginPath()
      points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
      ctx.stroke()

      // Draw animated route (bold red dashed)
      const drawLen = totalLen * progress
      ctx.strokeStyle = '#c0392b'
      ctx.lineWidth = 3
      ctx.setLineDash([12, 6])
      ctx.lineDashOffset = -Date.now() / 100 // Animated dash
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)

      let accumulated = 0
      for (let i = 1; i < points.length; i++) {
        const segLen = segments[i - 1]
        if (accumulated + segLen <= drawLen) {
          ctx.lineTo(points[i].x, points[i].y)
          accumulated += segLen
        } else {
          const remaining = drawLen - accumulated
          const t = remaining / segLen
          const x = points[i - 1].x + (points[i].x - points[i - 1].x) * t
          const y = points[i - 1].y + (points[i].y - points[i - 1].y) * t
          ctx.lineTo(x, y)
          break
        }
      }
      ctx.stroke()
      ctx.setLineDash([])

      // Draw waypoint markers
      points.forEach((p, i) => {
        const reached = (() => {
          let acc = 0
          for (let j = 1; j <= i; j++) acc += segments[j - 1]
          return acc <= drawLen
        })()

        // Circle
        ctx.beginPath()
        ctx.arc(p.x, p.y, reached ? 8 : 6, 0, Math.PI * 2)
        ctx.fillStyle = reached ? '#c0392b' : 'rgba(139, 115, 85, 0.3)'
        ctx.fill()
        ctx.strokeStyle = reached ? '#922b21' : 'rgba(139, 115, 85, 0.2)'
        ctx.lineWidth = 2
        ctx.stroke()

        // Number inside
        if (reached) {
          ctx.fillStyle = '#f5edd6'
          ctx.font = 'bold 9px "Space Mono", monospace'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(String(i + 1), p.x, p.y)
        }

        // Label
        ctx.fillStyle = reached ? '#4a3728' : 'rgba(74, 55, 40, 0.35)'
        ctx.font = `${reached ? 'bold ' : ''}11px "Archivo", sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText(p.name.toUpperCase(), p.x, p.y + 14)
      })

      // Title
      ctx.fillStyle = 'rgba(74, 55, 40, 0.6)'
      ctx.font = 'bold 9px "Space Mono", monospace'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(`${resolvedWaypoints.length} STOPS`, 12, 10)
    }

    // Animate
    const startTime = Date.now()
    const duration = 2500

    function animate() {
      const elapsed = Date.now() - startTime
      const p = Math.min(1, elapsed / duration)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - p, 3)
      setAnimProgress(eased)
      draw(eased)
      if (p < 1) {
        animRef.current = requestAnimationFrame(animate)
      }
    }

    animRef.current = requestAnimationFrame(animate)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [resolvedWaypoints.length])

  if (resolvedWaypoints.length < 2) {
    return (
      <div className={`bg-[#f5edd6] flex items-center justify-center font-mono text-[0.7rem] text-[#8b7355] ${className}`}>
        Add route stops to see the journey map
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className={`w-full ${className}`}
      style={{ imageRendering: 'auto' }}
    />
  )
}
