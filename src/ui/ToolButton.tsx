import type { ButtonHTMLAttributes } from 'react'
import styles from './ToolButton.module.css'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  pressed?: boolean
}

const ToolButton = ({ pressed, className, children, ...rest }: Props) => (
  <button
    type="button"
    aria-pressed={pressed}
    className={[styles.button, className].filter(Boolean).join(' ')}
    {...rest}
  >
    {children}
  </button>
)

export default ToolButton
