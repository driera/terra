import { useState, useEffect } from 'react'
import { PenTool, Check } from 'lucide-react'
import mapApi, { useDrawing, Modes } from '../api'
import type { Mode } from '../api'
import ToolButton from './ToolButton'
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
      <ToolButton aria-label="Draw line" pressed={mode === Modes.LINE} onClick={toggleLine}>
        <PenTool size={16} />
      </ToolButton>
      {mode === Modes.LINE && isDrawing && (
        <ToolButton aria-label="Done" onClick={() => mapApi.completeDrawing()}>
          <Check size={16} />
        </ToolButton>
      )}
    </div>
  )
}

export default DrawingToolbar
