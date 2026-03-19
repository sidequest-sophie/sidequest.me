'use client'

import dynamic from 'next/dynamic'
import type { Waypoint } from '@/lib/adventures'

const AdventureMap = dynamic(() => import('./AdventureMap'), { ssr: false })

interface Props {
  waypoints: Waypoint[]
  className?: string
}

export default function AdventureMapWrapper({ waypoints, className }: Props) {
  return <AdventureMap waypoints={waypoints} className={className} />
}
