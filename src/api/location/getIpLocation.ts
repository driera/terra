import type { Coordinates } from './types'

const getIpLocation = async (): Promise<Coordinates> => {
  const res = await fetch('https://ipapi.co/json/')
  const data = (await res.json()) as { latitude?: unknown; longitude?: unknown }

  if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
    throw new Error('Missing coordinates in IP response')
  }

  return [data.longitude, data.latitude]
}

export default getIpLocation
