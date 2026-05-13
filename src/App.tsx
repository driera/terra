import { MapCanvas } from './MapCanvas'
import MapControls from './map-controls/MapControls'
import Coordinates from './hud/Coordinates'
import styles from './App.module.css'

const App = () => {
  return (
    <div className={styles.layout}>
      <MapCanvas />
      <MapControls />
      <Coordinates />
    </div>
  )
}

export default App
