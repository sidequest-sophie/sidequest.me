'use client'

import dynamic from 'next/dynamic'
import type { Waypoint } from '@/lib/adventures'

const JourneyMap = dynamic(() => import('./JourneyMap'), { ssr: false })

interface Props {
  waypoints: Waypoint[]
  className?: string
}

export default function IndianaJonesMapWrapper({ waypoints, className }: Props) {
  return <JourneyMap waypoints={waypoints} mode="journey" className={className} />
}
