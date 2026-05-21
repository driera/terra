import length from '@turf/length'
import type GeoJSON from 'geojson'

export const getCompletedDistance = (geometries: GeoJSON.Feature<GeoJSON.LineString>[]): number =>
  geometries.reduce((sum, f) => sum + length(f, { units: 'meters' }), 0)

export const getDraftDistance = (
  vertices: [number, number][],
  cursor: [number, number] | null
): number => {
  const coords: [number, number][] = cursor ? [...vertices, cursor] : vertices
  if (coords.length < 2) return 0
  const feature: GeoJSON.Feature<GeoJSON.LineString> = {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: coords },
    properties: {},
  }
  return length(feature, { units: 'meters' })
}

export const formatDistance = (metres: number): string => `${Math.round(metres)} m`
