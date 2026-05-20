import { useDrawing } from '../api'
import styles from './DrawingMetadata.module.css'

const DrawingMetadata = () => {
  const { geometries } = useDrawing(['geometries'])

  if (geometries.length === 0) return null

  const lineCount = geometries.length
  const vertexCount = geometries.reduce(
    (sum, f) => sum + (f.geometry as GeoJSON.LineString).coordinates.length,
    0
  )

  return (
    <span className={styles.metadata}>
      {lineCount} {lineCount === 1 ? 'line' : 'lines'} · {vertexCount} vertices
    </span>
  )
}

export default DrawingMetadata
