import { render, act } from '@testing-library/react'
import { configureAxe, toHaveNoViolations } from 'jest-axe'
import maplibregl from 'maplibre-gl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Map from './Map'

expect.extend(toHaveNoViolations)

const axe = configureAxe()

const mockRemove = vi.fn()

vi.mock('maplibre-gl', async (importOriginal) => {
  const actual = await importOriginal<typeof maplibregl>()
  return {
    ...actual,
    default: {
      ...actual,
      Map: vi.fn().mockImplementation(function () {
        return {
          remove: mockRemove,
          on: vi.fn(),
        }
      }),
    },
  }
})

describe('Map', () => {
  beforeEach(() => {
    mockRemove.mockClear()
    vi.mocked(maplibregl.Map).mockClear()
  })

  afterEach(() => {
    delete window.map
  })

  it('renders the map container div', () => {
    const { container } = render(<Map />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('initialises maplibregl.Map with correct options', () => {
    render(<Map />)

    expect(maplibregl.Map).toHaveBeenCalledOnce()
    const callArg = vi.mocked(maplibregl.Map).mock.calls[0][0]
    expect(callArg.style).toBe('https://tiles.openfreemap.org/styles/liberty')
    expect(callArg.container).toBeInstanceOf(HTMLElement)
    expect(callArg.center).toEqual([2.1734, 41.3851])
    expect(callArg.zoom).toBe(12)
  })

  it('assigns the map instance to window.map on mount', () => {
    render(<Map />)
    expect(window.map).toBeDefined()
  })

  it('calls map.remove() and deletes window.map on unmount', () => {
    const { unmount } = render(<Map />)
    unmount()
    expect(mockRemove).toHaveBeenCalledOnce()
    expect(window.map).toBeUndefined()
  })

  it('has no a11y violations', async () => {
    const { container } = render(<Map />)
    await act(async () => {
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
