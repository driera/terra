import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef } from 'react'
import styles from './Map.module.css'
import useInitialCenter from '../location/useInitialCenter'

const STYLE_URL = `https://api.maptiler.com/maps/019df8cf-b54b-74e9-81d2-7c1f124b88dd/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`
const DEFAULT_CENTER: [number, number] = [-3.7, 40.4]
const DEFAULT_ZOOM = 3

function Map() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const center = useInitialCenter()

  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    })

    mapRef.current = map
    window.map = map

    // 'contours' source is defined in the custom MapTiler style — see ADR 002
    map.once('load', () => {
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
      mapRef.current = null
      delete window.map
    }
  }, [])

  useEffect(() => {
    if (!center || !mapRef.current) return
    mapRef.current.flyTo({ center, zoom: 12 })
  }, [center])

  return <div ref={containerRef} className={styles.mapContainer} />
}

export default Map
