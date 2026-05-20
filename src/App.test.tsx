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

vi.mock('./controls/DrawingToolbar', () => ({
  default: () => <div data-testid="drawing-toolbar" />,
}))

vi.mock('./hud/Footer', () => ({
  default: () => <div data-testid="footer" />,
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

  it('renders Footer', () => {
    render(<App />)
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('renders MapCanvas, MapControls and DrawingToolbar inside the map area', () => {
    render(<App />)
    const canvas = screen.getByTestId('map-canvas')
    const controls = screen.getByTestId('map-controls')
    const toolbar = screen.getByTestId('drawing-toolbar')
    expect(canvas.parentElement).toBe(controls.parentElement)
    expect(canvas.parentElement).toBe(toolbar.parentElement)
  })

  it('renders map area and footer as siblings', () => {
    render(<App />)
    const canvas = screen.getByTestId('map-canvas')
    const footer = screen.getByTestId('footer')
    expect(canvas.parentElement?.parentElement).toBe(footer.parentElement)
  })

  it('has no a11y violations', async () => {
    const { container } = render(<App />)
    await act(async () => {
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
