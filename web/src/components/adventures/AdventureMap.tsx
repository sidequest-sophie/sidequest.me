'use client'

import { useEffect, useRef } from 'react'
import type { Waypoint } from '@/lib/adventures'

interface AdventureMapProps {
  waypoints: Waypoint[]
  className?: string
}

export default function AdventureMap({ waypoints, className = '' }: AdventureMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return
    if (typeof window === 'undefined') return

    // Only render if we have at least one waypoint with coords
    const withCoords = waypoints.filter((w) => w.lat && w.lng)
    if (withCoords.length === 0) return

    // Dynamic import to avoid SSR issues
    import('leaflet').then((L) => {
      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, { scrollWheelZoom: false })
      mapInstance.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(map)

      // Add markers
      const markers: L.LatLng[] = []
      withCoords.forEach((wp, i) => {
        const latlng = L.latLng(wp.lat!, wp.lng!)
        markers.push(latlng)

        const marker = L.marker(latlng).addTo(map)
        marker.bindPopup(`<strong>${i + 1}. ${wp.name}</strong>${wp.arrival_date ? `<br/>${wp.arrival_date}` : ''}`)
      })

      // Draw route line
      if (markers.length > 1) {
        L.polyline(markers, {
          color: '#ff6b35',
          weight: 3,
          opacity: 0.7,
          dashArray: '8 6',
        }).addTo(map)
      }

      // Fit bounds
      if (markers.length > 0) {
        const bounds = L.latLngBounds(markers)
        map.fitBounds(bounds, { padding: [40, 40] })
      }
    })

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [waypoints])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className={`w-full ${className}`} style={{ minHeight: 400 }} />
    </>
  )
}
