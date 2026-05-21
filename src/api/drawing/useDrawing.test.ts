import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type maplibregl from 'maplibre-gl'
import * as drawing from './drawing'
import { Modes } from './drawing'
import { useDrawing } from './useDrawing'
import * as distanceModule from './distance'

type MockMap = {
  on: ReturnType<typeof vi.fn>
  off: ReturnType<typeof vi.fn>
  once: ReturnType<typeof vi.fn>
  isStyleLoaded: ReturnType<typeof vi.fn>
  getSource: ReturnType<typeof vi.fn>
  addSource: ReturnType<typeof vi.fn>
  addLayer: ReturnType<typeof vi.fn>
  getCanvas: ReturnType<typeof vi.fn>
}

function createMockMap(styleLoaded = true): MockMap {
  const sources: Record<string, { setData: ReturnType<typeof vi.fn> }> = {}
  const canvas = { style: { cursor: '' } }
  return {
    on: vi.fn(),
    off: vi.fn(),
    once: vi.fn(),
    isStyleLoaded: vi.fn().mockReturnValue(styleLoaded),
    getSource: vi.fn((id: string) => sources[id]),
    addSource: vi.fn((id: string) => { sources[id] = { setData: vi.fn() } }),
    addLayer: vi.fn(),
    getCanvas: vi.fn(() => canvas),
  }
}

function fireLngLat(map: MockMap, eventName: string, lng: number, lat: number) {
  const call = map.on.mock.calls.find(([name]) => name === eventName)
  if (!call) throw new Error(`No handler for ${eventName}`)
  ;(call[1] as (e: unknown) => void)({ lngLat: { lng, lat } })
}

describe('useDrawing', () => {
  beforeEach(() => { drawing.destroy() })

  it('returns defaults when store is empty', () => {
    const map = createMockMap()
    drawing.init(map as unknown as maplibregl.Map)
    const { result } = renderHook(() => useDrawing(['geometries', 'vertices', 'cursor']))
    expect(result.current.isDrawing).toBe(false)
    expect(result.current.hasCompleted).toBe(false)
    expect(result.current.lineCount).toBe(0)
    expect(result.current.vertexCount).toBe(0)
    expect(result.current.distance).toBe(0)
  })

  it('isDrawing is true when vertices are present', () => {
    const map = createMockMap()
    drawing.init(map as unknown as maplibregl.Map)
    drawing.setMode(Modes.LINE)
    const { result } = renderHook(() => useDrawing(['geometries', 'vertices', 'cursor']))
    act(() => { fireLngLat(map, 'click', 1, 2) })
    expect(result.current.isDrawing).toBe(true)
  })

  it('distance includes cursor as endpoint when present', () => {
    const map = createMockMap()
    drawing.init(map as unknown as maplibregl.Map)
    drawing.setMode(Modes.LINE)
    const { result } = renderHook(() => useDrawing(['geometries', 'vertices', 'cursor']))
    act(() => { fireLngLat(map, 'click', 0, 0) })
    act(() => { fireLngLat(map, 'mousemove', 1, 0) })
    expect(result.current.distance).toBeGreaterThan(0)
  })

  it('hasCompleted and lineCount update after completing a line', () => {
    const map = createMockMap()
    drawing.init(map as unknown as maplibregl.Map)
    drawing.setMode(Modes.LINE)
    const { result } = renderHook(() => useDrawing(['geometries', 'vertices', 'cursor']))
    act(() => {
      fireLngLat(map, 'click', 0, 0)
      fireLngLat(map, 'click', 1, 0)
      drawing.complete()
    })
    expect(result.current.hasCompleted).toBe(true)
    expect(result.current.lineCount).toBe(1)
    expect(result.current.vertexCount).toBe(2)
  })

  it('vertexCount sums vertices across multiple completed geometries', () => {
    const map = createMockMap()
    drawing.init(map as unknown as maplibregl.Map)
    drawing.setMode(Modes.LINE)
    const { result } = renderHook(() => useDrawing(['geometries', 'vertices', 'cursor']))
    act(() => {
      fireLngLat(map, 'click', 0, 0)
      fireLngLat(map, 'click', 1, 0)
      drawing.complete()
      fireLngLat(map, 'click', 2, 0)
      fireLngLat(map, 'click', 3, 0)
      fireLngLat(map, 'click', 4, 0)
      drawing.complete()
    })
    expect(result.current.lineCount).toBe(2)
    expect(result.current.vertexCount).toBe(5)
  })

  it('subscribing to ["vertices"] does not re-render on cursor-only changes', () => {
    const map = createMockMap()
    drawing.init(map as unknown as maplibregl.Map)
    drawing.setMode(Modes.LINE)
    let renderCount = 0
    renderHook(() => {
      renderCount++
      return useDrawing(['vertices'])
    })
    const before = renderCount
    act(() => { fireLngLat(map, 'mousemove', 5, 5) })
    expect(renderCount).toBe(before)
  })

  it('cursor-only store update does not recompute getCompletedDistance', () => {
    const map = createMockMap()
    drawing.init(map as unknown as maplibregl.Map)
    drawing.setMode(Modes.LINE)
    act(() => {
      fireLngLat(map, 'click', 0, 0)
      fireLngLat(map, 'click', 1, 0)
      drawing.complete()
    })
    const spy = vi.spyOn(distanceModule, 'getCompletedDistance')
    renderHook(() => useDrawing(['geometries', 'vertices', 'cursor']))
    spy.mockClear()
    act(() => { fireLngLat(map, 'mousemove', 2, 0) })
    expect(spy).not.toHaveBeenCalled()
  })
})
