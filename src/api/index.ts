import type maplibregl from 'maplibre-gl'
import core from './core'
import * as pointer from './pointer'
import * as drawing from './drawing'

type Plugin = {
  init: (map: maplibregl.Map) => void
  destroy: () => void
}

const plugins: Plugin[] = [pointer, drawing]

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
  setDrawingMode: drawing.setMode,
  cancelDrawing: drawing.cancel,
  completeDrawing: drawing.complete,
}

export default mapApi

export { usePointer, getPointer } from './pointer'
export type { PointerState, PointerAttribute } from './pointer'

export { useDrawing, getGeometry, setMode as setDrawingMode, cancel as cancelDrawing, complete as completeDrawing } from './drawing'
export type { GeometryState, GeometryAttribute } from './GeometryStore'
