import { describe, it, expect, vi } from 'vitest'
import type GeoJSON from 'geojson'
import { GeometryStore } from './GeometryStore'
import type { TerraGeometry } from './GeometryStore'

function makeStore() {
  return new GeometryStore()
}

describe('GeometryStore', () => {
  describe('appendVertex', () => {
    it('pushes a coordinate to vertices', () => {
      const store = makeStore()
      store.appendVertex([1, 2])
      expect(store.get().vertices).toEqual([[1, 2]])
    })

    it('accumulates multiple vertices', () => {
      const store = makeStore()
      store.appendVertex([1, 2])
      store.appendVertex([3, 4])
      expect(store.get().vertices).toEqual([[1, 2], [3, 4]])
    })
  })

  describe('setCursor', () => {
    it('updates cursor', () => {
      const store = makeStore()
      store.setCursor([5, 6])
      expect(store.get().cursor).toEqual([5, 6])
    })

    it('clears cursor when called with null', () => {
      const store = makeStore()
      store.setCursor([5, 6])
      store.setCursor(null)
      expect(store.get().cursor).toBeNull()
    })
  })

  describe('addGeometry', () => {
    it('pushes a Feature to geometries', () => {
      const store = makeStore()
      const feature: GeoJSON.Feature<TerraGeometry> = {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
        properties: {},
      }
      store.addGeometry(feature)
      expect(store.get().geometries).toHaveLength(1)
      expect(store.get().geometries[0]).toBe(feature)
    })

    it('does not affect existing vertices', () => {
      const store = makeStore()
      store.appendVertex([1, 2])
      const feature: GeoJSON.Feature<TerraGeometry> = {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
        properties: {},
      }
      store.addGeometry(feature)
      expect(store.get().vertices).toEqual([[1, 2]])
    })
  })

  describe('clearDraft', () => {
    it('resets vertices and cursor; geometries unchanged', () => {
      const store = makeStore()
      store.appendVertex([1, 2])
      store.setCursor([3, 4])
      const feature: GeoJSON.Feature<TerraGeometry> = {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
        properties: {},
      }
      store.addGeometry(feature)
      store.clearDraft()
      expect(store.get().vertices).toEqual([])
      expect(store.get().cursor).toBeNull()
      expect(store.get().geometries).toHaveLength(1)
    })
  })

  describe('reset', () => {
    it('clears all state and all subscribers', () => {
      const store = makeStore()
      store.appendVertex([1, 2])
      const cb = vi.fn()
      store.subscribe(cb)
      store.reset()
      expect(store.get().vertices).toEqual([])
      expect(store.get().cursor).toBeNull()
      expect(store.get().geometries).toEqual([])
      store.appendVertex([3, 4])
      expect(cb).not.toHaveBeenCalled()
    })
  })

  describe('subscribe', () => {
    it('returns an unsubscribe function that stops future notifications', () => {
      const store = makeStore()
      const cb = vi.fn()
      const unsubscribe = store.subscribe(cb)
      store.appendVertex([1, 2])
      expect(cb).toHaveBeenCalledOnce()
      unsubscribe()
      store.appendVertex([3, 4])
      expect(cb).toHaveBeenCalledOnce()
    })
  })
})
