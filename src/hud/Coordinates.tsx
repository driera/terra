import { usePointer } from '../api'
import styles from './Coordinates.module.css'

const DECIMALS = 4

const Coordinates = () => {
  const { coordinates } = usePointer(['coordinates'])

  if (!coordinates) return null

  const [lng, lat] = coordinates

  return (
    <div className={styles.coordinates}>
      <span className={styles.pair}>
        <span className={styles.label}>lat:</span>
        <span className={styles.value}>{lat.toFixed(DECIMALS)}</span>
      </span>
      <span className={styles.pair}>
        <span className={styles.label}>lng:</span>
        <span className={styles.value}>{lng.toFixed(DECIMALS)}</span>
      </span>
    </div>
  )
}

export default Coordinates
