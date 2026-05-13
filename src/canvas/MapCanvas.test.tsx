import { render, act } from '@testing-library/react'
import { configureAxe, toHaveNoViolations } from 'jest-axe'
import maplibregl from 'maplibre-gl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MapCanvas from './MapCanvas'
import mapApi from '../api'
import useInitialCenter from '../location/useInitialCenter'

vi.mock('../location/useInitialCenter')
vi.mock('../api')

expect.extend(toHaveNoViolations)

const axe = configureAxe()

vi.mock('maplibre-gl', async (importOriginal) => {
  const actual = await importOriginal<typeof maplibregl>()
  return {
    ...actual,
    default: {
      ...actual,
      Map: vi.fn().mockImplementation(function () {
        return {}
      }),
    },
  }
})

describe('MapCanvas', () => {
  beforeEach(() => {
    vi.mocked(maplibregl.Map).mockClear()
    vi.mocked(mapApi.register).mockClear()
    vi.mocked(mapApi.addLayer).mockClear()
    vi.mocked(mapApi.flyTo).mockClear()
    vi.mocked(mapApi.destroy).mockClear()
    vi.mocked(useInitialCenter).mockReturnValue(null)
  })

  afterEach(() => {
    delete window.map
  })

  it('renders the map container div', () => {
    const { container } = render(<MapCanvas />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('initialises maplibregl.Map with correct options', () => {
    render(<MapCanvas />)

    expect(maplibregl.Map).toHaveBeenCalledOnce()
    const callArg = vi.mocked(maplibregl.Map).mock.calls[0][0]
    expect(callArg.style).toBe(
      'https://api.maptiler.com/maps/019df8cf-b54b-74e9-81d2-7c1f124b88dd/style.json?key=test-key'
    )
    expect(callArg.container).toBeInstanceOf(HTMLElement)
    expect(callArg.center).toEqual([-3.7, 40.4])
    expect(callArg.zoom).toBe(3)
  })

  it('calls mapApi.register with the map instance after construction', () => {
    render(<MapCanvas />)
    expect(mapApi.register).toHaveBeenCalledOnce()
    expect(mapApi.register).toHaveBeenCalledWith(expect.any(Object))
  })

  it('calls mapApi.addLayer twice for contour-line and contour-label', () => {
    render(<MapCanvas />)
    const layerIds = vi.mocked(mapApi.addLayer).mock.calls.map(([layer]) => layer.id)
    expect(layerIds).toContain('contour-line')
    expect(layerIds).toContain('contour-label')
  })

  it('does not call mapApi.flyTo when useInitialCenter returns null', () => {
    vi.mocked(useInitialCenter).mockReturnValue(null)
    render(<MapCanvas />)
    expect(mapApi.flyTo).not.toHaveBeenCalled()
  })

  it('calls mapApi.flyTo with resolved coordinates when useInitialCenter returns a location', () => {
    vi.mocked(useInitialCenter).mockReturnValue([2.1734, 41.3851])
    render(<MapCanvas />)
    expect(mapApi.flyTo).toHaveBeenCalledWith({ center: [2.1734, 41.3851], zoom: 12 })
  })

  it('calls mapApi.destroy on unmount', () => {
    const { unmount } = render(<MapCanvas />)
    unmount()
    expect(mapApi.destroy).toHaveBeenCalledOnce()
  })

  it('has no a11y violations', async () => {
    const { container } = render(<MapCanvas />)
    await act(async () => {
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
