import Coordinates from './Coordinates'
import DrawingMetadata from './DrawingMetadata'
import styles from './Footer.module.css'

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <Coordinates />
      <DrawingMetadata />
    </footer>
  )
}

export default Footer
