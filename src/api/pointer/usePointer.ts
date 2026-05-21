import { useMemo, useSyncExternalStore } from 'react'
import { store } from './store'
import type { PointerState, PointerAttribute } from './store'

export const usePointer = (keys: PointerAttribute[]): PointerState => {
  const keysKey = keys.join(',')

  const subscribe = useMemo(
    () => (notify: () => void) =>
      store.subscribe((_, changedKeys) => {
        if (keys.length === 0 || changedKeys.some((k) => keys.includes(k))) {
          notify()
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keysKey]
  )

  return useSyncExternalStore(subscribe, () => store.get())
}
