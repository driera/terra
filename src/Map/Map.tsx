import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef } from 'react'
import styles from './Map.module.css'
import useInitialCenter from '../location/useInitialCenter'
import { DEFAULT_CENTER, DEFAULT_ZOOM } from './constants'
import mapApi from './mapApi'
import MapControls from '../map-controls/MapControls'

const STYLE_URL = `https://api.maptiler.com/maps/019df8cf-b54b-74e9-81d2-7c1f124b88dd/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`

function Map() {
  const containerRef = useRef<HTMLDivElement>(null)
  const center = useInitialCenter()

  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    })

    mapApi.register(map)

    // 'contours' source is defined in the custom MapTiler style — see ADR 002
    mapApi.addLayer({
      id: 'contour-line',
      type: 'line',
      source: 'contours',
      'source-layer': 'contour',
      paint: {
        'line-color': '#8a7c6e',
        'line-width': ['match', ['get', 'nth_line'], 10, 1.5, 0.5],
        'line-opacity': ['match', ['get', 'nth_line'], 10, 0.8, 0.5],
      },
    })

    mapApi.addLayer({
      id: 'contour-label',
      type: 'symbol',
      source: 'contours',
      'source-layer': 'contour',
      filter: ['==', ['get', 'nth_line'], 10],
      layout: {
        'symbol-placement': 'line',
        'text-field': ['concat', ['to-string', ['get', 'ele']], 'm'],
        'text-size': 10,
      },
      paint: {
        'text-color': '#8a7c6e',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1,
      },
    })

    return () => {
      mapApi.destroy()
    }
  }, [])

  useEffect(() => {
    if (!center) return
    mapApi.flyTo({ center, zoom: 12 })
  }, [center])

  return (
    <div ref={containerRef} className={styles.mapContainer}>
      <MapControls />
    </div>
  )
}

export default Map
