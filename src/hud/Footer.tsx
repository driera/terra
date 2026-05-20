import Coordinates from './Coordinates'
import DrawingMetadata from './DrawingMetadata'
import styles from './Footer.module.css'

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <DrawingMetadata />
      <Coordinates />
    </footer>
  )
}

export default Footer
