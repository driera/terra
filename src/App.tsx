import { MapCanvas } from './canvas'
import MapControls from './controls/MapControls'
import DrawingToolbar from './controls/DrawingToolbar'
import Footer from './hud/Footer'
import styles from './App.module.css'

const App = () => {
  return (
    <div className={styles.layout}>
      <div className={styles.mapArea}>
        <MapCanvas />
        <MapControls />
        <DrawingToolbar />
      </div>
      <Footer />
    </div>
  )
}

export default App
