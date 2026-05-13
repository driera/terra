import mapApi from '../Map/mapApi'
import styles from './MapControls.module.css'

function MapControls() {
  return (
    <div className={styles.controls}>
      <button
        type="button"
        aria-label="Zoom in"
        className={styles.button}
        onClick={() => mapApi.zoomIn()}
      >
        +
      </button>
      <button
        type="button"
        aria-label="Zoom out"
        className={styles.button}
        onClick={() => mapApi.zoomOut()}
      >
        −
      </button>
    </div>
  )
}

export default MapControls
