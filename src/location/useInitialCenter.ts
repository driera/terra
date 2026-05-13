import { useState, useEffect } from 'react'
import type { Coordinates, LocationResolver } from './types'
import getBrowserLocation from './getBrowserLocation'
import getIpLocation from './getIpLocation'
import logger from '../logger'

const useInitialCenter = (
  getBrowserLoc: LocationResolver = getBrowserLocation,
  getIpLoc: LocationResolver = getIpLocation
): Coordinates | null => {
  const [center, setCenter] = useState<Coordinates | null>(null)

  useEffect(() => {
    let cancelled = false

    getBrowserLoc()
      .catch(() => {
        logger.warn('Browser location unavailable, trying IP-based location')
        return getIpLoc()
      })
      .then((coords) => {
        if (!cancelled) setCenter(coords)
      })
      .catch(() => {
        logger.warn('Location resolution failed, centering to fallback coords')
      })

    return () => {
      cancelled = true
    }
  }, [getBrowserLoc, getIpLoc])

  return center
}

export default useInitialCenter
