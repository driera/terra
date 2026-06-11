import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type maplibregl from 'maplibre-gl'

vi.mock('./core')
vi.mock('./pointer')
vi.mock('./drawing')

import core from './core'
import * as pointer from './pointer'
import * as drawing from './drawing'
import mapApi, * as api from './index'

describe('mapApi/index', () => {
  beforeEach(() => {
    vi.mocked(core.register).mockClear()
    vi.mocked(core.destroy).mockClear()
    vi.mocked(pointer.init).mockClear()
    vi.mocked(pointer.destroy).mockClear()
    vi.mocked(drawing.init).mockClear()
    vi.mocked(drawing.destroy).mockClear()
  })

  afterEach(() => {
    delete window.map
  })

  describe('register', () => {
    it('delegates to core.register', () => {
      const fake = { id: 'm' } as unknown as maplibregl.Map
      mapApi.register(fake)
      expect(core.register).toHaveBeenCalledWith(fake)
    })

    it('triggers pointer.init with the same map instance', () => {
      const fake = { id: 'm' } as unknown as maplibregl.Map
      mapApi.register(fake)
      expect(pointer.init).toHaveBeenCalledWith(fake)
    })
  })

  describe('destroy', () => {
    it('delegates to core.destroy', () => {
      mapApi.destroy()
      expect(core.destroy).toHaveBeenCalledOnce()
    })

    it('triggers pointer.destroy', () => {
      mapApi.destroy()
      expect(pointer.destroy).toHaveBeenCalledOnce()
    })
  })

  describe('re-exports', () => {
    it('exposes addLayer, flyTo, zoomIn, zoomOut from core', () => {
      expect(mapApi.addLayer).toBe(core.addLayer)
      expect(mapApi.flyTo).toBe(core.flyTo)
      expect(mapApi.zoomIn).toBe(core.zoomIn)
      expect(mapApi.zoomOut).toBe(core.zoomOut)
    })
  })

  describe('public surface', () => {
    it('exposes drawing commands on the facade', () => {
      expect(mapApi.setDrawingMode).toBe(drawing.setMode)
      expect(mapApi.cancelDrawing).toBe(drawing.cancel)
      expect(mapApi.completeDrawing).toBe(drawing.complete)
    })

    it('limits named exports to hooks and read-side helpers — commands only via the facade', () => {
      expect(Object.keys(api).sort()).toEqual(
        ['default', 'formatDistance', 'Modes', 'useDrawing', 'usePointer'].sort(),
      )
    })
  })
})
