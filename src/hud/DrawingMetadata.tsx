import { useDrawing } from '../api'
import styles from './DrawingMetadata.module.css'

const DrawingMetadata = () => {
  const { geometries, vertices } = useDrawing(['geometries', 'vertices'])

  const isDrawing = vertices.length > 0
  const hasCompleted = geometries.length > 0

  if (!hasCompleted && !isDrawing) return null

  if (!hasCompleted) {
    return <span className={styles.metadata}>drawing…</span>
  }

  const lineCount = geometries.length
  const vertexCount = geometries.reduce(
    (sum, f) => sum + (f.geometry as GeoJSON.LineString).coordinates.length,
    0
  )

  return (
    <span className={styles.metadata}>
      {lineCount} {lineCount === 1 ? 'line' : 'lines'} · {vertexCount} vertices
      {isDrawing && ' · drawing…'}
    </span>
  )
}

export default DrawingMetadata
