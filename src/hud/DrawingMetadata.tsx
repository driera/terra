import { useDrawing, formatDistance } from '../api'
import styles from './DrawingMetadata.module.css'

const DrawingMetadata = () => {
  const { isDrawing, hasCompleted, lineCount, vertexCount, distance } = useDrawing(['geometries', 'vertices', 'cursor'])

  if (!hasCompleted && !isDrawing) return null

  return (
    <>
      {hasCompleted && (
        <span className={`${styles.metadata}${isDrawing ? ` ${styles.muted}` : ''}`}>
          {lineCount} {lineCount === 1 ? 'line' : 'lines'} · {vertexCount} vertices
        </span>
      )}
      {(distance > 0 || isDrawing) && (
        <span
          className={styles.metadata}
          aria-live="polite"
          aria-atomic="true"
        >
          {formatDistance(distance)}
        </span>
      )}
    </>
  )
}

export default DrawingMetadata
