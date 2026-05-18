import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type maplibregl from 'maplibre-gl'
import type GeoJSON from 'geojson'
import * as drawing from './drawing'

type MockSource = { setData: Mock<(data: unknown) => void> }

type MockCanvas = { style: { cursor: string } }

type MockMap = {
  on: Mock<(name: string, cb: (e: unknown) => void) => void>
  off: Mock<(name: string, cb: (e: unknown) => void) => void>
  once: Mock<(name: string, cb: () => void) => void>
  isStyleLoaded: Mock<() => boolean>
  getSource: Mock<(id: string) => MockSource | undefined>
  addSource: Mock<(id: string, source: unknown) => void>
  addLayer: Mock<(layer: unknown) => void>
  getCanvas: Mock<() => MockCanvas>
  _canvas: MockCanvas
}

function createMockSource(): MockSource {
  return { setData: vi.fn() }
}

function createMockMap(styleLoaded = true): MockMap {
  const sources: Record<string, MockSource> = {}
  const canvas: MockCanvas = { style: { cursor: '' } }
  const map: MockMap = {
    on: vi.fn(),
    off: vi.fn(),
    once: vi.fn(),
    isStyleLoaded: vi.fn().mockReturnValue(styleLoaded),
    getSource: vi.fn((id: string) => sources[id]),
    addSource: vi.fn((id: string) => {
      sources[id] = createMockSource()
    }),
    addLayer: vi.fn(),
    getCanvas: vi.fn(() => canvas),
    _canvas: canvas,
  }
  return map
}

function fireLngLat(map: MockMap, eventName: string, lng: number, lat: number) {
  const call = map.on.mock.calls.find(([name]) => name === eventName)
  if (!call) throw new Error(`No handler for ${eventName}`)
  ;(call[1] as (e: unknown) => void)({ lngLat: { lng, lat } })
}

function getSourceData(map: MockMap, id: 'terra-draft' | 'terra-features'): GeoJSON.FeatureCollection {
  const source = map.getSource(id) as MockSource
  const calls = source.setData.mock.calls
  return calls[calls.length - 1][0] as GeoJSON.FeatureCollection
}

