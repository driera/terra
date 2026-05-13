import { describe, it, expect, vi } from 'vitest'
import { Store } from './Store'

type FixtureState = { a: number; b: string }

const factory = (): FixtureState => ({ a: 0, b: 'init' })

describe('Store', () => {
  describe('get', () => {
    it('returns the initial state from the resetData factory', () => {
      const store = new Store<FixtureState>(factory)
      expect(store.get()).toEqual({ a: 0, b: 'init' })
    })
  })

  describe('set', () => {
    it('updates state with the partial values', () => {
      const store = new Store<FixtureState>(factory)
      store.set({ a: 42 })
      expect(store.get()).toEqual({ a: 42, b: 'init' })
    })

    it('notifies subscribers with the new data and the changed keys', () => {
      const store = new Store<FixtureState>(factory)
      const cb = vi.fn()
      store.subscribe(cb)
      store.set({ a: 1, b: 'hello' })
      expect(cb).toHaveBeenCalledWith({ a: 1, b: 'hello' }, ['a', 'b'])
    })

    it('does not notify when no key actually changed', () => {
      const store = new Store<FixtureState>(factory)
      const cb = vi.fn()
      store.subscribe(cb)
      store.set({ a: 0 })
      expect(cb).not.toHaveBeenCalled()
    })

    it('only includes actually-changed keys when partial contains unchanged values', () => {
      const store = new Store<FixtureState>(factory)
      const cb = vi.fn()
      store.subscribe(cb)
      store.set({ a: 5, b: 'init' })
      expect(cb).toHaveBeenCalledWith({ a: 5, b: 'init' }, ['a'])
    })
  })

  describe('subscribe', () => {
    it('returns an unsubscribe function that removes the callback', () => {
      const store = new Store<FixtureState>(factory)
      const cb = vi.fn()
      const unsubscribe = store.subscribe(cb)
      unsubscribe()
      store.set({ a: 1 })
      expect(cb).not.toHaveBeenCalled()
    })

    it('supports multiple independent subscribers', () => {
      const store = new Store<FixtureState>(factory)
      const cbA = vi.fn()
      const cbB = vi.fn()
      store.subscribe(cbA)
      store.subscribe(cbB)
      store.set({ a: 1 })
      expect(cbA).toHaveBeenCalledOnce()
      expect(cbB).toHaveBeenCalledOnce()
    })
  })

  describe('subscribeOnce', () => {
    it('fires on the next set and never again', () => {
      const store = new Store<FixtureState>(factory)
      const cb = vi.fn()
      store.subscribeOnce(cb)
      store.set({ a: 1 })
      store.set({ a: 2 })
      expect(cb).toHaveBeenCalledOnce()
    })
  })

  describe('reset', () => {
    it('restores state from the factory', () => {
      const store = new Store<FixtureState>(factory)
      store.set({ a: 99, b: 'changed' })
      store.reset()
      expect(store.get()).toEqual({ a: 0, b: 'init' })
    })

    it('clears all subscribers', () => {
      const store = new Store<FixtureState>(factory)
      const cb = vi.fn()
      store.subscribe(cb)
      store.reset()
      store.set({ a: 1 })
      expect(cb).not.toHaveBeenCalled()
    })
  })
})
