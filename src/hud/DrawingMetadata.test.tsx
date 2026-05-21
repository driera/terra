import { render, screen, act } from '@testing-library/react'
import { configureAxe, toHaveNoViolations } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { useDrawing } from '../api'
import type { DrawingState } from '../api'
import DrawingMetadata from './DrawingMetadata'

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api')>()
  return { ...actual, useDrawing: vi.fn() }
})

expect.extend(toHaveNoViolations)

const axe = configureAxe()

const makeState = (overrides: Partial<DrawingState> = {}): DrawingState => ({
  isDrawing: false,
  hasCompleted: false,
  lineCount: 0,
  vertexCount: 0,
  distance: 0,
  ...overrides,
})

describe('DrawingMetadata', () => {
  beforeEach(() => {
    vi.mocked(useDrawing as Mock).mockReset()
  })

  it('renders nothing when there is no drawing activity', () => {
    vi.mocked(useDrawing as Mock).mockReturnValue(makeState())
    const { container } = render(<DrawingMetadata />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders only distance when drawing with no completed geometries', () => {
    vi.mocked(useDrawing as Mock).mockReturnValue(
      makeState({ isDrawing: true, distance: 340 })
    )
    render(<DrawingMetadata />)
    expect(screen.getByText('340 m')).toBeInTheDocument()
    expect(screen.queryByText(/line/)).toBeNull()
  })

  it('distance span is not muted when drawing with no completed geometries', () => {
    vi.mocked(useDrawing as Mock).mockReturnValue(
      makeState({ isDrawing: true, distance: 340 })
    )
    render(<DrawingMetadata />)
    expect(screen.getByText('340 m').className).not.toMatch(/muted/)
  })

  it('renders lines+vertices and distance when completed and not drawing', () => {
    vi.mocked(useDrawing as Mock).mockReturnValue(
      makeState({ hasCompleted: true, lineCount: 1, vertexCount: 5, distance: 1500 })
    )
    render(<DrawingMetadata />)
    expect(screen.getByText(/1 line/)).toBeInTheDocument()
    expect(screen.getByText(/5 vertices/)).toBeInTheDocument()
    expect(screen.getByText('1500 m')).toBeInTheDocument()
  })

  it('shows "lines" plural when lineCount > 1', () => {
    vi.mocked(useDrawing as Mock).mockReturnValue(
      makeState({ hasCompleted: true, lineCount: 2, vertexCount: 4, distance: 200 })
    )
    render(<DrawingMetadata />)
    expect(screen.getByText(/2 lines/)).toBeInTheDocument()
  })

  it('neither span is muted when completed and not drawing', () => {
    vi.mocked(useDrawing as Mock).mockReturnValue(
      makeState({ hasCompleted: true, lineCount: 1, vertexCount: 2, distance: 500 })
    )
    render(<DrawingMetadata />)
    expect(screen.getByText(/1 line/).className).not.toMatch(/muted/)
    expect(screen.getByText('500 m').className).not.toMatch(/muted/)
  })

  it('stats span is muted when drawing with completed geometries', () => {
    vi.mocked(useDrawing as Mock).mockReturnValue(
      makeState({ isDrawing: true, hasCompleted: true, lineCount: 1, vertexCount: 2, distance: 700 })
    )
    render(<DrawingMetadata />)
    expect(screen.getByText(/1 line/).className).toMatch(/muted/)
  })

  it('distance span is NOT muted when drawing with completed geometries', () => {
    vi.mocked(useDrawing as Mock).mockReturnValue(
      makeState({ isDrawing: true, hasCompleted: true, lineCount: 1, vertexCount: 2, distance: 700 })
    )
    render(<DrawingMetadata />)
    expect(screen.getByText('700 m').className).not.toMatch(/muted/)
  })

  it('has no a11y violations when showing completed metadata', async () => {
    vi.mocked(useDrawing as Mock).mockReturnValue(
      makeState({ hasCompleted: true, lineCount: 1, vertexCount: 2, distance: 340 })
    )
    const { container } = render(<DrawingMetadata />)
    await act(async () => {
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  it('has no a11y violations when drawing with only the distance span visible', async () => {
    vi.mocked(useDrawing as Mock).mockReturnValue(
      makeState({ isDrawing: true, distance: 340 })
    )
    const { container } = render(<DrawingMetadata />)
    await act(async () => {
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
