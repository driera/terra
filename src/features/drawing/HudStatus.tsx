import { useDrawing, formatDistance } from '../../api'
import styles from './HudStatus.module.css'

const HudStatus = () => {
  const { isDrawing, hasCompleted, lineCount, vertexCount, distance } = useDrawing(['geometries', 'vertices', 'cursor'])

  if (!isDrawing && !hasCompleted) return null

  return (
    <div className={styles.hud}>
      {(distance > 0 || isDrawing) && (
        <>
          <span className={styles.dot} aria-hidden="true" />
          <span aria-live="polite" aria-atomic="true">{formatDistance(distance)}</span>
        </>
      )}
      {hasCompleted && (
        <span className={isDrawing ? styles.muted : undefined}>
          {lineCount} {lineCount === 1 ? 'line' : 'lines'} · {vertexCount} vertices
        </span>
      )}
    </div>
  )
}

export default HudStatus
