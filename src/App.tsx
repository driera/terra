import { MapCanvas } from './canvas'
import MapControls from './controls/MapControls'
import DrawingToolbar from './controls/DrawingToolbar'
import Coordinates from './hud/Coordinates'
import HudStatus from './hud/HudStatus'
import Logo from './hud/Logo'
import styles from './App.module.css'

const App = () => {
  return (
    <div className={styles.layout}>
      <DrawingToolbar />
      <div className={styles.mapArea}>
        <MapCanvas />
        <MapControls />
        <Logo />
        <HudStatus />
        <Coordinates />
      </div>
    </div>
  )
}

export default App
