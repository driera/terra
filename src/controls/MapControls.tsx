import mapApi from '../api'
import ToolButton from './ToolButton'
import styles from './MapControls.module.css'

function MapControls() {
  return (
    <div className={styles.controls}>
      <ToolButton aria-label="Zoom in" onClick={() => mapApi.zoomIn()}>+</ToolButton>
      <div className={styles.separator} role="separator" />
      <ToolButton aria-label="Zoom out" onClick={() => mapApi.zoomOut()}>−</ToolButton>
    </div>
  )
}

export default MapControls
