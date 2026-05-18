# Plan: Draw lines on the map

## Context

Terra's first drawing primitive. Users click the map to place vertices, see a live rubber-band preview following the cursor, and press Enter or "Done" to complete a line. Escape cancels the in-progress line. Completed lines stay visible when drawing mode is toggled off.

The feature introduces three new pieces:

1. **`src/api/GeometryStore.ts`** — pure state container (no map knowledge). Wraps the existing `Store<T>` generic from `src/api/Store.ts`. Stores `vertices`, `cursor`, and `geometries`. Used directly by the drawing plugin and exposed to React via a `useDrawing` hook.

2. **`src/api/drawing.ts`** — drawing plugin, following the same module shape as `src/api/pointer.ts`. Exports `init`/`destroy` (plugin lifecycle), `setMode`/`cancel`/`complete` (called by React), and `useDrawing` (React hook). Owns two MapLibre GeoJSON sources (`terra-draft`, `terra-features`) and two line layers registered on `init`. After every state mutation it calls a private `_syncToMap()` to push the current GeometryStore state into the map sources. Registered in `src/api/index.ts` alongside `pointer`.

3. **`src/controls/DrawingToolbar.tsx`** — React component with local mode state (`'line' | null`). Renders a toggle button (`aria-pressed`) and a "Done" button (visible when drawing). Handles Escape/Enter via a `document` keydown listener that is attached only while mode is active.

Patterns to follow:
- Plugin module shape: `init(map)` with re-entry guard, `destroy()`, module-level `_map` ref — see `src/api/pointer.ts`
- Store wrapper: constructor takes a reset factory, `subscribe()` returns an unsubscribe fn — see `src/api/Store.ts`
- React hook: `useSyncExternalStore` + `useMemo` for selective rerenders — see `usePointer` in `src/api/pointer.ts`
- CSS module per component, `aria-pressed` for toggle buttons — see `src/controls/MapControls.tsx`
- Test mock shape for map: extends the pointer mock (`{ on, off }`) with `{ once, isStyleLoaded, getSource, addSource, addLayer }` for source/layer registration and sync assertions

No new packages needed.

## Tasks

### 1. GeometryStore — pure state container

`GeometryStore` wraps `Store<GeometryState>` and exposes typed mutation methods. It has zero map knowledge — no MapLibre imports, no source calls.

Types to define:
- `TerraGeometry = GeoJSON.LineString | GeoJSON.Point | GeoJSON.Polygon`
- `GeometryState = { vertices: [number, number][], cursor: [number, number] | null, geometries: GeoJSON.Feature<TerraGeometry>[] }`
- `GeometryAttribute = keyof GeometryState`

Test cases (`src/api/GeometryStore.test.ts`):
- `appendVertex` pushes a coordinate to `vertices`; calling it twice results in two entries
- `setCursor` updates `cursor`; calling with `null` clears it
- `addGeometry` pushes a Feature to `geometries`; existing vertices are unaffected
- `clearDraft` resets `vertices` to `[]` and `cursor` to `null`; `geometries` is unchanged
- `reset` clears all state and all subscribers (inherits `Store.reset` behaviour — known seam, see code review obs 529; deferred)
- `subscribe` returns an unsubscribe function; after calling it, the subscriber no longer fires

What to implement (`src/api/GeometryStore.ts`):
- Class `GeometryStore` with a private `Store<GeometryState>` instance
- Methods: `appendVertex(coord)`, `setCursor(coord)`, `clearDraft()`, `addGeometry(feature)`, `get()`, `subscribe(cb)`, `reset()`

---

### 2. Drawing plugin — init, destroy, sources, layers

The drawing plugin registers two GeoJSON sources and two line layers when the map loads, and tears them down on destroy. No event handling yet.

Test cases (`src/api/drawing.test.ts`, init/destroy group):
- After `init()`: map has `addSource` called twice (`terra-draft`, `terra-features`) and `addLayer` called twice
- Sources are registered after `map.once('load', ...)` fires when style is not yet loaded (`isStyleLoaded` returns false)
- Sources are registered immediately when style is already loaded (`isStyleLoaded` returns true)
- `init()` called twice: destroys previous state before re-initialising (re-entry guard)
- `destroy()`: nulls map ref and resets store; calling it when not initialised is a no-op

(Event-listener removal is covered in Task 3, once handlers are introduced.)

What to implement:
- Module-level: `const store = new GeometryStore()`, `let _map`, `let _mode`
- `EMPTY_COLLECTION` constant (empty FeatureCollection)
- Layer spec constants: `DRAFT_LINE_LAYER` (id `terra-draft-line`, dashed blue) and `FEATURES_LINE_LAYER` (id `terra-features-line`, solid blue)
- `init(map)`: re-entry guard, store map ref, attach load-aware source+layer registration
- `destroy()`: remove event listeners, null map ref, reset store

---

### 3. Drawing plugin — click, mousemove, and _syncToMap

