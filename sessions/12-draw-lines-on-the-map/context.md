# Context: Draw lines on the map

## Problem

As a user, I want to draw lines on the map by clicking to place vertices so that I can mark paths and routes without leaving the app.

### Problem Space

First drawing primitive in Terra. Establishes the custom drawing infrastructure — GeoJSON sources, live preview layers, click-to-place vertex interaction — that future geometry types (polygons, points) will build on. The feature requires extending `mapApi` with a drawing plugin that owns its own sources and layers, a pure state container (GeometryStore), and a React toolbar for mode control.

### Edge Cases

- Drawing mode exited with an in-progress line → draft discarded, completed lines remain
- `complete()` called with fewer than 2 vertices → no-op, no invalid geometry produced
- `init()` called twice (React StrictMode) → re-entry guard destroys previous state first
- Mouse leaves map while drawing → cursor lost, rubber-band disappears; clicking resumes normally
- Enter/Escape keydown when mode is inactive → no-op

### Constraints

- All map interactions go through `mapApi` — drawing plugin follows the established plugin registry pattern (ADR 005)
- Reactive state uses `Store<T>` + `useX(keys)` hook pattern (ADR 004)
- No dblclick — unreliable on touch devices; completion via Enter key or "Done" button only
- Layer and source definitions are self-contained in the drawing plugin, not in `default-layers.ts`

## Solution

### Approach

Custom drawing plugin plugged into the `mapApi` plugin registry. Two pre-registered GeoJSON sources (`terra-draft`, `terra-features`) hold in-progress and completed geometries. The plugin is the single orchestrator: it intercepts map events, owns domain logic (what constitutes a valid line, when to finalize), mutates a pure GeometryStore, and explicitly syncs state to map sources after each mutation. Drawing mode (which tool is active) lives in React.

### Architecture

Three layers with clear separation:

- **GeometryStore** (`src/api/GeometryStore.ts`) — pure state container wrapping `Store<GeometryState>`. Stores `vertices`, `cursor`, `geometries`. Zero map knowledge. Exposes raw data methods and `subscribe()` for React hooks.
- **Drawing plugin** (`src/api/drawing.ts`) — single orchestrator. Registers sources + layers on `init()`, intercepts `click` and `mousemove` map events, owns domain logic (validation, feature construction), calls GeometryStore mutations, and explicitly calls `_syncToMap()` after each change.
- **DrawingToolbar** (`src/controls/DrawingToolbar.tsx`) — React component owning UI mode state (`'line' | null`). Calls plugin commands (`setMode`, `cancel`, `complete`). Handles Escape/Enter via `document` keydown listener when mode is active.

Plugin is registered in `src/api/index.ts` alongside the existing `pointer` plugin.

### Components

**`GeometryStore`** — Wraps `Store<GeometryState>`. State shape:
```typescript
type TerraGeometry = GeoJSON.LineString | GeoJSON.Point | GeoJSON.Polygon
type GeometryState = {
  vertices: [number, number][]
  cursor: [number, number] | null
  geometries: GeoJSON.Feature<TerraGeometry>[]
}
```
Methods: `appendVertex(coord)`, `setCursor(coord)`, `clearDraft()`, `addGeometry(feature)`, `get()`, `subscribe(cb)`, `reset()`.

**`drawing` plugin** — Module-level: `store: GeometryStore`, `_map`, `_mode`. Exports: `init`, `destroy`, `setMode`, `cancel`, `complete`, `getGeometry`, `useDrawing`. Sources `terra-draft` and `terra-features` registered on map load with empty FeatureCollections. Layer constants defined internally: `terra-draft-line` (dashed blue) and `terra-features-line` (solid blue). Private `_syncToMap()` builds draft FeatureCollection from `[...vertices, ...(cursor ? [cursor] : [])]` (rendered only when coords >= 2) and features FeatureCollection from `geometries`.

**`DrawingToolbar`** — Toggle button with `aria-pressed`. "Done" button appears when mode is active. `useEffect` attaches keydown handler on document when mode is active; detaches on cleanup.

### Dependencies

No new packages. Uses `GeoJSON` types from `@types/geojson` (already available via MapLibre).

### Data Flow

```
User clicks map
  → drawing plugin onClick (mode === 'line')
  → store.appendVertex(coord)
  → _syncToMap() → terra-draft source updated → MapLibre re-renders layer

User moves mouse
  → drawing plugin onMouseMove (mode === 'line')
  → store.setCursor(coord)
  → _syncToMap() → terra-draft updated with rubber-band segment

User presses Enter or clicks "Done"
  → DrawingToolbar calls drawing.complete()
  → plugin validates vertices.length >= 2
  → store.addGeometry(Feature<LineString>) + store.clearDraft()
  → _syncToMap() → terra-draft cleared, terra-features updated → completed line visible

User presses Escape
  → DrawingToolbar calls drawing.cancel()
  → store.clearDraft()
  → _syncToMap() → terra-draft cleared, geometries unchanged

User deactivates drawing mode (toolbar toggle)
  → DrawingToolbar calls drawing.setMode(null)
  → _mode = null → click/mousemove handlers become no-ops
  → completed lines remain visible in terra-features
```

### Error Handling

- `complete()` with < 2 vertices: silent no-op, no invalid GeoJSON produced.
- `_syncToMap()` when map not ready: `_map` is null-checked; sources are only queried after `map.on('load')` fires, so `getSource()` is safe.
- `init()` re-entry (React StrictMode): guard `if (_map) destroy()` at top of `init()`.
- Mouse leaves map with active drawing: `cursor` goes stale but is never pushed to `vertices`; next click resumes correctly.

### Testing

- **`GeometryStore.test.ts`** — pure unit tests, no map mock. Covers each mutation method and state transitions.
- **`drawing.test.ts`** — map mock (`{ on, off, once, isStyleLoaded, getSource, addSource, addLayer }`). Covers: source/layer registration, re-entry safety, event handler behaviour per mode, `complete()` validation, `cancel()`, `useDrawing` selective rerender and unsubscribe.
- **`DrawingToolbar.test.tsx`** — mocks `mapApi`. Covers: toggle button state, "Done" visibility, keydown handlers (Escape/Enter), mode-inactive no-op, axe zero violations.

## Open Questions

None — all design decisions resolved.