describe('drawing', () => {
  beforeEach(() => {
    drawing.destroy()
  })

  describe('init/destroy', () => {
    it('registers terra-draft and terra-features sources after style loads', () => {
      const map = createMockMap(true)
      drawing.init(map as unknown as maplibregl.Map)
      expect(map.addSource).toHaveBeenCalledWith('terra-draft', expect.objectContaining({ type: 'geojson' }))
      expect(map.addSource).toHaveBeenCalledWith('terra-features', expect.objectContaining({ type: 'geojson' }))
    })

    it('registers two layers after style loads', () => {
      const map = createMockMap(true)
      drawing.init(map as unknown as maplibregl.Map)
      expect(map.addLayer).toHaveBeenCalledTimes(2)
    })

    it('waits for map.once("load") when style is not yet loaded', () => {
      const map = createMockMap(false)
      drawing.init(map as unknown as maplibregl.Map)
      expect(map.addSource).not.toHaveBeenCalled()
      const onceCall = map.once.mock.calls.find(([name]) => name === 'load')
      expect(onceCall).toBeDefined()
      ;(onceCall![1] as () => void)()
      expect(map.addSource).toHaveBeenCalledTimes(2)
      expect(map.addLayer).toHaveBeenCalledTimes(2)
    })

    it('destroys previous state when init is called twice (re-entry guard)', () => {
      const first = createMockMap()
      const second = createMockMap()
      drawing.init(first as unknown as maplibregl.Map)
      drawing.init(second as unknown as maplibregl.Map)
      expect(first.off).toHaveBeenCalled()
      expect(second.addSource).toHaveBeenCalledTimes(2)
    })

    it('destroy nulls map ref and resets store; no-op when not initialised', () => {
      expect(() => drawing.destroy()).not.toThrow()
      const map = createMockMap()
      drawing.init(map as unknown as maplibregl.Map)
      drawing.destroy()
      expect(drawing.getGeometry().vertices).toEqual([])
    })
  })

  describe('event handling and _syncToMap', () => {
    it('onClick in line mode appends vertex and updates terra-draft', () => {
      const map = createMockMap()
      drawing.init(map as unknown as maplibregl.Map)
      drawing.setMode('line')
      fireLngLat(map, 'click', 1, 2)
      expect(drawing.getGeometry().vertices).toEqual([[1, 2]])
    })

    it('onClick when mode is null is a no-op', () => {
      const map = createMockMap()
      drawing.init(map as unknown as maplibregl.Map)
      drawing.setMode(null)
      fireLngLat(map, 'click', 1, 2)
      expect(drawing.getGeometry().vertices).toEqual([])
    })

    it('onMouseMove in line mode updates cursor in store', () => {
      const map = createMockMap()
      drawing.init(map as unknown as maplibregl.Map)
      drawing.setMode('line')
      fireLngLat(map, 'mousemove', 5, 6)
      expect(drawing.getGeometry().cursor).toEqual([5, 6])
    })

    it('onMouseMove when mode is null is a no-op', () => {
      const map = createMockMap()
      drawing.init(map as unknown as maplibregl.Map)
      drawing.setMode(null)
      fireLngLat(map, 'mousemove', 5, 6)
      expect(drawing.getGeometry().cursor).toBeNull()
    })

    it('draft source receives empty FC when fewer than 2 coords', () => {
      const map = createMockMap()
      drawing.init(map as unknown as maplibregl.Map)
      drawing.setMode('line')
      fireLngLat(map, 'click', 1, 2)
      const data = getSourceData(map, 'terra-draft')
      expect(data.type).toBe('FeatureCollection')
      expect(data.features).toHaveLength(0)
    })

    it('draft source receives LineString Feature when >= 2 coords', () => {
      const map = createMockMap()
      drawing.init(map as unknown as maplibregl.Map)
      drawing.setMode('line')
      fireLngLat(map, 'mousemove', 2, 3)
      fireLngLat(map, 'click', 1, 2)
      const data = getSourceData(map, 'terra-draft')
      expect(data.features[0].geometry.type).toBe('LineString')
    })

    it('_syncToMap is a no-op when map is null', () => {
      expect(() => drawing.cancel()).not.toThrow()
    })

    it('click before style loads does not throw; data flushes after load', () => {
      const map = createMockMap(false)
      drawing.init(map as unknown as maplibregl.Map)
      drawing.setMode('line')
      expect(() => fireLngLat(map, 'click', 1, 2)).not.toThrow()
      const onceCall = map.once.mock.calls.find(([name]) => name === 'load')
      ;(onceCall![1] as () => void)()
      fireLngLat(map, 'click', 3, 4)
      const data = getSourceData(map, 'terra-draft')
      const geom = data.features[0].geometry as GeoJSON.LineString
      expect(geom.coordinates).toEqual([[1, 2], [3, 4]])
    })

    it('destroy detaches click and mousemove listeners', () => {
      const map = createMockMap()
      drawing.init(map as unknown as maplibregl.Map)
      drawing.destroy()
      expect(map.off).toHaveBeenCalledWith('click', expect.any(Function))
      expect(map.off).toHaveBeenCalledWith('mousemove', expect.any(Function))
    })
  })

  describe('complete / cancel', () => {
    it('complete with >= 2 vertices adds a Feature<LineString> and clears draft', () => {
      const map = createMockMap()
      drawing.init(map as unknown as maplibregl.Map)
      drawing.setMode('line')
      fireLngLat(map, 'click', 0, 0)
      fireLngLat(map, 'click', 1, 1)
      drawing.complete()
      const state = drawing.getGeometry()
      expect(state.vertices).toEqual([])
      expect(state.cursor).toBeNull()
      expect(state.geometries).toHaveLength(1)
      expect(state.geometries[0].geometry.type).toBe('LineString')
    })

    it('complete with fewer than 2 vertices is a no-op', () => {
      const map = createMockMap()
      drawing.init(map as unknown as maplibregl.Map)
      drawing.setMode('line')
      fireLngLat(map, 'click', 0, 0)
      drawing.complete()
      expect(drawing.getGeometry().geometries).toHaveLength(0)
      expect(drawing.getGeometry().vertices).toHaveLength(1)
    })

    it('cancel clears draft; geometries unchanged', () => {
      const map = createMockMap()
      drawing.init(map as unknown as maplibregl.Map)
      drawing.setMode('line')
      fireLngLat(map, 'click', 0, 0)
      fireLngLat(map, 'click', 1, 1)
      drawing.complete()
      fireLngLat(map, 'click', 2, 2)
      drawing.cancel()
      expect(drawing.getGeometry().vertices).toEqual([])
      expect(drawing.getGeometry().geometries).toHaveLength(1)
    })

    it('terra-features source is updated after complete', () => {
      const map = createMockMap()
      drawing.init(map as unknown as maplibregl.Map)
      drawing.setMode('line')
      fireLngLat(map, 'click', 0, 0)
      fireLngLat(map, 'click', 1, 1)
      drawing.complete()
      const data = getSourceData(map, 'terra-features')
      expect(data.features).toHaveLength(1)
    })

    it('terra-draft source is cleared after cancel', () => {
      const map = createMockMap()
      drawing.init(map as unknown as maplibregl.Map)
      drawing.setMode('line')
      fireLngLat(map, 'click', 0, 0)
      fireLngLat(map, 'mousemove', 1, 1)
      drawing.cancel()
      const data = getSourceData(map, 'terra-draft')
      expect(data.features).toHaveLength(0)
    })

    it('setMode("line") sets the map canvas cursor to crosshair', () => {
      const map = createMockMap()
      drawing.init(map as unknown as maplibregl.Map)
      drawing.setMode('line')
      expect(map._canvas.style.cursor).toBe('crosshair')
    })

    it('setMode(null) restores the default map canvas cursor', () => {
      const map = createMockMap()
      drawing.init(map as unknown as maplibregl.Map)
      drawing.setMode('line')
      drawing.setMode(null)
      expect(map._canvas.style.cursor).toBe('')
    })

    it('setMode(null) while drafting discards in-progress vertices and cursor', () => {
      const map = createMockMap()
      drawing.init(map as unknown as maplibregl.Map)
      drawing.setMode('line')
      fireLngLat(map, 'click', 0, 0)
      fireLngLat(map, 'mousemove', 1, 1)
      drawing.setMode(null)
      const state = drawing.getGeometry()
      expect(state.vertices).toEqual([])
      expect(state.cursor).toBeNull()
    })

    it('setMode(null) while drafting clears terra-draft source and preserves geometries', () => {
      const map = createMockMap()
      drawing.init(map as unknown as maplibregl.Map)
      drawing.setMode('line')
      fireLngLat(map, 'click', 0, 0)
      fireLngLat(map, 'click', 1, 1)
      drawing.complete()
      drawing.setMode('line')
      fireLngLat(map, 'click', 2, 2)
      drawing.setMode(null)
      const draft = getSourceData(map, 'terra-draft')
      expect(draft.features).toHaveLength(0)
      expect(drawing.getGeometry().geometries).toHaveLength(1)
    })
  })

  describe('useDrawing', () => {
    it('rerenders when vertices changes; not when only cursor changes', () => {
      const map = createMockMap()
      drawing.init(map as unknown as maplibregl.Map)
      drawing.setMode('line')
      let renderCount = 0
      const { result } = renderHook(() => {
        renderCount++
        return drawing.useDrawing(['vertices'])
      })
      const before = renderCount
      act(() => { fireLngLat(map, 'mousemove', 1, 1) })
      expect(renderCount).toBe(before)
      act(() => { fireLngLat(map, 'click', 1, 1) })
      expect(renderCount).toBeGreaterThan(before)
      expect(result.current.vertices).toHaveLength(1)
    })

    it('unsubscribes from the store on unmount', () => {
      const map = createMockMap()
      drawing.init(map as unknown as maplibregl.Map)
      drawing.setMode('line')
      let renderCount = 0
      const { unmount } = renderHook(() => {
        renderCount++
        return drawing.useDrawing(['vertices'])
      })
      unmount()
      const before = renderCount
      act(() => { fireLngLat(map, 'click', 1, 1) })
      expect(renderCount).toBe(before)
    })
  })
})
