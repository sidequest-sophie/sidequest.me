'use client'

import { useEffect, useRef } from 'react'
import type { Waypoint } from '@/lib/adventures'

/* Approximate coords for common locations (fallback when no lat/lng) */
const LOCATION_COORDS: Record<string, [number, number]> = {
  'uk': [51.5, -1.5], 'united kingdom': [51.5, -1.5], 'england': [52.0, -1.0],
  'surrey': [51.25, -0.4], 'london': [51.51, -0.13],
  'spain': [40.0, -3.7], 'bilbao': [43.26, -2.93], 'madrid': [40.42, -3.7],
  'morocco': [31.8, -7.1], 'tafraoute': [29.72, -8.97], 'marrakech': [31.63, -8.0],
  'france': [46.6, 2.2], 'paris': [48.86, 2.35],
  'germany': [51.2, 10.4], 'berlin': [52.52, 13.4],
  'italy': [42.5, 12.5], 'portugal': [39.4, -8.2],
  'netherlands': [52.1, 5.3], 'belgium': [50.8, 4.4],
  'usa': [39.8, -98.6], 'nevada': [39.3, -116.6],
  'black rock city': [40.79, -119.2],
  'budapest': [47.5, 19.04], 'krakow': [50.06, 19.94],
  'bucharest': [44.43, 26.1], 'sofia': [42.7, 23.32],
  'transylvania': [46.5, 25.0], 'high tatras': [49.15, 20.15],
}

function guessCoords(name: string): [number, number] | null {
  const lower = name.toLowerCase().trim()
  if (LOCATION_COORDS[lower]) return LOCATION_COORDS[lower]
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if (lower.includes(key) || key.includes(lower)) return coords
  }
  return null
}

interface JourneyMapProps {
  waypoints: Waypoint[]
  className?: string
  /** 'journey' = abstract overview with bold route. 'detailed' = standard pins + OSM tiles */
  mode?: 'journey' | 'detailed'
}

export default function JourneyMap({ waypoints, className = '', mode = 'journey' }: JourneyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)

  // Resolve coordinates
  const resolved = waypoints
    .filter((w) => w.name.trim())
    .map((w) => ({
      name: w.name.trim(),
      coords: (w.lat && w.lng) ? [w.lat, w.lng] as [number, number] : guessCoords(w.name),
      arrival: w.arrival_date,
    }))
    .filter((w) => w.coords !== null) as Array<{ name: string; coords: [number, number]; arrival?: string }>

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return
    if (typeof window === 'undefined') return
    if (resolved.length < 2) return

    import('leaflet').then((L) => {
      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, {
        scrollWheelZoom: false,
        zoomControl: mode === 'detailed',
        attributionControl: false,
      })
      mapInstance.current = map

      // Tile layer: journey mode uses muted/minimal, detailed uses standard
      if (mode === 'journey') {
        // CartoDB Positron — light, minimal, muted. Fits the cream palette.
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 18,
          subdomains: 'abcd',
        }).addTo(map)
      } else {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 18,
        }).addTo(map)
      }

      const allPoints: L.LatLng[] = []

      if (mode === 'journey') {
        // Journey mode: bold numbered circles, thick dashed route
        // Build full route path (including duplicate locations for the line)
        resolved.forEach((wp) => {
          allPoints.push(L.latLng(wp.coords[0], wp.coords[1]))
        })

        // Only place markers on unique locations (first occurrence)
        const seen = new Set<string>()
        let markerNum = 0
        resolved.forEach((wp, i) => {
          const key = `${wp.coords[0].toFixed(2)},${wp.coords[1].toFixed(2)}`
          if (seen.has(key)) return
          seen.add(key)
          markerNum++

          const latlng = L.latLng(wp.coords[0], wp.coords[1])

          const icon = L.divIcon({
            className: '',
            html: `<div style="
              width: 28px; height: 28px; border-radius: 50%;
              background: var(--orange, #ff6b35); border: 3px solid var(--ink, #1a1a1a);
              display: flex; align-items: center; justify-content: center;
              font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700;
              color: var(--ink, #1a1a1a);
              box-shadow: 2px 2px 0 var(--ink, #1a1a1a);
            ">${markerNum}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          })

          const marker = L.marker(latlng, { icon }).addTo(map)

          marker.bindTooltip(wp.name.toUpperCase(), {
            permanent: true,
            direction: markerNum % 2 !== 0 ? 'right' : 'left',
            offset: markerNum % 2 !== 0 ? L.point(18, 0) : L.point(-18, 0),
            className: 'journey-label',
          })
        })

        // Bold dashed route line through ALL points (including return legs)
        if (allPoints.length > 1) {
          L.polyline(allPoints, {
            color: '#1a1a1a',
            weight: 4,
            opacity: 0.8,
            dashArray: '12 8',
          }).addTo(map)
        }
      } else {
        // Detailed mode: standard markers with popups
        resolved.forEach((wp, i) => {
          const latlng = L.latLng(wp.coords[0], wp.coords[1])
          allPoints.push(latlng)

          const icon = L.divIcon({
            className: '',
            html: `<div style="
              width: 24px; height: 24px; border-radius: 50%;
              background: var(--orange, #ff6b35); border: 2px solid white;
              display: flex; align-items: center; justify-content: center;
              font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700;
              color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">${i + 1}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })

          const marker = L.marker(latlng, { icon }).addTo(map)
          marker.bindPopup(`<strong>${i + 1}. ${wp.name}</strong>${wp.arrival ? `<br/>${wp.arrival}` : ''}`)
        })

        // Solid route line
        if (allPoints.length > 1) {
          L.polyline(allPoints, {
            color: '#ff6b35', // orange
            weight: 3,
            opacity: 0.7,
          }).addTo(map)
        }
      }

      // Fit bounds
      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints)
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    })

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [resolved.length, mode])

  if (resolved.length < 2) {
    return (
      <div className={`bg-bg flex items-center justify-center font-mono text-[0.7rem] text-ink-muted ${className}`}>
        Add route stops to see the journey map
      </div>
    )
  }

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>{`
        .journey-label {
          background: var(--bg, #fffbe6) !important;
          border: 2px solid var(--ink, #1a1a1a) !important;
          border-radius: 0 !important;
          padding: 2px 8px !important;
          font-family: 'Archivo', sans-serif !important;
          font-weight: 900 !important;
          font-size: 10px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.03em !important;
          color: var(--ink, #1a1a1a) !important;
          box-shadow: 2px 2px 0 var(--ink, #1a1a1a) !important;
          white-space: nowrap !important;
        }
        .journey-label::before {
          border-right-color: var(--ink, #1a1a1a) !important;
        }
        .leaflet-left .journey-label::before {
          border-left-color: var(--ink, #1a1a1a) !important;
        }
      `}</style>
      <div ref={mapRef} className={`w-full ${className}`} style={{ minHeight: 350 }} />
    </>
  )
}
