import type maplibregl from 'maplibre-gl'

let map: maplibregl.Map | null = null

const register = (instance: maplibregl.Map) => {
  map = instance
  window.map = instance
}

const destroy = () => {
  if (!map) return
  map.remove()
  delete window.map
  map = null
}

const addLayer = (layer: maplibregl.LayerSpecification) => {
  if (!map) return
  if (map.isStyleLoaded()) {
    map.addLayer(layer)
  } else {
    map.once('load', () => map!.addLayer(layer))
  }
}

const flyTo = (options: maplibregl.FlyToOptions) => {
  if (!map) return
  if (map.isStyleLoaded()) {
    map.flyTo(options)
  } else {
    map.once('load', () => map!.flyTo(options))
  }
}

const zoomIn = () => map?.zoomIn()

const zoomOut = () => map?.zoomOut()

const mapApi = { register, destroy, addLayer, flyTo, zoomIn, zoomOut }
export default mapApi
