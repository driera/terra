import { useState, useEffect } from 'react'
import mapApi from '../api'
import styles from './DrawingToolbar.module.css'

function DrawingToolbar() {
  const [mode, setMode] = useState<'line' | null>(null)

  const toggleLine = () => {
    const next = mode === 'line' ? null : 'line'
    setMode(next)
    mapApi.setDrawingMode(next)
  }

  useEffect(() => {
    if (mode !== 'line') return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') mapApi.cancelDrawing()
      if (e.key === 'Enter') mapApi.completeDrawing()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mode])

  return (
    <div className={styles.toolbar}>
      <button
        type="button"
        aria-label="Draw line"
        aria-pressed={mode === 'line'}
        className={styles.button}
        onClick={toggleLine}
      >
        Line
      </button>
      {mode === 'line' && (
        <button
          type="button"
          className={styles.button}
          onClick={() => mapApi.completeDrawing()}
        >
          Done
        </button>
      )}
    </div>
  )
}

export default DrawingToolbar
