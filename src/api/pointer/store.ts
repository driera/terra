import { Store } from '../../lib/Store'

export type PointerState = {
  coordinates: [number, number] | null
}

export type PointerAttribute = keyof PointerState

const defaultState = (): PointerState => ({ coordinates: null })

export const store = new Store<PointerState>(defaultState)
