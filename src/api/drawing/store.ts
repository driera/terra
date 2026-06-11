import type GeoJSON from 'geojson'
import { Store } from '../../lib/Store'
import type { Subscriber } from '../../lib/Store'

export type TerraGeometry = GeoJSON.LineString | GeoJSON.Point | GeoJSON.Polygon

export type GeometryState = {
  vertices: [number, number][]
  cursor: [number, number] | null
  geometries: GeoJSON.Feature<TerraGeometry>[]
}

export type GeometryAttribute = keyof GeometryState

const defaultState = (): GeometryState => ({
  vertices: [],
  cursor: null,
  geometries: [],
})

export class GeometryStore {
  private store = new Store<GeometryState>(defaultState)

  get(): GeometryState {
    return this.store.get()
  }

  subscribe(cb: Subscriber<GeometryState>): () => void {
    return this.store.subscribe(cb)
  }

  reset(): void {
    this.store.reset()
  }

  appendVertex(coord: [number, number]): void {
    const { vertices } = this.store.get()
    this.store.set({ vertices: [...vertices, coord] })
  }

  setCursor(coord: [number, number] | null): void {
    this.store.set({ cursor: coord })
  }

  clearDraft(): void {
    this.store.set({ vertices: [], cursor: null })
  }

  addGeometry(feature: GeoJSON.Feature<TerraGeometry>): void {
    const { geometries } = this.store.get()
    this.store.set({ geometries: [...geometries, feature] })
  }
}

export const geometryStore = new GeometryStore()
