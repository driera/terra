import { afterEach, describe, expect, it, vi } from 'vitest'
import getIpLocation from './getIpLocation'

describe('getIpLocation', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resolves to [longitude, latitude] from valid response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ latitude: 41.3851, longitude: 2.1734 }),
      })
    )

    const result = await getIpLocation()
    expect(result).toEqual([2.1734, 41.3851])
  })

  it('rejects when response is missing coordinates', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ city: 'Barcelona' }),
      })
    )

    await expect(getIpLocation()).rejects.toThrow()
  })

  it('rejects when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))

    await expect(getIpLocation()).rejects.toThrow('network error')
  })
})
