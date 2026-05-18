import { MapCanvas } from './canvas'
import MapControls from './controls/MapControls'
import DrawingToolbar from './controls/DrawingToolbar'
import Coordinates from './hud/Coordinates'
import styles from './App.module.css'

const App = () => {
  return (
    <div className={styles.layout}>
      <MapCanvas />
      <MapControls />
      <DrawingToolbar />
      <Coordinates />
    </div>
  )
}

export default App
