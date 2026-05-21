import { describe, it, expect } from 'vitest'
import type GeoJSON from 'geojson'
import { getCompletedDistance, getDraftDistance, formatDistance } from './distance'

const makeLine = (coords: [number, number][]): GeoJSON.Feature<GeoJSON.LineString> => ({
  type: 'Feature',
  geometry: { type: 'LineString', coordinates: coords },
  properties: {},
})

describe('getCompletedDistance', () => {
  it('returns 0 for empty array', () => {
    expect(getCompletedDistance([])).toBe(0)
  })

  it('returns approximately 111000 m for 1 degree of longitude at equator', () => {
    const result = getCompletedDistance([makeLine([[0, 0], [1, 0]])])
    expect(result).toBeGreaterThan(110000)
    expect(result).toBeLessThan(112000)
  })

  it('sums lengths of multiple geometries', () => {
    const a = getCompletedDistance([makeLine([[0, 0], [1, 0]])])
    const b = getCompletedDistance([makeLine([[0, 0], [0, 1]])])
    const both = getCompletedDistance([makeLine([[0, 0], [1, 0]]), makeLine([[0, 0], [0, 1]])])
    expect(both).toBeCloseTo(a + b, 0)
  })
})

describe('getDraftDistance', () => {
  it('returns 0 for empty vertices with no cursor', () => {
    expect(getDraftDistance([], null)).toBe(0)
  })

  it('returns 0 for single vertex with no cursor', () => {
    expect(getDraftDistance([[0, 0]], null)).toBe(0)
  })

  it('returns distance between single vertex and cursor', () => {
    const result = getDraftDistance([[0, 0]], [1, 0])
    expect(result).toBeGreaterThan(110000)
    expect(result).toBeLessThan(112000)
  })

  it('returns distance between two vertices with no cursor', () => {
    const result = getDraftDistance([[0, 0], [1, 0]], null)
    expect(result).toBeGreaterThan(110000)
    expect(result).toBeLessThan(112000)
  })

  it('returns distance across all three points when cursor is present', () => {
    const twoPoints = getDraftDistance([[0, 0], [1, 0]], null)
    const withCursor = getDraftDistance([[0, 0], [1, 0]], [2, 0])
    expect(withCursor).toBeGreaterThan(twoPoints)
  })
})

describe('formatDistance', () => {
  it('formats 0 as "0 m"', () => {
    expect(formatDistance(0)).toBe('0 m')
  })

  it('rounds 340.7 to "341 m"', () => {
    expect(formatDistance(340.7)).toBe('341 m')
  })

  it('formats 1500 as "1500 m"', () => {
    expect(formatDistance(1500)).toBe('1500 m')
  })
})
