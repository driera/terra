import { usePointer } from '../api'
import styles from './Coordinates.module.css'

const DECIMALS = 4

const Coordinates = () => {
  const { coordinates } = usePointer(['coordinates'])

  if (!coordinates) return null

  const [lng, lat] = coordinates
  const label = `${lat.toFixed(DECIMALS)}, ${lng.toFixed(DECIMALS)}`

  return (
    <div className={styles.coordinates} aria-live="polite">
      {label}
    </div>
  )
}

export default Coordinates
