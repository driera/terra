import { useState, useEffect } from 'react'
import mapApi, { useDrawing, Modes } from '../api'
import type { Mode } from '../api'
import styles from './DrawingToolbar.module.css'

function DrawingToolbar() {
  const [mode, setMode] = useState<Mode>(Modes.VIEW)
  const { isDrawing } = useDrawing(['vertices'])

  const toggleLine = () => {
    const next = mode === Modes.LINE ? Modes.VIEW : Modes.LINE
    setMode(next)
    mapApi.setDrawingMode(next)
  }

  useEffect(() => {
    if (mode !== Modes.LINE) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMode(Modes.VIEW); mapApi.setDrawingMode(Modes.VIEW) }
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
        aria-pressed={mode === Modes.LINE}
        className={styles.button}
        onClick={toggleLine}
      >
        Line
      </button>
      {mode === Modes.LINE && isDrawing && (
        <button
          type="button"
          aria-label="Done"
          className={styles.iconButton}
          onClick={() => mapApi.completeDrawing()}
        >
          ✓
        </button>
      )}
    </div>
  )
}

export default DrawingToolbar
