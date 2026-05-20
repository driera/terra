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

  it('renders nothing when geometries is empty', () => {
    vi.mocked(useDrawing as Mock).mockReturnValue({ geometries: [] })
    const { container } = render(<DrawingMetadata />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows "1 line" when one geometry is present', () => {
    vi.mocked(useDrawing as Mock).mockReturnValue({
      geometries: [makeLine([[0, 0], [1, 1]])],
    })
    render(<DrawingMetadata />)
    expect(screen.getByText(/1 line/)).toBeInTheDocument()
  })

  it('shows plural "lines" when more than one geometry is present', () => {
    vi.mocked(useDrawing as Mock).mockReturnValue({
      geometries: [makeLine([[0, 0], [1, 1]]), makeLine([[2, 2], [3, 3], [4, 4]])],
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
    })
    render(<DrawingMetadata />)
    expect(screen.getByText(/5 vertices/)).toBeInTheDocument()
  })

  it('has no a11y violations when showing metadata', async () => {
    vi.mocked(useDrawing as Mock).mockReturnValue({
      geometries: [makeLine([[0, 0], [1, 1]])],
    })
    const { container } = render(<DrawingMetadata />)
    await act(async () => {
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
