import { usePointer } from '../../api'
import styles from './Coordinates.module.css'

const DECIMALS = 4

const Coordinates = () => {
  const { coordinates } = usePointer(['coordinates'])

  if (!coordinates) return null

  const [lng, lat] = coordinates
  const latStr = `${Math.abs(lat).toFixed(DECIMALS)}° ${lat >= 0 ? 'N' : 'S'}`
  const lngStr = `${Math.abs(lng).toFixed(DECIMALS)}° ${lng >= 0 ? 'E' : 'W'}`

  return (
    <div className={styles.coordinates}>
      <span className={styles.coord}>{latStr}</span>
      <span className={styles.coord}>{lngStr}</span>
    </div>
  )
}

export default Coordinates
