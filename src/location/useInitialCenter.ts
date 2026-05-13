import { useState, useEffect } from 'react'
import type { Coordinates, LocationResolver } from './types'
import getBrowserLocation from './getBrowserLocation'
import getIpLocation from './getIpLocation'

const useInitialCenter = (
  getBrowserLoc: LocationResolver = getBrowserLocation,
  getIpLoc: LocationResolver = getIpLocation
): Coordinates | null => {
  const [center, setCenter] = useState<Coordinates | null>(null)

  useEffect(() => {
    let cancelled = false

    getBrowserLoc()
      .catch(() => getIpLoc())
      .then((coords) => {
        if (!cancelled) setCenter(coords)
      })
      .catch(() => {
        if (import.meta.env.DEV) console.warn('Location resolution failed, centering to fallback coords')
      })

    return () => {
      cancelled = true
    }
  }, [getBrowserLoc, getIpLoc])

  return center
}

export default useInitialCenter
