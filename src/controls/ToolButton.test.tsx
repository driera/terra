import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { configureAxe, toHaveNoViolations } from 'jest-axe'
import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import ToolButton from './ToolButton'

expect.extend(toHaveNoViolations)

const axe = configureAxe()

describe('ToolButton', () => {
  it('renders children', () => {
    render(<ToolButton>+</ToolButton>)
    expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument()
  })

  it('uses aria-label when provided', () => {
    render(<ToolButton aria-label="Zoom in">+</ToolButton>)
    expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument()
  })

  it('does not set aria-pressed when pressed prop is omitted', () => {
    render(<ToolButton aria-label="Action">x</ToolButton>)
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-pressed')
  })

  it('sets aria-pressed="false" when pressed={false}', () => {
    render(<ToolButton aria-label="Toggle" pressed={false}>x</ToolButton>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })

  it('sets aria-pressed="true" when pressed={true}', () => {
    render(<ToolButton aria-label="Toggle" pressed={true}>x</ToolButton>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onClick when clicked', async () => {
    const handler = vi.fn()
    render(<ToolButton onClick={handler}>x</ToolButton>)
    await userEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledOnce()
  })

  it('forwards additional className', () => {
    render(<ToolButton className="extra">x</ToolButton>)
    expect(screen.getByRole('button').className).toMatch(/extra/)
  })

  it('has no a11y violations unpressed', async () => {
    const { container } = render(<ToolButton aria-label="Action">x</ToolButton>)
    await act(async () => {
      expect(await axe(container)).toHaveNoViolations()
    })
  })

  it('has no a11y violations when pressed', async () => {
    const { container } = render(<ToolButton aria-label="Toggle" pressed={true}>x</ToolButton>)
    await act(async () => {
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
