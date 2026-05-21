import { useMemo, useSyncExternalStore } from 'react'
import { geometryStore } from './store'
import type { GeometryAttribute } from './store'
import { getCompletedDistance, getDraftDistance } from './distance'
import type GeoJSON from 'geojson'

export type DrawingState = {
  isDrawing: boolean
  hasCompleted: boolean
  lineCount: number
  vertexCount: number
  distance: number
}

export const useDrawing = (keys: GeometryAttribute[]): DrawingState => {
  const keysKey = keys.join(',')

  const subscribe = useMemo(
    () => (notify: () => void) =>
      geometryStore.subscribe((_, changedKeys) => {
        if (keys.length === 0 || changedKeys.some((k) => keys.includes(k))) {
          notify()
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keysKey]
  )

  const { vertices, cursor, geometries } = useSyncExternalStore(subscribe, () => geometryStore.get())

  const completedDistance = useMemo(
    () => getCompletedDistance(geometries as GeoJSON.Feature<GeoJSON.LineString>[]),
    [geometries]
  )

  return {
    isDrawing: vertices.length > 0,
    hasCompleted: geometries.length > 0,
    lineCount: geometries.length,
    vertexCount: geometries.reduce(
      (sum, f) => sum + (f.geometry as GeoJSON.LineString).coordinates.length,
      0
    ),
    distance: completedDistance + getDraftDistance(vertices, cursor),
  }
}
