import { useMemo, useSyncExternalStore } from 'react'
import type maplibregl from 'maplibre-gl'
import { Store } from './Store'

export type PointerState = {
  coordinates: [number, number] | null
}

export type PointerAttribute = keyof PointerState

const defaultState = (): PointerState => ({ coordinates: null })

const store = new Store<PointerState>(defaultState)

let _map: maplibregl.Map | null = null

const onMouseMove = (e: maplibregl.MapMouseEvent) => {
  store.set({ coordinates: [e.lngLat.lng, e.lngLat.lat] })
}

const onMouseLeave = () => {
  store.set({ coordinates: null })
}

export const init = (map: maplibregl.Map): void => {
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

export const usePointer = (keys: PointerAttribute[]): PointerState => {
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
