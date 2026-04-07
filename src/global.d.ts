import type maplibregl from 'maplibre-gl'

declare global {
  interface Window {
    map?: maplibregl.Map
  }
}
