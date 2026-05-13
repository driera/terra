import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { configureAxe, toHaveNoViolations } from 'jest-axe'
import { act } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import mapApi from '../mapApi'
import MapControls from './MapControls'

vi.mock('../mapApi')

expect.extend(toHaveNoViolations)

const axe = configureAxe()

describe('MapControls', () => {
  beforeEach(() => {
    vi.mocked(mapApi.zoomIn).mockClear()
    vi.mocked(mapApi.zoomOut).mockClear()
  })

  it('calls mapApi.zoomIn() when zoom in button is clicked', async () => {
    render(<MapControls />)
    await userEvent.click(screen.getByRole('button', { name: /zoom in/i }))
    expect(mapApi.zoomIn).toHaveBeenCalledOnce()
  })

  it('calls mapApi.zoomOut() when zoom out button is clicked', async () => {
    render(<MapControls />)
    await userEvent.click(screen.getByRole('button', { name: /zoom out/i }))
    expect(mapApi.zoomOut).toHaveBeenCalledOnce()
  })

  it('zoom in button is keyboard accessible', async () => {
    render(<MapControls />)
    const button = screen.getByRole('button', { name: /zoom in/i })
    button.focus()
    await userEvent.keyboard('{Enter}')
    expect(mapApi.zoomIn).toHaveBeenCalledOnce()
  })

  it('zoom out button is keyboard accessible', async () => {
    render(<MapControls />)
    const button = screen.getByRole('button', { name: /zoom out/i })
    button.focus()
    await userEvent.keyboard('{Enter}')
    expect(mapApi.zoomOut).toHaveBeenCalledOnce()
  })

  it('has no a11y violations', async () => {
    const { container } = render(<MapControls />)
    await act(async () => {
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
