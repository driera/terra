import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type maplibregl from 'maplibre-gl'
import * as pointer from './pointer'

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

describe('pointer', () => {
  beforeEach(() => {
    pointer.destroy()
  })

  describe('init', () => {
    it('attaches mousemove and mouseleave listeners on the map', () => {
      const map = createMockMap()
      pointer.init(map as unknown as maplibregl.Map)
      expect(map.on).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(map.on).toHaveBeenCalledWith('mouseleave', expect.any(Function))
    })
  })

  describe('mousemove', () => {
    it('updates store coordinates to [lng, lat]', () => {
      const map = createMockMap()
      pointer.init(map as unknown as maplibregl.Map)
      fireHandler(map, 'mousemove', { lngLat: { lng: 2.1734, lat: 41.3851 } })
      expect(pointer.getPointer().coordinates).toEqual([2.1734, 41.3851])
    })
  })

  describe('mouseleave', () => {
    it('clears coordinates to null', () => {
      const map = createMockMap()
      pointer.init(map as unknown as maplibregl.Map)
      fireHandler(map, 'mousemove', { lngLat: { lng: 1, lat: 2 } })
      fireHandler(map, 'mouseleave', {})
      expect(pointer.getPointer().coordinates).toBeNull()
    })
  })

  describe('destroy', () => {
    it('removes both listeners and resets the store', () => {
      const map = createMockMap()
      pointer.init(map as unknown as maplibregl.Map)
      fireHandler(map, 'mousemove', { lngLat: { lng: 1, lat: 2 } })
      pointer.destroy()
      expect(map.off).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(map.off).toHaveBeenCalledWith('mouseleave', expect.any(Function))
      expect(pointer.getPointer().coordinates).toBeNull()
    })

    it('is a no-op when called before init', () => {
      expect(() => pointer.destroy()).not.toThrow()
    })
  })

  describe('init re-entry', () => {
    it('detaches listeners from the previous map when init is called twice', () => {
      const first = createMockMap()
      const second = createMockMap()
      pointer.init(first as unknown as maplibregl.Map)
      pointer.init(second as unknown as maplibregl.Map)
      expect(first.off).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(first.off).toHaveBeenCalledWith('mouseleave', expect.any(Function))
      expect(second.on).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(second.on).toHaveBeenCalledWith('mouseleave', expect.any(Function))
    })
  })

  describe('getPointer', () => {
    it('returns the current store snapshot', () => {
      expect(pointer.getPointer()).toEqual({ coordinates: null })
    })
  })

  describe('usePointer', () => {
    it('returns the current pointer state for the requested keys', () => {
      const map = createMockMap()
      pointer.init(map as unknown as maplibregl.Map)
      const { result } = renderHook(() => pointer.usePointer(['coordinates']))
      expect(result.current.coordinates).toBeNull()
    })

    it('rerenders when a subscribed key changes', () => {
      const map = createMockMap()
      pointer.init(map as unknown as maplibregl.Map)
      const { result } = renderHook(() => pointer.usePointer(['coordinates']))
      act(() => {
        fireHandler(map, 'mousemove', { lngLat: { lng: 1, lat: 2 } })
      })
      expect(result.current.coordinates).toEqual([1, 2])
    })

    // Selective rerender filtering across unrelated keys is verified end-to-end
    // here via the no-op set path. Cross-domain isolation (e.g. camera key changes
    // not rerendering pointer subscribers) will be verified once a second domain
    // exists in PointerState — currently only `coordinates` is defined.
    it('does not rerender when set produces no actual change', () => {
      const map = createMockMap()
      pointer.init(map as unknown as maplibregl.Map)
      let renderCount = 0
      renderHook(() => {
        renderCount++
        return pointer.usePointer(['coordinates'])
      })
      const before = renderCount
      act(() => {
        // coordinates is already null; mouseleave sets it to null again — no change.
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
        return pointer.usePointer(['coordinates'])
      })
      unmount()
      const before = renderCount
      act(() => {
        fireHandler(map, 'mousemove', { lngLat: { lng: 5, lat: 6 } })
      })
      expect(renderCount).toBe(before)
    })
  })
})
