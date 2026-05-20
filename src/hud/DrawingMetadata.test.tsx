import { render, screen, act } from '@testing-library/react'
import { configureAxe, toHaveNoViolations } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { useDrawing } from '../api'
import DrawingMetadata from './DrawingMetadata'

vi.mock('../api')

expect.extend(toHaveNoViolations)

const axe = configureAxe()

const makeLine = (coords: [number, number][]): GeoJSON.Feature<GeoJSON.LineString> => ({
  type: 'Feature',
  geometry: { type: 'LineString', coordinates: coords },
  properties: {},
})

describe('DrawingMetadata', () => {
  beforeEach(() => {
    vi.mocked(useDrawing as Mock).mockReset()
  })

  it('renders nothing when geometries and vertices are empty', () => {
    vi.mocked(useDrawing as Mock).mockReturnValue({ geometries: [], vertices: [] })
    const { container } = render(<DrawingMetadata />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows "drawing…" when vertices exist but no completed geometries', () => {
    vi.mocked(useDrawing as Mock).mockReturnValue({
      geometries: [],
      vertices: [[0, 0], [1, 1]],
    })
    render(<DrawingMetadata />)
    expect(screen.getByText('drawing…')).toBeInTheDocument()
  })

  it('shows "1 line" when one geometry is present', () => {
    vi.mocked(useDrawing as Mock).mockReturnValue({
      geometries: [makeLine([[0, 0], [1, 1]])],
      vertices: [],
    })
    render(<DrawingMetadata />)
    expect(screen.getByText(/1 line/)).toBeInTheDocument()
  })

  it('shows plural "lines" when more than one geometry is present', () => {
    vi.mocked(useDrawing as Mock).mockReturnValue({
      geometries: [makeLine([[0, 0], [1, 1]]), makeLine([[2, 2], [3, 3], [4, 4]])],
      vertices: [],
    })
    render(<DrawingMetadata />)
    expect(screen.getByText(/2 lines/)).toBeInTheDocument()
  })

  it('shows the total vertex count across all geometries', () => {
    vi.mocked(useDrawing as Mock).mockReturnValue({
      geometries: [
        makeLine([[0, 0], [1, 1], [2, 2]]),
        makeLine([[3, 3], [4, 4]]),
      ],
      vertices: [],
    })
    render(<DrawingMetadata />)
    expect(screen.getByText(/5 vertices/)).toBeInTheDocument()
  })

  it('shows stats and "drawing…" as separate elements when drawing with completed geometries', () => {
    vi.mocked(useDrawing as Mock).mockReturnValue({
      geometries: [makeLine([[0, 0], [1, 1]])],
      vertices: [[2, 2], [3, 3]],
    })
    render(<DrawingMetadata />)
    expect(screen.getByText(/1 line/)).toBeInTheDocument()
    expect(screen.getByText('drawing…')).toBeInTheDocument()
    expect(screen.getByText(/1 line/)).not.toBe(screen.getByText('drawing…'))
  })

  it('mutes stats but not the drawing… label when drawing', () => {
    vi.mocked(useDrawing as Mock).mockReturnValue({
      geometries: [makeLine([[0, 0], [1, 1]])],
      vertices: [[2, 2], [3, 3]],
    })
    render(<DrawingMetadata />)
    const stats = screen.getByText(/1 line/)
    const indicator = screen.getByText('drawing…')
    expect(stats.className).toMatch(/muted/)
    expect(indicator.className).not.toMatch(/muted/)
  })

  it('has no a11y violations when showing metadata', async () => {
    vi.mocked(useDrawing as Mock).mockReturnValue({
      geometries: [makeLine([[0, 0], [1, 1]])],
      vertices: [],
    })
    const { container } = render(<DrawingMetadata />)
    await act(async () => {
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
