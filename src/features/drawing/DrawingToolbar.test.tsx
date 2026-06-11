import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { configureAxe, toHaveNoViolations } from 'jest-axe'
import { act } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import mapApi, { useDrawing, Modes } from '../../api'
import type { DrawingState } from '../../api'
import DrawingToolbar from './DrawingToolbar'

vi.mock('../../api')

const emptyState: DrawingState = { isDrawing: false, hasCompleted: false, lineCount: 0, vertexCount: 0, distance: 0 }
const withVertex: DrawingState = { isDrawing: true, hasCompleted: false, lineCount: 0, vertexCount: 0, distance: 0 }

expect.extend(toHaveNoViolations)

const axe = configureAxe()

describe('DrawingToolbar', () => {
  beforeEach(() => {
    vi.mocked(mapApi.setDrawingMode).mockClear()
    vi.mocked(mapApi.cancelDrawing).mockClear()
    vi.mocked(mapApi.completeDrawing).mockClear()
    vi.mocked(useDrawing).mockReturnValue(emptyState)
  })

  it('renders a "Draw line" button with aria-pressed="false" by default', () => {
    render(<DrawingToolbar />)
    const btn = screen.getByRole('button', { name: /draw line/i })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
  })

  it('"Done" button is not present when mode is inactive', () => {
    render(<DrawingToolbar />)
    expect(screen.queryByRole('button', { name: /done/i })).toBeNull()
  })

  it('clicking "Draw line" sets aria-pressed="true" and calls setDrawingMode("line")', async () => {
    render(<DrawingToolbar />)
    await userEvent.click(screen.getByRole('button', { name: /draw line/i }))
    expect(screen.getByRole('button', { name: /draw line/i })).toHaveAttribute('aria-pressed', 'true')
    expect(mapApi.setDrawingMode).toHaveBeenCalledWith(Modes.LINE)
  })

  it('clicking "Draw line" again toggles back and calls setDrawingMode(null)', async () => {
    render(<DrawingToolbar />)
    await userEvent.click(screen.getByRole('button', { name: /draw line/i }))
    await userEvent.click(screen.getByRole('button', { name: /draw line/i }))
    expect(screen.getByRole('button', { name: /draw line/i })).toHaveAttribute('aria-pressed', 'false')
    expect(mapApi.setDrawingMode).toHaveBeenLastCalledWith(null)
  })

  it('"Done" button is NOT visible when mode is active but no vertices placed', async () => {
    vi.mocked(useDrawing).mockReturnValue(emptyState)
    render(<DrawingToolbar />)
    await userEvent.click(screen.getByRole('button', { name: /draw line/i }))
    expect(screen.queryByRole('button', { name: /done/i })).toBeNull()
  })

  it('"Done" button is visible when mode is active and at least one vertex placed; clicking it calls completeDrawing()', async () => {
    vi.mocked(useDrawing).mockReturnValue(withVertex)
    render(<DrawingToolbar />)
    await userEvent.click(screen.getByRole('button', { name: /draw line/i }))
    const doneBtn = screen.getByRole('button', { name: /done/i })
    expect(doneBtn).toBeInTheDocument()
    await userEvent.click(doneBtn)
    expect(mapApi.completeDrawing).toHaveBeenCalledOnce()
  })

  it('Escape keydown exits drawing mode and discards draft', async () => {
    render(<DrawingToolbar />)
    await userEvent.click(screen.getByRole('button', { name: /draw line/i }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(mapApi.setDrawingMode).toHaveBeenLastCalledWith(Modes.VIEW)
    expect(mapApi.cancelDrawing).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /draw line/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('Enter keydown calls completeDrawing() when mode is active; mode stays active', async () => {
    render(<DrawingToolbar />)
    await userEvent.click(screen.getByRole('button', { name: /draw line/i }))
    fireEvent.keyDown(document, { key: 'Enter' })
    expect(mapApi.completeDrawing).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: /draw line/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('Escape keydown is a no-op when mode is inactive', () => {
    render(<DrawingToolbar />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(mapApi.setDrawingMode).not.toHaveBeenCalled()
    expect(mapApi.cancelDrawing).not.toHaveBeenCalled()
  })

  it('Enter keydown is a no-op when mode is inactive', () => {
    render(<DrawingToolbar />)
    fireEvent.keyDown(document, { key: 'Enter' })
    expect(mapApi.completeDrawing).not.toHaveBeenCalled()
  })

  it('has no a11y violations in idle state', async () => {
    const { container } = render(<DrawingToolbar />)
    await act(async () => {
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  it('has no a11y violations in active state with vertices', async () => {
    vi.mocked(useDrawing).mockReturnValue(withVertex)
    const { container } = render(<DrawingToolbar />)
    await userEvent.click(screen.getByRole('button', { name: /draw line/i }))
    await act(async () => {
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
