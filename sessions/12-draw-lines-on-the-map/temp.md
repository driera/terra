# Plan: Draw lines on the map (Issue #12)

## Context

First drawing primitive in Terra. Establishes the custom drawing infrastructure — GeoJSON sources, live preview layers, click-to-place interaction — that future geometry types will build on. Drawing mode (active tool) lives in React; geometry data lives in a plugin-side GeometryStore that auto-syncs to pre-registered MapLibre sources.

## Architecture recap

- **`terra-draft` source** — in-progress line (updated on every mousemove, hot path)
- **`terra-features` source** — completed lines (updated on Enter or "Done" button)
- Both pre-registered on `mapApi.register()` inside `drawing.init()`, with empty FeatureCollections
- **Drawing plugin** owns sources, layers, and all map event handling (click, mousemove only — no dblclick)
- **DrawingToolbar** owns UI mode state (React); calls `drawing.setMode()`, `drawing.cancel()`, `drawing.complete()`
- **GeometryStore** = pure state container only. Zero map knowledge. Stores `vertices`, `cursor`, `geometries`. Exposes raw data methods + `subscribe()` for React. No `attachMap`, no sync.
- **Plugin** = single orchestrator. Owns events → domain logic → store mutations → explicit `_syncToMap()`. After each handler/command, builds FeatureCollections and calls `getSource().setData()` directly.
- **No dblclick** — completion is Enter key or "Done" button (works on all devices including touch)

---

## Tasks

### Group 1 — GeometryStore

**1. Create `src/api/GeometryStore.ts`**

New class wrapping `Store<GeometryState>`. Geometry-aware: tracks `_vertices` and `_cursor` as private fields, exposes only built geometries via the store.

```typescript
type TerraGeometry = GeoJSON.LineString | GeoJSON.Point | GeoJSON.Polygon

type GeometryState = {
  vertices: [number, number][]
  cursor: [number, number] | null
  geometries: GeoJSON.Feature<TerraGeometry>[]
}
export type GeometryAttribute = keyof GeometryState
```

Raw data methods only — no map knowledge, no sync:
- `appendVertex(coord)` — push to vertices
- `setCursor(coord)` — update cursor
- `clearDraft()` — reset vertices + cursor, leave geometries untouched
- `addGeometry(feature)` — push to geometries

`get()`, `subscribe(cb)`, `reset()` delegate to inner `Store<GeometryState>`.

**2. Create `src/api/GeometryStore.test.ts`**

No map mock needed — pure state tests only.

Tests: `appendVertex` pushes coord to vertices, `setCursor` updates cursor, `addGeometry` pushes feature, `clearDraft` resets vertices + cursor without touching geometries, `reset` clears all state and subscribers.

---

### Group 2 — Drawing plugin

**3. Create `src/api/drawing.ts`**

Module-level state:
```typescript
const store = new GeometryStore()
let _map: maplibregl.Map | null = null
let _mode: 'line' | null = null
```

Exported API:
```typescript
export const init = (map: maplibregl.Map): void      // re-entry safe, registers sources+layers, attaches handlers
export const destroy = (): void                       // removes handlers, resets
export const setMode = (mode: 'line' | null): void   // called by React toolbar
export const cancel = (): void                        // clears draft, mode stays
export const complete = (): void                      // finalizes line if >= 2 vertices
export const getGeometry = (): GeometryState          // snapshot
export const useDrawing = (keys: GeometryAttribute[]): GeometryState  // hook, selective subscription
```

Source + layer registration in `init()` (load-aware):
```typescript
const register = () => {
  map.addSource('terra-draft', { type: 'geojson', data: EMPTY })
  map.addSource('terra-features', { type: 'geojson', data: EMPTY })
  map.addLayer(DRAFT_LINE_LAYER)    // dashed, blue
  map.addLayer(FEATURES_LINE_LAYER) // solid, blue
}
map.isStyleLoaded() ? register() : map.once('load', register)
```

Layer constants (defined in drawing.ts, not default-layers.ts):
- `terra-draft-line`: `type: 'line'`, `source: 'terra-draft'`, dashed paint
- `terra-features-line`: `type: 'line'`, `source: 'terra-features'`, solid paint

Map event handlers (only act when `_mode === 'line'`):
- `onClick`: calls `store.appendVertex([e.lngLat.lng, e.lngLat.lat])`
- `onMouseMove`: calls `store.setCursor([e.lngLat.lng, e.lngLat.lat])`

No `dblclick` handler. Completion via `complete()` only (Enter / "Done" button).

Plugin domain logic + sync — private `_syncToMap()` called after every mutation:
```typescript
const _syncToMap = () => {
  const { vertices, cursor, geometries } = store.get()
  const coords = [...vertices, ...(cursor ? [cursor] : [])]
  draftSource.setData({ type: 'FeatureCollection', features: coords.length >= 2 ? [buildLineFeature(coords)] : [] })
  featuresSource.setData({ type: 'FeatureCollection', features: geometries })
}
```

