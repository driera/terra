import { MapCanvas } from './MapCanvas'
import MapControls from './map-controls/MapControls'
import styles from './App.module.css'

const App = () => {
  return (
    <div className={styles.layout}>
      <MapCanvas />
      <MapControls />
    </div>
  )
}

export default App
