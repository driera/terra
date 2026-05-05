import { render, act } from '@testing-library/react'
import { configureAxe, toHaveNoViolations } from 'jest-axe'
import maplibregl from 'maplibre-gl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Map from './Map'

expect.extend(toHaveNoViolations)

const axe = configureAxe()

const mockRemove = vi.fn()
const mockOn = vi.fn()
const mockAddSource = vi.fn()
const mockAddLayer = vi.fn()
const mockSetLayoutProperty = vi.fn()

vi.mock('maplibre-gl', async (importOriginal) => {
  const actual = await importOriginal<typeof maplibregl>()
  return {
    ...actual,
    default: {
      ...actual,
      Map: vi.fn().mockImplementation(function () {
        return {
          remove: mockRemove,
          on: mockOn,
          addSource: mockAddSource,
          addLayer: mockAddLayer,
          setLayoutProperty: mockSetLayoutProperty,
        }
      }),
    },
  }
})

function triggerLoad() {
  const loadCall = mockOn.mock.calls.find(([event]) => event === 'load')
  if (loadCall) loadCall[1]()
}

describe('Map', () => {
  beforeEach(() => {
    mockRemove.mockClear()
    mockOn.mockClear()
    mockAddSource.mockClear()
    mockAddLayer.mockClear()
    mockSetLayoutProperty.mockClear()
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
    expect(callArg.style).toBe(
      'https://api.maptiler.com/maps/outdoor-v2/style.json?key=test-key'
    )
    expect(callArg.container).toBeInstanceOf(HTMLElement)
    expect(callArg.center).toEqual([2.1734, 41.3851])
    expect(callArg.zoom).toBe(12)
  })

  it('assigns the map instance to window.map on mount', () => {
    render(<Map />)
    expect(window.map).toBeDefined()
  })

  it('registers a load event handler', () => {
    render(<Map />)
    expect(mockOn).toHaveBeenCalledWith('load', expect.any(Function))
  })

  it('hides native outdoor-v2 contour layers on load', () => {
    render(<Map />)
    triggerLoad()

    const hiddenLayers = mockSetLayoutProperty.mock.calls.map(([id]) => id)
    expect(hiddenLayers).toContain('Contour')
    expect(hiddenLayers).toContain('Contour index')
    expect(hiddenLayers).toContain('Contour labels')
    expect(hiddenLayers).toContain('Glacier contour')
    expect(hiddenLayers).toContain('Glacier contour index')
    expect(hiddenLayers).toContain('Glacier contour labels')
    mockSetLayoutProperty.mock.calls.forEach(([, prop, value]) => {
      expect(prop).toBe('visibility')
      expect(value).toBe('none')
    })
  })

  it('adds the contours-v2 source on load', () => {
    render(<Map />)
    triggerLoad()

    expect(mockAddSource).toHaveBeenCalledOnce()
    const [sourceId, sourceConfig] = mockAddSource.mock.calls[0]
    expect(sourceId).toBe('contours')
    expect(sourceConfig.type).toBe('vector')
    expect(sourceConfig.url).toContain('contours-v2')
    expect(sourceConfig.url).toContain('test-key')
  })

  it('adds contour line and label layers on load', () => {
    render(<Map />)
    triggerLoad()

    const layerIds = mockAddLayer.mock.calls.map(([layer]) => layer.id)
    expect(layerIds).toContain('contour-line')
    expect(layerIds).toContain('contour-label')

    const lineLayer = mockAddLayer.mock.calls.find(
      ([layer]) => layer.id === 'contour-line'
    )![0]
    expect(lineLayer.type).toBe('line')
    expect(lineLayer.source).toBe('contours')
    expect(lineLayer['source-layer']).toBe('contour')

    const labelLayer = mockAddLayer.mock.calls.find(
      ([layer]) => layer.id === 'contour-label'
    )![0]
    expect(labelLayer.type).toBe('symbol')
    expect(labelLayer.source).toBe('contours')
    expect(labelLayer['source-layer']).toBe('contour')
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
