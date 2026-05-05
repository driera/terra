import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef } from 'react'
import styles from './Map.module.css'

const STYLE_URL = `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`
const CONTOURS_SOURCE_URL = `https://api.maptiler.com/tiles/contours-v2/tiles.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`
const DEFAULT_CENTER: [number, number] = [2.1734, 41.3851]
const DEFAULT_ZOOM = 12

// Native contour layer IDs in outdoor-v2 — hidden on load, replaced by our explicit layers
const NATIVE_CONTOUR_LAYERS = [
  'Contour',
  'Contour index',
  'Contour labels',
  'Glacier contour',
  'Glacier contour index',
  'Glacier contour labels',
]

function Map() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    })

    window.map = map

    map.on('load', () => {
      NATIVE_CONTOUR_LAYERS.forEach((id) => {
        map.setLayoutProperty(id, 'visibility', 'none')
      })

      map.addSource('contours', {
        type: 'vector',
        url: CONTOURS_SOURCE_URL,
      })

      map.addLayer({
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

      map.addLayer({
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
    })

    return () => {
      map.remove()
      delete window.map
    }
  }, [])

  return <div ref={containerRef} className={styles.mapContainer} />
}

export default Map
