import type { Coordinates } from './types'

const getBrowserLocation = (): Promise<Coordinates> =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
      reject
    )
  })

export default getBrowserLocation
