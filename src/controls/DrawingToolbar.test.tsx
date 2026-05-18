import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { configureAxe, toHaveNoViolations } from 'jest-axe'
import { act } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import mapApi from '../api'
import DrawingToolbar from './DrawingToolbar'

vi.mock('../api')

expect.extend(toHaveNoViolations)

const axe = configureAxe()

describe('DrawingToolbar', () => {
  beforeEach(() => {
    vi.mocked(mapApi.setDrawingMode).mockClear()
    vi.mocked(mapApi.cancelDrawing).mockClear()
    vi.mocked(mapApi.completeDrawing).mockClear()
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
    expect(mapApi.setDrawingMode).toHaveBeenCalledWith('line')
  })

  it('clicking "Draw line" again toggles back and calls setDrawingMode(null)', async () => {
    render(<DrawingToolbar />)
    await userEvent.click(screen.getByRole('button', { name: /draw line/i }))
    await userEvent.click(screen.getByRole('button', { name: /draw line/i }))
    expect(screen.getByRole('button', { name: /draw line/i })).toHaveAttribute('aria-pressed', 'false')
    expect(mapApi.setDrawingMode).toHaveBeenLastCalledWith(null)
  })

  it('"Done" button is visible when mode is active and clicking it calls completeDrawing()', async () => {
    render(<DrawingToolbar />)
    await userEvent.click(screen.getByRole('button', { name: /draw line/i }))
    const doneBtn = screen.getByRole('button', { name: /done/i })
    expect(doneBtn).toBeInTheDocument()
    await userEvent.click(doneBtn)
    expect(mapApi.completeDrawing).toHaveBeenCalledOnce()
  })

  it('Escape keydown calls cancelDrawing() when mode is active; mode stays active', async () => {
    render(<DrawingToolbar />)
    await userEvent.click(screen.getByRole('button', { name: /draw line/i }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(mapApi.cancelDrawing).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: /draw line/i })).toHaveAttribute('aria-pressed', 'true')
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

  it('has no a11y violations in active state', async () => {
    const { container } = render(<DrawingToolbar />)
    await userEvent.click(screen.getByRole('button', { name: /draw line/i }))
    await act(async () => {
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
