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

vi.mock('./hud/Coordinates', () => ({
  default: () => <div data-testid="coordinates" />,
}))

vi.mock('./hud/HudStatus', () => ({
  default: () => <div data-testid="hud-status" />,
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

  it('renders HudStatus', () => {
    render(<App />)
    expect(screen.getByTestId('hud-status')).toBeInTheDocument()
  })

  it('renders MapCanvas, MapControls, HudStatus and Coordinates inside the map area', () => {
    render(<App />)
    const canvas = screen.getByTestId('map-canvas')
    const controls = screen.getByTestId('map-controls')
    const coords = screen.getByTestId('coordinates')
    const hud = screen.getByTestId('hud-status')
    expect(canvas.parentElement).toBe(controls.parentElement)
    expect(canvas.parentElement).toBe(coords.parentElement)
    expect(canvas.parentElement).toBe(hud.parentElement)
  })

  it('renders DrawingToolbar as a sibling of the map area', () => {
    render(<App />)
    const toolbar = screen.getByTestId('drawing-toolbar')
    const canvas = screen.getByTestId('map-canvas')
    expect(toolbar.parentElement).toBe(canvas.parentElement?.parentElement)
  })

  it('has no a11y violations', async () => {
    const { container } = render(<App />)
    await act(async () => {
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
