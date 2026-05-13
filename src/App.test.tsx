import { render, screen, act } from '@testing-library/react'
import { configureAxe, toHaveNoViolations } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('./canvas', () => ({
  MapCanvas: () => <div data-testid="map-canvas" />,
}))

vi.mock('./controls/MapControls', () => ({
  default: () => <div data-testid="map-controls" />,
}))

vi.mock('./hud/Coordinates', () => ({
  default: () => <div data-testid="coordinates" />,
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

  it('renders Coordinates', () => {
    render(<App />)
    expect(screen.getByTestId('coordinates')).toBeInTheDocument()
  })

  it('renders MapCanvas, MapControls and Coordinates as siblings inside a layout wrapper', () => {
    render(<App />)
    const canvas = screen.getByTestId('map-canvas')
    const controls = screen.getByTestId('map-controls')
    const coordinates = screen.getByTestId('coordinates')
    expect(canvas.parentElement).toBe(controls.parentElement)
    expect(canvas.parentElement).toBe(coordinates.parentElement)
  })

  it('has no a11y violations', async () => {
    const { container } = render(<App />)
    await act(async () => {
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
