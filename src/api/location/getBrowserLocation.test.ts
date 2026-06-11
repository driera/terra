import { describe, expect, it, vi } from 'vitest'
import getBrowserLocation from './getBrowserLocation'

describe('getBrowserLocation', () => {
  it('resolves to [longitude, latitude] on success', async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success: PositionCallback) =>
        success({ coords: { longitude: 2.1734, latitude: 41.3851 } } as GeolocationPosition)
      ),
    }
    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
    })

    const result = await getBrowserLocation()
    expect(result).toEqual([2.1734, 41.3851])
  })

  it('rejects when geolocation calls the error callback', async () => {
    const error = new Error('denied')
    const mockGeolocation = {
      getCurrentPosition: vi.fn((_: PositionCallback, reject: PositionErrorCallback) =>
        reject(error as unknown as GeolocationPositionError)
      ),
    }
    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
    })

    await expect(getBrowserLocation()).rejects.toBe(error)
  })
})
