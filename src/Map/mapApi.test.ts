import { describe, it, expect, vi, afterEach } from 'vitest'
import mapApi from './mapApi'
import type maplibregl from 'maplibre-gl'

type MockMap = {
  remove: ReturnType<typeof vi.fn>
  addLayer: ReturnType<typeof vi.fn>
  flyTo: ReturnType<typeof vi.fn>
  zoomIn: ReturnType<typeof vi.fn>
  zoomOut: ReturnType<typeof vi.fn>
  isStyleLoaded: ReturnType<typeof vi.fn>
  once: ReturnType<typeof vi.fn>
}

function createMockMap(styleLoaded = true): MockMap {
  return {
    remove: vi.fn(),
    addLayer: vi.fn(),
    flyTo: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    isStyleLoaded: vi.fn(() => styleLoaded),
    once: vi.fn(),
  }
}

describe('mapApi', () => {
  afterEach(() => {
    mapApi.destroy()
    delete window.map
  })

  describe('register', () => {
    it('stores the instance and assigns window.map', () => {
      const mock = createMockMap()
      mapApi.register(mock as unknown as maplibregl.Map)
      expect(window.map).toBe(mock)
    })
  })

  describe('destroy', () => {
    it('calls map.remove(), deletes window.map, and nulls the internal ref', () => {
      const mock = createMockMap()
      mapApi.register(mock as unknown as maplibregl.Map)
      mapApi.destroy()
      expect(mock.remove).toHaveBeenCalledOnce()
      expect(window.map).toBeUndefined()
      mapApi.zoomIn()
      expect(mock.zoomIn).not.toHaveBeenCalled()
    })
  })

  describe('addLayer', () => {
    it('calls map.addLayer immediately when style is loaded', () => {
      const mock = createMockMap(true)
      mapApi.register(mock as unknown as maplibregl.Map)
      const layer = { id: 'test', type: 'line', source: 'src' } as maplibregl.LayerSpecification
      mapApi.addLayer(layer)
      expect(mock.addLayer).toHaveBeenCalledWith(layer)
    })

    it('defers via once("load") when style is not loaded', () => {
      const mock = createMockMap(false)
      mapApi.register(mock as unknown as maplibregl.Map)
      const layer = { id: 'test', type: 'line', source: 'src' } as maplibregl.LayerSpecification
      mapApi.addLayer(layer)
      expect(mock.addLayer).not.toHaveBeenCalled()
      expect(mock.once).toHaveBeenCalledWith('load', expect.any(Function))
      const handler = mock.once.mock.calls[0][1] as () => void
      handler()
      expect(mock.addLayer).toHaveBeenCalledWith(layer)
    })
  })

  describe('flyTo', () => {
    it('calls map.flyTo immediately when style is loaded', () => {
      const mock = createMockMap(true)
      mapApi.register(mock as unknown as maplibregl.Map)
      const opts: maplibregl.FlyToOptions = { center: [0, 0], zoom: 10 }
      mapApi.flyTo(opts)
      expect(mock.flyTo).toHaveBeenCalledWith(opts)
    })

    it('defers via once("load") when style is not loaded', () => {
      const mock = createMockMap(false)
      mapApi.register(mock as unknown as maplibregl.Map)
      const opts: maplibregl.FlyToOptions = { center: [0, 0], zoom: 10 }
      mapApi.flyTo(opts)
      expect(mock.flyTo).not.toHaveBeenCalled()
      expect(mock.once).toHaveBeenCalledWith('load', expect.any(Function))
      const handler = mock.once.mock.calls[0][1] as () => void
      handler()
      expect(mock.flyTo).toHaveBeenCalledWith(opts)
    })
  })

  describe('zoomIn', () => {
    it('delegates to map.zoomIn()', () => {
      const mock = createMockMap()
      mapApi.register(mock as unknown as maplibregl.Map)
      mapApi.zoomIn()
      expect(mock.zoomIn).toHaveBeenCalledOnce()
    })
  })

  describe('zoomOut', () => {
    it('delegates to map.zoomOut()', () => {
      const mock = createMockMap()
      mapApi.register(mock as unknown as maplibregl.Map)
      mapApi.zoomOut()
      expect(mock.zoomOut).toHaveBeenCalledOnce()
    })
  })

  describe('no-ops before register / after destroy', () => {
    it('all methods are no-ops when called before register', () => {
      const layer = { id: 'test' } as maplibregl.LayerSpecification
      expect(() => mapApi.addLayer(layer)).not.toThrow()
      expect(() => mapApi.flyTo({ center: [0, 0] })).not.toThrow()
      expect(() => mapApi.zoomIn()).not.toThrow()
      expect(() => mapApi.zoomOut()).not.toThrow()
      expect(() => mapApi.destroy()).not.toThrow()
    })
  })
})
