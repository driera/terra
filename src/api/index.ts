import type maplibregl from 'maplibre-gl'
import core from './core'
import * as pointer from './pointer'

type Plugin = {
  init: (map: maplibregl.Map) => void
  destroy: () => void
}

const plugins: Plugin[] = [pointer]

const register = (map: maplibregl.Map): void => {
  core.register(map)
  plugins.forEach((p) => p.init(map))
}

const destroy = (): void => {
  plugins.forEach((p) => p.destroy())
  core.destroy()
}

const mapApi = {
  register,
  destroy,
  addLayer: core.addLayer,
  flyTo: core.flyTo,
  zoomIn: core.zoomIn,
  zoomOut: core.zoomOut,
}

export default mapApi

export { usePointer, getPointer } from './pointer'
export type { PointerState, PointerAttribute } from './pointer'
