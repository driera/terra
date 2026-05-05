import maplibregl from 'maplibre-gl'
import { useEffect, useRef } from 'react'
import styles from './Map.module.css'

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'
const DEFAULT_CENTER: [number, number] = [2.1734, 41.3851]
const DEFAULT_ZOOM = 12

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

    return () => {
      map.remove()
      delete window.map
    }
  }, [])

  return <div ref={containerRef} className={styles.mapContainer} />
}

export default Map
