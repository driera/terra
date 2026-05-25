import styles from './Logo.module.css'

const Hexmark = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
    <polygon points="23,12 17.5,21.5 6.5,21.5 1,12 6.5,2.5 17.5,2.5" fill="var(--color-primary)" />
  </svg>
)

const Logo = () => (
  <div className={styles.logo}>
    <Hexmark />
    <span>Terra</span>
  </div>
)

export default Logo