- `onClick`: `store.appendVertex(coord)` → `_syncToMap()`
- `onMouseMove`: `store.setCursor(coord)` → `_syncToMap()`
- `complete()`: validates >= 2 vertices, `store.addGeometry(buildLineFeature(vertices))` + `store.clearDraft()` → `_syncToMap()`
- `cancel()`: `store.clearDraft()` → `_syncToMap()`

**4. Create `src/api/drawing.test.ts`**

Mock map: `{ on, off, once, isStyleLoaded, getSource, addSource, addLayer }` all `vi.fn()`. `getSource` returns `{ setData: vi.fn() }`.

Tests:
- `init()` registers sources and layers after load
- `init()` re-entry destroys previous state first
- `destroy()` removes all event listeners and resets store
- `setMode('line')` sets operational mode
- `onClick` appends vertex + syncs draft source when mode === 'line', no-ops otherwise
- `onMouseMove` updates cursor + syncs draft source when mode === 'line'
- `cancel()` clears draft + syncs; geometries unchanged; terra-features source unchanged
- `complete()` builds `Feature<LineString>`, syncs both sources when >= 2 vertices
- `complete()` no-ops when < 2 vertices
- `useDrawing` hook: selective rerender, unsubscribe on unmount

---

### Group 3 — mapApi registration

**5. Modify `src/api/index.ts`**

```typescript
import * as drawing from './drawing'
const plugins: Plugin[] = [pointer, drawing]
```

Add exports:
```typescript
export { useDrawing, getGeometry, setMode as setDrawingMode, cancel as cancelDrawing, complete as completeDrawing } from './drawing'
export type { GeometryState, GeometryAttribute } from './drawing'
```

---

### Group 4 — DrawingToolbar

**6. Create `src/controls/DrawingToolbar.tsx`**

React component. Local `mode` state: `'line' | null`.

On mode change:
- Calls `drawing.setMode(mode)` to sync plugin
- Attaches/detaches `document` keydown handler when mode is active:
  - `Escape` → `drawing.cancel()` (mode stays active)
  - `Enter` → `drawing.complete()` (mode stays active)

Markup:
```tsx
<div role="toolbar" aria-label="Drawing tools">
  <button
    type="button"
    aria-label="Draw line"
    aria-pressed={mode === 'line'}
    onClick={() => setMode(m => m === 'line' ? null : 'line')}
  >
    Line
  </button>
  {mode === 'line' && (
    <button type="button" onClick={() => drawing.complete()}>Done</button>
  )}
</div>
```

When `mode === 'line'`, "Draw line" button shows active state via CSS; "Done" button appears.

**7. Create `src/controls/DrawingToolbar.test.tsx`**

Mock `drawing` module with `vi.mock('../api')`.

Tests:
- Renders "Draw line" button with `aria-pressed="false"` by default; "Done" not visible
- Click "Draw line" → `aria-pressed="true"`, `setDrawingMode('line')` called, "Done" visible
- Click "Draw line" again → toggles back, `setDrawingMode(null)` called, "Done" hidden
- Click "Done" → `completeDrawing()` called
- Escape keydown calls `cancelDrawing()` when mode active
- Enter keydown calls `completeDrawing()` when mode active
- Keydown no-ops when mode is null
- axe: zero violations

**8. Create `src/controls/DrawingToolbar.module.css`**

Minimal: active state styling for `aria-pressed="true"` button.

---

### Group 5 — App wiring

**9. Modify `src/App.tsx`**

Add `<DrawingToolbar />` to the layout.

---

## Critical files

| File | Action |
|------|--------|
| `src/api/GeometryStore.ts` | Create |
| `src/api/GeometryStore.test.ts` | Create |
| `src/api/drawing.ts` | Create |
| `src/api/drawing.test.ts` | Create |
| `src/api/index.ts` | Modify — add plugin + exports |
| `src/controls/DrawingToolbar.tsx` | Create |
| `src/controls/DrawingToolbar.test.tsx` | Create |
| `src/controls/DrawingToolbar.module.css` | Create |
| `src/App.tsx` | Modify — add DrawingToolbar |

**Not touched:** `src/api/core.ts`, `src/canvas/MapCanvas.tsx`, `src/canvas/default-layers.ts` (drawing plugin is self-contained).

---

## Verification

```bash
pnpm test:run     # All tests pass including new drawing + toolbar suites
pnpm check-types  # No TypeScript errors
pnpm lint         # No lint violations
```

Manual: launch dev server, activate line drawing mode, click to place vertices, observe rubber-band preview, press Enter or click "Done" to complete, Escape to cancel draft. Completed lines persist on mode toggle.
