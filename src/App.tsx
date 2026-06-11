import { MapCanvas } from './features/map'
import MapControls from './features/map/MapControls'
import DrawingToolbar from './features/drawing/DrawingToolbar'
import Coordinates from './features/map/Coordinates'
import HudStatus from './features/drawing/HudStatus'
import Logo from './Logo'
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
