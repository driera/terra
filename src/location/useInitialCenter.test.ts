import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import useInitialCenter from './useInitialCenter'
import type { Coordinates, LocationResolver } from './types'
import logger from '../logger'

vi.mock('../logger', () => ({ default: { info: vi.fn() } }))

const barcelona: Coordinates = [2.1734, 41.3851]
const madrid: Coordinates = [-3.7, 40.4]

const resolves =
  (coords: Coordinates): LocationResolver =>
  () =>
    Promise.resolve(coords)

const rejects = (): LocationResolver => () => Promise.reject(new Error('failed'))

describe('useInitialCenter', () => {
  it('returns null initially', () => {
    const { result } = renderHook(() => useInitialCenter(rejects(), rejects()))
    expect(result.current).toBeNull()
  })

  it('returns browser coordinates when getBrowserLoc resolves', async () => {
    const { result } = renderHook(() => useInitialCenter(resolves(barcelona), rejects()))
    await act(async () => {})
    expect(result.current).toEqual(barcelona)
  })

  it('returns IP coordinates when getBrowserLoc rejects and getIpLoc resolves', async () => {
    const { result } = renderHook(() => useInitialCenter(rejects(), resolves(madrid)))
    await act(async () => {})
    expect(result.current).toEqual(madrid)
  })

  it('logs when browser location fails', async () => {
    renderHook(() => useInitialCenter(rejects(), resolves(madrid)))
    await act(async () => {})
    expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
      '[USER LOCATION] Browser API unavailable, trying IP-based location'
    )
  })

  it('logs the resolved coordinates', async () => {
    renderHook(() => useInitialCenter(resolves(barcelona), rejects()))
    await act(async () => {})
    expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
      `[USER LOCATION] Resolved to [${barcelona[0]}, ${barcelona[1]}]`
    )
  })

  it('returns null when both resolvers reject', async () => {
    const { result } = renderHook(() => useInitialCenter(rejects(), rejects()))
    await act(async () => {})
    expect(result.current).toBeNull()
  })

  it('logs when both resolvers fail', async () => {
    renderHook(() => useInitialCenter(rejects(), rejects()))
    await act(async () => {})
    expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
      '[USER LOCATION] Resolution failed, centering to fallback coords'
    )
  })

  it('does not update state after unmount', async () => {
    let resolvePromise!: (coords: Coordinates) => void
    const pendingResolver: LocationResolver = () =>
      new Promise((resolve) => {
        resolvePromise = resolve
      })

    const { result, unmount } = renderHook(() =>
      useInitialCenter(pendingResolver, rejects())
    )

    unmount()

    await act(async () => {
      resolvePromise(barcelona)
      await Promise.resolve()
    })

    expect(result.current).toBeNull()
  })
})
