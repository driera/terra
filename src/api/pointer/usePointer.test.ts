import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type maplibregl from 'maplibre-gl'
import * as pointer from './pointer'
import { usePointer } from './usePointer'

type MockMap = {
  on: ReturnType<typeof vi.fn>
  off: ReturnType<typeof vi.fn>
}

function createMockMap(): MockMap {
  return { on: vi.fn(), off: vi.fn() }
}

function fireHandler(mock: MockMap, eventName: string, event: unknown) {
  const call = mock.on.mock.calls.find(([name]) => name === eventName)
  if (!call) throw new Error(`No handler registered for ${eventName}`)
  const handler = call[1] as (e: unknown) => void
  handler(event)
}

describe('usePointer', () => {
  beforeEach(() => {
    pointer.destroy()
  })

  it('returns the current pointer state for the requested keys', () => {
    const map = createMockMap()
    pointer.init(map as unknown as maplibregl.Map)
    const { result } = renderHook(() => usePointer(['coordinates']))
    expect(result.current.coordinates).toBeNull()
  })

  it('rerenders when a subscribed key changes', () => {
    const map = createMockMap()
    pointer.init(map as unknown as maplibregl.Map)
    const { result } = renderHook(() => usePointer(['coordinates']))
    act(() => {
      fireHandler(map, 'mousemove', { lngLat: { lng: 1, lat: 2 } })
    })
    expect(result.current.coordinates).toEqual([1, 2])
  })

  it('does not rerender when set produces no actual change', () => {
    const map = createMockMap()
    pointer.init(map as unknown as maplibregl.Map)
    let renderCount = 0
    renderHook(() => {
      renderCount++
      return usePointer(['coordinates'])
    })
    const before = renderCount
    act(() => {
      fireHandler(map, 'mouseleave', {})
    })
    expect(renderCount).toBe(before)
  })

  it('unsubscribes on unmount', () => {
    const map = createMockMap()
    pointer.init(map as unknown as maplibregl.Map)
    let renderCount = 0
    const { unmount } = renderHook(() => {
      renderCount++
      return usePointer(['coordinates'])
    })
    unmount()
    const before = renderCount
    act(() => {
      fireHandler(map, 'mousemove', { lngLat: { lng: 5, lat: 6 } })
    })
    expect(renderCount).toBe(before)
  })
})
