import { describe, it, expect, vi, beforeEach } from 'vitest'
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

  describe('getPointer', () => {
    it('returns the current store snapshot', () => {
      expect(pointer.getPointer()).toEqual({ coordinates: null })
    })
  })
})