Event handlers respond to map clicks and mouse movement when mode is `'line'`. After each mutation, `_syncToMap()` pushes state to the map sources.

Test cases (drawing plugin, event/sync group):
- `onClick` when mode is `'line'`: appends vertex to store; `terra-draft` source receives a FeatureCollection with a LineString containing that vertex + cursor
- `onClick` when mode is `null`: no-op — store unchanged, sources unchanged
- `onMouseMove` when mode is `'line'`: updates cursor in store; `terra-draft` source receives updated FeatureCollection
- `onMouseMove` when mode is `null`: no-op
- Draft source receives empty FeatureCollection when fewer than 2 total coordinates (vertices + cursor)
- Draft source receives a LineString Feature when 2 or more coordinates are present
- `_syncToMap` is a no-op when `_map` is null (e.g. called after `destroy()` or before `init()`)
- Event listeners are detached on `destroy()` (`off('click', ...)`, `off('mousemove', ...)`)

What to implement:
- Private `_syncToMap()`: null-guards on `_map`; reads `store.get()`, builds draft coords as `[...vertices, ...(cursor ? [cursor] : [])]`, writes to `terra-draft` (empty FC if < 2 coords, LineString Feature if >= 2), writes `geometries` to `terra-features`
- `onClick(e)`: guards on `_mode === 'line'`, calls `store.appendVertex`, then `_syncToMap()`
- `onMouseMove(e)`: guards on `_mode === 'line'`, calls `store.setCursor`, then `_syncToMap()`
- `setMode(mode)`: sets `_mode`
- Attach `onClick` and `onMouseMove` to map in `init()`; detach in `destroy()`

---

### 4. Drawing plugin — complete, cancel, useDrawing

Finalisation commands and the React subscription hook.

Test cases (drawing plugin, commands/hook group):
- `complete()` with >= 2 vertices: adds a `Feature<LineString>` to geometries, clears draft; `terra-features` source receives the completed line; `terra-draft` source is cleared
- `complete()` with fewer than 2 vertices: no-op — geometries unchanged, sources unchanged
- `cancel()`: clears vertices and cursor; `terra-draft` cleared; `geometries` unchanged
- `useDrawing(['vertices'])`: rerenders when `vertices` changes; does not rerender when only `cursor` changes
- `useDrawing` unsubscribes from the store on unmount

What to implement:
- `complete()`: reads `store.get().vertices`, no-op if < 2; builds `Feature<LineString>` from vertices; calls `store.addGeometry`, `store.clearDraft`, `_syncToMap()`
- `cancel()`: calls `store.clearDraft`, `_syncToMap()`
- `getGeometry()`: returns `store.get()` snapshot
- `useDrawing(keys)`: follows the `usePointer` pattern — `useSyncExternalStore` with `useMemo`-wrapped selective subscribe

Commit: `feat: add GeometryStore and drawing plugin (#12)`

---

### 5. Wire drawing plugin into mapApi

Register the drawing plugin in `src/api/index.ts` so it initialises and destroys alongside the pointer plugin.

Test cases (`src/api/index.test.ts`):
- Existing tests continue to pass (no regressions)

What to implement (`src/api/index.ts`):
- Import `* as drawing from './drawing'`
- Add `drawing` to the `plugins` array
- Export `useDrawing`, `getGeometry`, `setMode as setDrawingMode`, `cancel as cancelDrawing`, `complete as completeDrawing` from `'./drawing'`
- Re-export `GeometryState`, `GeometryAttribute` types from `'./GeometryStore'` (their source of truth)

Commit: `feat: register drawing plugin in mapApi (#12)`

---

### 6. DrawingToolbar component

React toolbar that owns drawing mode state and issues commands to the plugin.

Test cases (`src/controls/DrawingToolbar.test.tsx`):
- Renders a "Draw line" button with `aria-pressed="false"` by default
- "Done" button is not present when mode is inactive
- Clicking "Draw line" sets `aria-pressed="true"` and calls `setDrawingMode('line')`
- Clicking "Draw line" again toggles back to `aria-pressed="false"` and calls `setDrawingMode(null)`
- "Done" button is visible when mode is active; clicking it calls `completeDrawing()`
- Escape keydown calls `cancelDrawing()` when mode is active; mode stays active
- Enter keydown calls `completeDrawing()` when mode is active; mode stays active
- Escape and Enter keydown are no-ops when mode is inactive
- axe: zero violations in both idle and active states

What to implement:
- `src/controls/DrawingToolbar.tsx`: local `mode` state; toggle button click handler updates local state **and** calls `setDrawingMode` directly (single source of truth — no `useEffect` mirroring mode → plugin); "Done" button rendered conditionally; a separate `useEffect` attaches the `document` keydown listener only when `mode === 'line'`
- `src/controls/DrawingToolbar.module.css`: active state for `[aria-pressed="true"]` button
- `src/App.tsx`: render `<DrawingToolbar />` in the layout

Commit: `feat: add DrawingToolbar with line mode toggle (#12)`
