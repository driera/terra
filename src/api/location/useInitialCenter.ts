import { useState, useEffect } from 'react'
import type { Coordinates, LocationResolver } from './types'
import getBrowserLocation from './getBrowserLocation'
import getIpLocation from './getIpLocation'
import logger from '../../lib/logger'

const useInitialCenter = (
  getBrowserLoc: LocationResolver = getBrowserLocation,
  getIpLoc: LocationResolver = getIpLocation
): Coordinates | null => {
  const [center, setCenter] = useState<Coordinates | null>(null)

  useEffect(() => {
    let cancelled = false

    getBrowserLoc()
      .catch(() => {
        logger.info('[USER LOCATION] Browser API unavailable, trying IP-based location')
        return getIpLoc()
      })
      .then((coords) => {
        if (!cancelled) {
          logger.info(`[USER LOCATION] Resolved to [${coords[0]}, ${coords[1]}]`)
          setCenter(coords)
        }
      })
      .catch(() => {
        logger.info('[USER LOCATION] Resolution failed, centering to fallback coords')
      })

    return () => {
      cancelled = true
    }
  }, [getBrowserLoc, getIpLoc])

  return center
}

export default useInitialCenter
