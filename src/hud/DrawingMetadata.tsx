import { useDrawing } from '../api'
import styles from './DrawingMetadata.module.css'

const DrawingMetadata = () => {
  const { geometries, vertices } = useDrawing(['geometries', 'vertices'])

  const isDrawing = vertices.length > 0
  const hasCompleted = geometries.length > 0

  if (!hasCompleted && !isDrawing) return null

  const lineCount = geometries.length
  const vertexCount = hasCompleted
    ? geometries.reduce((sum, f) => sum + (f.geometry as GeoJSON.LineString).coordinates.length, 0)
    : 0

  return (
    <>
      {hasCompleted && (
        <span className={`${styles.metadata}${isDrawing ? ` ${styles.muted}` : ''}`}>
          {lineCount} {lineCount === 1 ? 'line' : 'lines'} · {vertexCount} vertices
        </span>
      )}
      {isDrawing && (
        <span className={styles.metadata}>drawing…</span>
      )}
    </>
  )
}

export default DrawingMetadata
