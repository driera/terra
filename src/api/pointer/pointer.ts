import type maplibregl from 'maplibre-gl'
import { store } from './store'
import type { PointerState } from './store'

let _map: maplibregl.Map | null = null

const onMouseMove = (e: maplibregl.MapMouseEvent) => {
  store.set({ coordinates: [e.lngLat.lng, e.lngLat.lat] })
}

const onMouseLeave = () => {
  store.set({ coordinates: null })
}

export const init = (map: maplibregl.Map): void => {
  if (_map) destroy()
  _map = map
  map.on('mousemove', onMouseMove)
  map.on('mouseleave', onMouseLeave)
}

export const destroy = (): void => {
  if (!_map) return
  _map.off('mousemove', onMouseMove)
  _map.off('mouseleave', onMouseLeave)
  _map = null
  store.reset()
}

export const getPointer = (): PointerState => store.get()
