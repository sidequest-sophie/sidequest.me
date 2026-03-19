'use client'

import dynamic from 'next/dynamic'
import type { Waypoint } from '@/lib/adventures'

const IndianaJonesMap = dynamic(() => import('./IndianaJonesMap'), { ssr: false })

interface Props {
  waypoints: Waypoint[]
  className?: string
}

export default function IndianaJonesMapWrapper({ waypoints, className }: Props) {
  return <IndianaJonesMap waypoints={waypoints} className={className} />
}
