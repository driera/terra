import { render, screen, act } from '@testing-library/react'
import { configureAxe, toHaveNoViolations } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('./MapCanvas', () => ({
  MapCanvas: () => <div data-testid="map-canvas" />,
}))

vi.mock('./map-controls/MapControls', () => ({
  default: () => <div data-testid="map-controls" />,
}))

expect.extend(toHaveNoViolations)

const axe = configureAxe()

describe('App', () => {
  it('renders MapCanvas', () => {
    render(<App />)
    expect(screen.getByTestId('map-canvas')).toBeInTheDocument()
  })

  it('renders MapControls', () => {
    render(<App />)
    expect(screen.getByTestId('map-controls')).toBeInTheDocument()
  })

  it('renders MapCanvas and MapControls as siblings inside a layout wrapper', () => {
    render(<App />)
    const canvas = screen.getByTestId('map-canvas')
    const controls = screen.getByTestId('map-controls')
    expect(canvas.parentElement).toBe(controls.parentElement)
  })

  it('has no a11y violations', async () => {
    const { container } = render(<App />)
    await act(async () => {
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
