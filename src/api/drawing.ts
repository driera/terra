import { useMemo, useSyncExternalStore } from 'react'
import type maplibregl from 'maplibre-gl'
import type GeoJSON from 'geojson'
import { GeometryStore } from './GeometryStore'
import type { GeometryAttribute, GeometryState } from './GeometryStore'

export type { GeometryState, GeometryAttribute }

const EMPTY_COLLECTION: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

const DRAFT_LINE_LAYER: maplibregl.LayerSpecification = {
  id: 'terra-draft-line',
  type: 'line',
  source: 'terra-draft',
  paint: {
    'line-color': '#0066cc',
    'line-width': 2,
    'line-dasharray': [2, 2],
  },
}

const FEATURES_LINE_LAYER: maplibregl.LayerSpecification = {
  id: 'terra-features-line',
  type: 'line',
  source: 'terra-features',
  paint: {
    'line-color': '#0066cc',
    'line-width': 2,
  },
}

const store = new GeometryStore()

let _map: maplibregl.Map | null = null
let _mode: 'line' | null = null
let _sourcesReady = false

const _syncToMap = (): void => {
  if (!_map || !_sourcesReady) return
  const { vertices, cursor, geometries } = store.get()
  const draftCoords: [number, number][] = [...vertices, ...(cursor ? [cursor] : [])]
  const draftFC: GeoJSON.FeatureCollection =
    draftCoords.length >= 2
      ? {
          type: 'FeatureCollection',
          features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: draftCoords }, properties: {} }],
        }
      : EMPTY_COLLECTION
  ;(_map.getSource('terra-draft') as maplibregl.GeoJSONSource).setData(draftFC)
  ;(_map.getSource('terra-features') as maplibregl.GeoJSONSource).setData({
    type: 'FeatureCollection',
    features: geometries,
  })
}

const onClick = (e: maplibregl.MapMouseEvent): void => {
  if (_mode !== 'line') return
  store.appendVertex([e.lngLat.lng, e.lngLat.lat])
  _syncToMap()
}

const onMouseMove = (e: maplibregl.MapMouseEvent): void => {
  if (_mode !== 'line') return
  store.setCursor([e.lngLat.lng, e.lngLat.lat])
  _syncToMap()
}

const _registerSourcesAndLayers = (): void => {
  if (!_map) return
  _map.addSource('terra-draft', { type: 'geojson', data: EMPTY_COLLECTION })
  _map.addSource('terra-features', { type: 'geojson', data: EMPTY_COLLECTION })
  _map.addLayer(DRAFT_LINE_LAYER)
  _map.addLayer(FEATURES_LINE_LAYER)
  _sourcesReady = true
}

export const init = (map: maplibregl.Map): void => {
  if (_map) destroy()
  _map = map
  map.on('click', onClick)
  map.on('mousemove', onMouseMove)
  if (map.isStyleLoaded()) {
    _registerSourcesAndLayers()
  } else {
    map.once('load', _registerSourcesAndLayers)
  }
}

export const destroy = (): void => {
  if (!_map) return
  _map.off('click', onClick)
  _map.off('mousemove', onMouseMove)
  _map.getCanvas().style.cursor = ''
  _map = null
  _mode = null
  _sourcesReady = false
  store.reset()
}

export const setMode = (mode: 'line' | null): void => {
  const wasActive = _mode !== null
  _mode = mode
  if (_map) _map.getCanvas().style.cursor = mode === 'line' ? 'crosshair' : ''
  if (wasActive && mode === null) cancel()
}

export const complete = (): void => {
  const { vertices } = store.get()
  if (vertices.length < 2) return
  const feature: GeoJSON.Feature<GeoJSON.LineString> = {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: vertices },
    properties: {},
  }
  store.addGeometry(feature)
  store.clearDraft()
  _syncToMap()
}

export const cancel = (): void => {
  store.clearDraft()
  _syncToMap()
}

export const getGeometry = (): GeometryState => store.get()

export const useDrawing = (keys: GeometryAttribute[]): GeometryState => {
  const keysKey = keys.join(',')

  const subscribe = useMemo(
    () => (notify: () => void) =>
      store.subscribe((_, changedKeys) => {
        if (keys.length === 0 || changedKeys.some((k) => keys.includes(k))) {
          notify()
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keysKey]
  )

  return useSyncExternalStore(subscribe, () => store.get())
}
